
 var dbcreation = require('./lib/config/dbCreation');	
var express = require('express'),
	path = require('path'),
	bodypareser = require('body-parser'),
	fs = require('fs'),
	env = require('./lib/config/env'),
	cryptconf = require('./lib/config/crypt.config');
	var crypto = require('crypto');
	var routes = require('./lib/routes');
	var dbBackup = require('./lib/config/dbBackup');
	var app = express();

	let http = require('http').Server(app);

app.use(bodypareser.urlencoded({limit:'100mb',extended:true}));
app.use(bodypareser.json({limit:'100mb'}));
	

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "OPTIONS, POST, GET, PUT, DELETE");
	res.header("Access-Control-Allow-Headers", "*");
	res.header('Access-Control-Allow-Credentials', true);
	if ('OPTIONS' == req.method) {
		return res.sendStatus(200);
	} else {
		next();
	}
  });

app.use(express.static(path.join(__dirname,'app')));

routes.configure(app);

	dbcreation.createDB();
	dbcreation.CreateTables();

dbBackup.GenerateBackup();
/* var key_fields = Object.keys(env)
 if(key_fields.length > 0)
 {
 key_fields.map(function(val){
	 try{
		console.log(val+" = "+cryptconf.decrypt(env[String(val)]));
	 }
	 catch(exp)
	 {
		 
	 }
	
}); 
} */

var server = app.listen(parseInt(cryptconf.decrypt(env.port)),function(){
	 console.log('server start', cryptconf.decrypt(env.port));
})	

 let io = require('socket.io')(server);
	require('./lib/config/socket.Ctrl')(io);

	server.timeout = 600000;

