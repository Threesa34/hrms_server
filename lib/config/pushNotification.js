    var FCM = require('fcm-node');
    var gcm = require('node-gcm');
    var env = require('./env')
    var serverKey = env.gcmKey; //put your server key here

    var fcm = new FCM(serverKey);
    var sender = new gcm.Sender(serverKey);

    module.exports = {
        sendNotification:function(notificationSetting)
        {
            var message = new gcm.Message({
                notification: {
                    title: notificationSetting.title,
                    icon: notificationSetting.icon,
                    body: notificationSetting.message
                }
            });

            sender.send(message, { registrationTokens: notificationSetting.registrationTokens }, function (err, response) {
                if(err) console.error(err);
                else    console.log(response);
              });
        }
    };