var connection = require('../config/connection');
var mysql = require('mysql');
var cryptconf = require('../config/crypt.config');
var env = require('../config/env');

var mailer = require('../config/mailer.config');



function generaterandomPassword()
{
                var passwordtxt = "";
                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"+new Date();
                        for (var i = 0; i < 6; i++) {
                            passwordtxt += possible.charAt(Math.floor(Math.random() * possible.length));
                        }
                        if(passwordtxt.length == 6)
                        {
                            //passwordtxt
                            return cryptconf.encrypt('321');
                        }
}

function sendMail(mailbody)
{
     const mailOptions = {
         from: cryptconf.decrypt(env.sendermail), // sender address
         to: mailbody.reciver, // list of receivers
         subject: mailbody.subject, // Subject line
         html: mailbody.content // plain text body
     };


     mailer.transporter.sendMail(mailOptions, function (err, info) {
         if(err)
           console.log(err)
         else
           console.log(info);
      });
}

function masterConnection() {
    this.pool = mysql.createPool({
      connectionLimit: 100,
      multipleStatements: true,
      host: cryptconf.decrypt(env.host),
      user: cryptconf.decrypt(env.user),
      password: env.password,
      database: 'th_master',
      wait_timeout:28800
    });
  
    this.acquire = function (callback) {
      this.pool.getConnection(function (err, connection) {
        callback(err, connection);
      });
    };
  }

  var masterConn = new masterConnection();

module.exports = {

    getCountryList: function(req, res)
    {
        masterConn.acquire(function(err, conn){
            conn.query('SELECT `id`,`name` FROM `countries` ORDER BY name ASC', function(err, result){
                if(err)
                {
                    res.send({
                        status:0,
                        type:'error',
                        title:'Oops!',
                        message:'Somthing went wrong.'
                    })
                }
                else
                {
                    res.send(result);
                }
            });
        });
    },
    getStateListOnCountry: function(req, res)
    {
        masterConn.acquire(function(err, conn){
            conn.query('SELECT `id`,`name` FROM `states` WHERE `country_id` = ? ORDER BY name ASC',[req.params.countryid], function(err, result){
                if(err)
                {
                    res.send({
                        status:0,
                        type:'error',
                        title:'Oops!',
                        message:'Somthing went wrong.'
                    })
                }
                else
                {
                    res.send(result);
                }
            });
        });
    },
    getCityListOnState: function(req, res)
    {
        masterConn.acquire(function(err, conn){
            conn.query('SELECT `id`,`name` FROM `cities` WHERE `state_id` = ? ORDER BY name ASC',[req.params.stateid], function(err, result){
                if(err)
                {
                    res.send({
                        status:0,
                        type:'error',
                        title:'Oops!',
                        message:'Somthing went wrong.'
                    })
                }
                else
                {
                    res.send(result);
                }
            });
        });
    },
  
    getCompaniesList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT `id`,`name`,`owner`,CONCAT(`mobile1`,CASE WHEN  mobile2 > 0 THEN CONCAT(" / ",mobile2) ELSE "" END) AS mobiles, CONCAT(`email1`,(CASE WHEN  email2 != "" THEN CONCAT(" / ",email2) ELSE "" END)) AS emails, CONCAT(`landline1`,(CASE WHEN  landline2 > 0 THEN CONCAT(" / ",landline2) ELSE "" END)) AS landlines, website,gstin, (CASE WHEN status = 0 THEN "Deactive" WHEN status = 1 THEN "Active" ELSE "Deleted" END) AS status  FROM `company`', function(err, result){
                if(err)
                {
                    res.send({
                        status:0,
                        type:'error',
                        title:'Oops!',
                        message:'Somthing went wrong.'
                    })
                }
                else
                {
                    res.send(result);
                }
            });
        });
    }
    else
        {
            res.send({
                success: false,
                type: "error",
                title: "Oops!",
                message: 'Invalid token.',
            });
        }
    },
  
    deleteCompanies: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('UPDATE company SET status = 0 WHERE `id` in ('+req.body.companyIds+')', function(err, result){
                if(err)
                {
                    res.send({
                        status:0,
                        type:'error',
                        title:'Oops!',
                        message:'Somthing went wrong.'
                    })
                }
                else
                {
                    res.send({
                        status:1,
                        type:'success',
                        title:'Done',
                        message:'Company/companies Deactiveted'
                    })
                }
            });
        });
    }
    else
        {
            res.send({
                success: false,
                type: "error",
                title: "Oops!",
                message: 'Invalid token.',
            });
        }
    },

    getCompanyDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT *,CONCAT("http://103.252.7.5:8895/uploads/company/",logo) as logo FROM `company` WHERE `id` = '+req.params.companyid, function(err, result){
                if(err)
                {
                    res.send({
                        status:0,
                        type:'error',
                        title:'Oops!',
                        message:'Somthing went wrong.'
                    })
                }
                else
                {
                    res.send(result.length> 0 ? result[0]:result)
                }
            });
        });
    }
    else
        {
            res.send({
                success: false,
                type: "error",
                title: "Oops!",
                message: 'Invalid token.',
            });
        }
    },
  
    saveCompanyDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
        
        

            var companyDetails = JSON.parse(req.body.companyDetails);

            if(req.file)
            {
                companyDetails.logo =  req.file.filename;
            }

            if(companyDetails.id != undefined)
            {

                companyDetails.logo = companyDetails.logo.replace(/http:\/\/103.252.7.5:8018\/uploads\/company\//g, "");
  
                connection.acquire(function(err, con){
                    delete companyDetails.createddate;
                    con.query('UPDATE `company` SET ? WHERE id = ?',[companyDetails, companyDetails.id],function(err, result){
                        if(err)
                        {
                            console.log(err)
                            res.send({
                                status:0,
                                type:'error',
                                title:'Error',
                                message:'Something went wrong.'
                            });
                        }
                        else
                        {
                            res.send({
                                status:1,
                                type:'success',
                                title:'Done',
                                message:'Company details updated successfully.'
                            })
                        }
                    });
                    con.release();
                });
            }
            else
            {

                

                connection.acquire(function(err, con){
                    con.query('INSERT INTO `company` SET ?', companyDetails,function(err, result){
                        if(err)
                        {
                            console.log(err)
                            res.send({
                                status:0,
                                type:'error',
                                title:'Error',
                                message:'Something went wrong.'
                            });
                        }
                        else
                        {

                            var companyid = result.insertId;
                            var password = generaterandomPassword();
                           con.query('INSERT INTO `employees`(`name`, `mobile1`, `mobile2`, `email`, `address`, `password`, `role`, `companyid`, `createdby`, status) VALUES (?,?,?,?,?,?,?,?,?,?)', [companyDetails.owner, companyDetails.mobile1,companyDetails.mobile2,companyDetails.email1,companyDetails.address_line1+", "+companyDetails.address_line2, password,2,companyid, req.decoded.logedinuser.id, 1],function(user_err, user_result){
                                if(user_err)
                                {
                                    console.log(user_err)

                                    con.query('DELETE FROM `company` WHERE `id` = '+ companyid ,function(del_err, del_result){
                                    });
                                    res.send({
                                        status:0,
                                        type:'error',
                                        title:'Error',
                                        message:'Something went wrong.'
                                    });
                                }
                                else
                                {
                                    
                                    {
                                        var mailbody = {
                                         reciver:companyDetails.email1,
                                         subject:"One Time Password",
                                         content: 'Dear ' + companyDetails.owner + '<br><br><br><h1 style="font-weight:bold;text-align:center;">' + cryptconf.decrypt(password) + '</h1> <br> <p>enter this as a  password for the app.<br><br><br><br> <div style="float:left;text-align:left;">Thanks, <br> Admin <br> (L.N. software Pvt. Ltd.)</div></p>' // plain text body
                                        }
                                        sendMail(mailbody)
                                    }

                                    res.send({
                                        status:1,
                                        type:'success',
                                        title:'Done',
                                        message:'Company details saved successfully.'
                                    })
                                }
                            });
                        }
                    });
                    con.release();
                });
            }
            
        }
        else
        {
            res.send({
                success: false,
                type: "error",
                title: "Oops!",
                message: 'Invalid token.',
            });
        }
    }
};