var connection = require('./connection');
// var logger = require('./logger');
var fs = require('fs');
var mysql = require('mysql');
var cryptconf = require('./crypt.config');
var env = require('./env');


var conn = mysql.createConnection({
    host: cryptconf.decrypt(env.host),
    user: cryptconf.decrypt(env.user),
    password: env.password||''
});




module.exports = {
     createDB:function () {
        conn.connect(function (err) {
            if (err) throw err;
            else {

                conn.query("CREATE DATABASE IF NOT EXISTS "+cryptconf.decrypt(env.database), function (err, result) {
                    if (err) throw err;
                    else {
                    }
                });

            }
        });
    },
    CreateTables: function()
    {
        
    connection.acquire(function(err,con){
        if (err) {
        throw err;}
        else
        {
        var data = fs.readFileSync('./db.json')
        var queries = JSON.parse(data);
        queries.map(function(value){
            con.query(value.Query, function(err) {
            if (err) {
                console.log(err)
                throw err;}
            });  
        });
        }
    }) 
    },
    
}

//ALTER TABLE `voters` ADD IF NOT EXISTS `building` VARCHAR(1000) NULL DEFAULT NULL AFTER `address`;ALTER TABLE `voters` ADD IF NOT EXISTS `status` VARCHAR(10) NULL DEFAULT NULL AFTER `building`;ALTER TABLE `voters` ADD IF NOT EXISTS `remark` VARCHAR(5000) NULL DEFAULT NULL AFTER `status`;