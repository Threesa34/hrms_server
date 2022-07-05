// Security.js


var jwt = require('jsonwebtoken');
var express = require('express');
var cookieParser = require('cookie-parser')
var env = require('./env');
var app = express();

app.set('superSecret', env.jwt_sec); // secret variable

app.use(cookieParser())

module.exports = function (req, res, next) {

    var verificationObject = [{}];

    function getvaluesinObject(passedval) {
        var charindex = passedval.indexOf("=");
        var strindex = passedval.length;
        var field = passedval.substring(0, charindex).trim();
        var value = passedval.substring(charindex + 1, strindex);

        verificationObject[0][field] = value.trim();


    };
    
	if(req.headers.authorization)
	{
			/* var token = req.headers.authorization.split(';', 50);
			token.map(function (value) {
				getvaluesinObject(value)
			});
	 */
    // check header or url parameters or post parameters for token
    var token = req.headers.authorization.substr(String("Bearer ").length,req.headers.authorization.length).trim();
    // decode token
    if (token) {

        if(token == 'T#&!$$@3-4')
        {
            
            req.decoded = {
                success: true,
                message: 'No token provided.'
            };
        }

    } else {

        // if there is no token
        // return an error
        req.decoded = {
            success: false,
            message: 'No token provided.'
        };
    }
}
};
