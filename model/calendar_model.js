const sanitizeHtml = require('sanitize-html');
module.exports = {
	add:function(name,description,amount,color,user_id,connection,cb){
		var q = 'INSERT INTO `Calendars`(`name`,`description`,`color`,`user_id`,`creationDate`) VALUES(?,?,?,?,NOW())';
		connection.query(q,[name,description,color,user_id] ,function(err, rows, fields) {
			if (!err){
				if(rows){
					for (let i = 0; i < amount; i++) {
						module.exports.addDay(rows.insertId,i,connection,function(error,day){
							//
						});
					}
					cb(null,rows.insertId);
				}else{
					cb('Err',null);
				}
			}else{
				cb('Err',null);
			}
		});
	},
	addDay:function(calendar_id,order,connection,cb){
		var q = 'INSERT INTO `Days`(`calendar_id`,`order`, `date`) VALUES(?,?, now() + interval ? day)';
		connection.query(q,[calendar_id,order, order] ,function(err, rows, fields) {
			if (!err){
				if(rows){
					cb(null,rows.insertId);
				}else{
					cb('Err',null);
				}
			}else{
				cb('Err',null);
			}
		});
	},
	get:function(user_id, searchTerm, connection,cb){
		if(searchTerm){
			searchTerm = '%'+searchTerm+'%';
			let q = 'SELECT \
				`Calendars`.`id`, \
				`Calendars`.`name`, \
				`Calendars`.`description`, \
				`Calendars`.`creationDate`, \
				`Calendars`.`color` \
			FROM `Calendars` \
			JOIN `Users` ON `Users`.`id` = `Calendars`.`user_id`\
			WHERE `Users`.`id` = ? \
			AND (`Calendars`.`name` LIKE ? OR `Calendars`.`description` LIKE ?)';
			connection.query(q,[user_id, searchTerm, searchTerm] ,function(err, rows, fields) {
				if (!err){
					cb(null,rows);
				}else{
					cb('Err',null);
				}
			});
		}else{
			let q = 'SELECT \
				`Calendars`.`id`, \
				`Calendars`.`name`, \
				`Calendars`.`description`, \
				`Calendars`.`creationDate`, \
				`Calendars`.`color` \
			FROM `Calendars` \
			JOIN `Users` ON `Users`.`id` = `Calendars`.`user_id`\
			WHERE `Users`.`id` = ?';
			connection.query(q,[user_id] ,function(err, rows, fields) {
				if (!err){
					cb(null,rows);
				}else{
					cb('Err',null);
				}
			});
		}
	},
	delete:function(id,user_id,connection,cb){
		var q = 'DELETE FROM `Calendars` \
		WHERE `Calendars`.`id` = ? AND `Calendars`.`user_id` = ?';
		connection.query(q,[id,user_id] ,function(err, rows, fields) {
			if (!err){
				if(rows){
					cb(null,true);
				}else{
					cb('Err',null);
				}
			}else{
				console.log(err);
				cb('Err',null);
			}
		});
	},
	getCalendar:function(user_id,calendar_id,connection,cb){
		var q = 'SELECT \
		`Calendars`.`id`, \
		`Calendars`.`name`, \
		`Calendars`.`description`, \
		`Calendars`.`creationDate`, \
		`Calendars`.`color`, \
		`Days`.`id` AS `day_id`, \
		`Days`.`order`, \
		`Days`.`status`, \
		`Days`.`date`, \
		`DayActivities`.`id` AS `da_id`, \
		`DayActivities`.`text` \
		FROM `Calendars` \
		JOIN `Users` ON `Users`.`id` = `Calendars`.`user_id`\
		LEFT JOIN `Days` ON `Days`.`calendar_id` = `Calendars`.`id`\
		LEFT JOIN `DayActivities` ON `Days`.`id` = `DayActivities`.`day_id`\
		WHERE `Users`.`id` = ? \
		AND `Calendars`.`id` = ?\
		ORDER BY `Days`.`order`,`DayActivities`.`id`';
		connection.query(q,[user_id,calendar_id] ,function(err, rows, fields) {
			if (!err){
				let last_id = -1;
				let i = -1;
				let out = {};
				if(rows.length > 0){
					out = {
						'id':rows[0].id,
						'name':rows[0].name,
						'description':rows[0].description,
						'creationDate':rows[0].creationDate,
						'color':rows[0].color,
						'days':[]
					}
				}
				rows.forEach(row => {
					if(row.day_id != last_id){
						i++;
						out.days.push({
							'id':row.day_id,
							'order':row.order,
							'status':row.status,
							'date':row.date,
							'activities':[]
						})
						last_id = row.day_id;
					}
					if(row.da_id){
						out.days[i].activities.push({
							'id':row.da_id,
							'text':row.text,
						})
					}
				});
				cb(null,out);
			}else{
				cb('Err',null);
			}
		});
	},
	editDay:function(user_id,calendar_id,id,changes,connection,cb){
		let canContinue = false;
		let key = null;
		let value = null;

		if(changes.hasOwnProperty('status')){
			key = '`status`';
			value = parseInt(changes['status']);
			canContinue = true;
		}
		if(!canContinue) return cb('Err',null);
		
		var q = 'UPDATE `Days`\
		JOIN `Calendars` ON `Calendars`.`id` = `Days`.`calendar_id`\
		JOIN `Users` ON `Users`.`id` = `Calendars`.`user_id`\
		SET `Days`.::COL:: = ?\
		WHERE `Days`.`id` = ?\
		AND `Calendars`.`id` = ?\
		AND `Users`.`id` = ?';
		q = q.replace('::COL::', key);
		connection.query(q,[value,id,calendar_id,user_id] ,function(err, rows, fields) {
			if (!err){
				cb(null,true);
			}else{
				cb('Err',null);
			}
		});
	},
	addActivity:function(user_id,day_id,text,connection,cb){
		var q = 'INSERT INTO `DayActivities`(`text`,`day_id`) VALUES(?,?)';
		connection.query(q,[sanitizeHtml(text), day_id] ,function(err, rows, fields) {
			if (!err){
				if(rows){
					cb(null,rows.insertId);
				}else{
					cb('Err',null);
				}
			}else{
				cb('Err',null);
			}
		});
	},
	deleteActivity:function(user_id, challenge_id, day_id, activity_id, connection, cb){
		var q = 'DELETE `DayActivities` \
		FROM `DayActivities` \
		JOIN `Days` ON `Days`.`id` = `DayActivities`.`day_id` \
		JOIN `Calendars` ON `Calendars`.`id` = `Days`.`calendar_id` \
		WHERE `DayActivities`.`id` = ? \
		AND `Days`.`id` = ? \
		AND `Calendars`.`id` = ? \
		AND `Calendars`.`user_id` = ?';
		connection.query(q,[activity_id, day_id, challenge_id, user_id] ,function(err, rows, fields) {
			if (!err){
				if(rows){
					cb(null,true);
				}else{
					cb('Err',null);
				}
			}else{
				console.log(err);
				cb('Err',null);
			}
		});
	},
	editActivity:function(user_id, challenge_id, day_id, activity_id, changes, connection, cb){
		let canContinue = false;
		let key = null;
		let value = null;

		if(changes.hasOwnProperty('text')){
			key = '`text`';
			value = sanitizeHtml(changes['text']);
			canContinue = true;
		}
		if(!canContinue) return cb('Err',null);

		var q = 'UPDATE `DayActivities`\
		JOIN `Days` ON `Days`.`id` = `DayActivities`.`day_id` \
		JOIN `Calendars` ON `Calendars`.`id` = `Days`.`calendar_id`\
		JOIN `Users` ON `Users`.`id` = `Calendars`.`user_id`\
		SET `DayActivities`.::COL:: = ?\
		WHERE `DayActivities`.`id` = ?\
		AND `Days`.`id` = ? \
		AND `Calendars`.`id` = ?\
		AND `Users`.`id` = ?';
		q = q.replace('::COL::', key);
		connection.query(q,[value, activity_id, day_id, challenge_id, user_id] ,function(err, rows, fields) {
			if (!err){
				cb(null,true);
			}else{
				cb('Err',null);
			}
		});
	},
};