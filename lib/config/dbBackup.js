

var env = require('./env');
var fs = require('fs');
var cryptconf = require('./crypt.config');
var mysqldump = require('mysqldump');
var schedule = require('node-schedule');
var moment = require('moment');

var mailer = require('../config/mailer.config');

module.exports = {

    GenerateBackup: function()
    {
        var j = schedule.scheduleJob('* * 4 * * *', function(){
            mysqldump({
                connection: {
                    host: cryptconf.decrypt(env.host),
                    user: cryptconf.decrypt(env.user),
                    password: env.password,
                    database: cryptconf.decrypt(env.database),
                },
                dumpToFile: './dbBackup/'+cryptconf.decrypt(env.database)+moment(new Date()).format("YYYY-MM-DD")+'.sql',
            });
          });

          var i = schedule.scheduleJob('1 30 5 * * *', function(){
           
            const mailOptions = {
                from: cryptconf.decrypt(env.sendermail), // sender address
                to: "service.lninfotech@gmail.com", // list of receivers
                subject: "DB_BCK "+cryptconf.decrypt(env.database), // Subject line
                html: "", // plain text body
                attachments:[
                    {
                        path: './dbBackup/'+cryptconf.decrypt(env.database)+moment(new Date()).format("YYYY-MM-DD")+'.sql',
                    }
                ]
            };
       
       
            mailer.transporter.sendMail(mailOptions, function (err, info) {
                if(err)
                  console.log(err)
                else
                  console.log(info);
             });

          });
    }

}