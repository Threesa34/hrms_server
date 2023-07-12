var nodemailer = require('nodemailer');
var cryptconf = require('../config/crypt.config');
var env = require('./env');
module.exports = {
    transporter : nodemailer.createTransport({
        host: 'smtp.gmail.com',
        secureConnection: true,
        port: 465,
        pool:true,					
        transportMethod: 'SMTP',
        secure: true, // use SSL,          
                            // you can try with TLS, but port is then 587
        auth: {
<<<<<<< HEAD
            user: cryptconf.decrypt(env.sendermail),
            // pass:  cryptconf.decrypt(env.senderpass),
            pass:  'mmkcczagtrhnechu',
=======
            user: "threesainfoway00@gmail.com",//cryptconf.decrypt(env.sendermail),
            pass: "skxghkfrctrspyhg" //"cbuhgwhnbntpxcyq" //cryptconf.decrypt(env.senderpass),
>>>>>>> f281cc39bf77ec18258ba216165a1f2a2ea8b523
        }
    })
}