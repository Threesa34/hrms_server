
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
	const cors = require('cors');
	let http = require('http').Server(app);
	var https = require('https');

app.use(bodypareser.urlencoded({limit:'100mb',extended:true}));
app.use(bodypareser.json({limit:'100mb'}));
	
app.use(cors());

/* app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "https://103.252.7.5:4200/");
	res.header("Access-Control-Allow-Methods", "OPTIONS, POST, GET, PUT, DELETE");
	res.header("Access-Control-Allow-Headers", "*");
	res.header('Access-Control-Allow-Credentials', true);
	if ('OPTIONS' == req.method) {
		return res.sendStatus(200);
	} else {
		next();
	}
  }); */

  console.log(cryptconf.encrypt('321'))

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

/* const cert = fs.readFileSync('./sslforfree/certificate.crt');
const ca = fs.readFileSync('./sslforfree/ca_bundle.crt');
const key = fs.readFileSync('./sslforfree/private.key'); */

/* const cert = fs.readFileSync(path.resolve('../../etc/letsencrypt/live/threesainfoway.net/cert.pem'));
const ca = fs.readFileSync(path.resolve('../../etc/letsencrypt/live/threesainfoway.net/chain.pem'));
const key = fs.readFileSync(path.resolve('../../etc/letsencrypt/live/threesainfoway.net/privkey.pem'));
 */

const ca = fs.readFileSync(path.resolve('../Threesa_website/STAR.threesainfoway.net_cert-2/STAR.threesainfoway.net.ca-bundle'));
  const cert = fs.readFileSync(path.resolve('../Threesa_website/STAR.threesainfoway.net_cert-2/STAR.threesainfoway.net.crt'));
   const key = fs.readFileSync(path.resolve('../Threesa_website/threesainfoway.net-1/private.key'));
 
	

let httpsOptions = {
    cert: cert, // fs.readFileSync('./ssl/example.crt');
    ca: ca, // fs.readFileSync('./ssl/example.ca-bundle');
    key: key // fs.readFileSync('./ssl/example.key');
 }; 
 

 //let httpsOptions = {};


 var sec_server = https.createServer(httpsOptions, app).listen(8896, function(){
	
	console.log('server start on port: ' + sec_server.address().port);
 });

 let io = require('socket.io')(server);
	require('./lib/config/socket.Ctrl')(io);

	
	server.timeout = 600000;

