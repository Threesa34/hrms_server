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
            user: "threesainfoway00@gmail.com",//cryptconf.decrypt(env.sendermail),
            pass: "skxghkfrctrspyhg" //"cbuhgwhnbntpxcyq" //cryptconf.decrypt(env.senderpass),
        }
    })
}