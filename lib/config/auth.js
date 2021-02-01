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

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                req.decoded = {
                    success: false,
                    message: 'Failed to authenticate token.'
                };
            } else {
                // if everything is good, save to request for use in other routes
                // { logedinuser:
                //     { id: 1,
                //       name: 'Mayur Mhatre',
                //       firstlogin: 0,
                //       role: 'Superadmin',
                //       companyid: null },
                //    iat: 1546233461,
                //    exp: 1546262261 }
                decoded.success = true
                req.Loggedinuser = verificationObject[0];
                req.decoded = decoded;
            }
        });

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