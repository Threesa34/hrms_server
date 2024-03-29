// Users.js
var jwt = require('jsonwebtoken');
var express = require('express');
var nodemailer = require('nodemailer');
var connection = require('../config/connection');
var cryptconf = require('../config/crypt.config');
var fs = require('fs');
const axios = require('axios')
var app = express();
var mailer = require('../config/mailer.config');
// var logger = require('../config/logger');
var env = require('../config/env');
var moment = require('moment');
const https = require('https');
var pdf = require('html-pdf');

var path = require('path');

app.set('superSecret', env.jwt_sec); // secret variable

var verificationObject = [{}];

function getvaluesinObject(passedval) {
    var charindex = passedval.indexOf("=");
    var strindex = passedval.length;
    var field = passedval.substring(0, charindex).trim();
    var value = passedval.substring(charindex + 1, strindex);

    verificationObject[0][field] = value.trim();
};

function convertTime12to24(time12h){
    const [time, modifier] = time12h.split(' ');
  
    let [hours, minutes] = time.split(':');
  
    if (hours === '12') {
      hours = '00';
    }
  
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
  
    return `${hours}:${minutes}`;
  }

function generateUniqueNumber()
{
                var text = "";
                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"+new Date().getTime();
                        for (var i = 0; i < 10; i++) {
                            text += possible.charAt(Math.floor(Math.random() * possible.length));
                        }
                        if(text.length == 10)
                        {
                            return text
                        }
}

function generaterandomPassword()
{
                var passwordtxt = "";
                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"+new Date().getTime();
                        for (var i = 0; i < 6; i++) {
                            passwordtxt += possible.charAt(Math.floor(Math.random() * possible.length));
                        }
                        if(passwordtxt.length == 6)
                        {
                            //passwordtxt
                            return cryptconf.encrypt(passwordtxt);
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


function distance(lat1, lon1, lat2, lon2) {
    theta = lon1 - lon2;
    dist = Math.sin(deg2rad(lat1)) 
                    * Math.sin(deg2rad(lat2))
                    + Math.cos(deg2rad(lat1))
                    * Math.cos(deg2rad(lat2))
                    * Math.cos(deg2rad(theta));
    dist = Math.acos(dist);
    dist = rad2deg(dist);
    dist = dist * 60 * 1.1515 * 1609.344;
    return (dist);
}

function deg2rad(deg) {
    return (deg * Math.PI / 180.0);
}

function rad2deg(rad) {
    return (rad * 180.0 / Math.PI);
}


function saveEmployeeDetails(userDetails)
{
    
   
}

module.exports = {

    

    authenticateEmployee: function(req, res)
    {
        connection.acquire(function(err, con){
            con.query('SELECT `id`,`name`,allow_bg_location, uuid, (SELECT role_master.name from role_master WHERE role_master.id = employees.role) AS `rolename`, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation`, `role`,`companyid`,`firstlogin` FROM `employees` WHERE (`mobile1` = ? OR `email` = ?) AND `password` = ?',[req.body.mobile,req.body.mobile, cryptconf.encrypt(req.body.password)], function(err,result){
                if(err)
                {
                    console.log(err)
                    res.send(
                        {
                            status:0,
                            type:'error',
                            title:'Oops!',
                            message:'Something went wrong'
                        }
                    );
                }
                else
                {
                    if(result.length == 1)
                    {
                        if(result[0].role != 1)
                        {
                            con.query('SELECT `status` FROM `company` WHERE `id` = ?',[result[0].companyid], function(err,activecompany){
                                if(err)
                                {
                                    console.log(err)
                                    res.send(
                                        {
                                            status:0,
                                            type:'error',
                                            title:'Oops!',
                                            message:'Something went wrong'
                                        }
                                    );
                                }
                                else
                                {
                                    if(activecompany.length >0 && activecompany[0].status == 1)
                                    {
                                        var payload = {
                                            logedinuser: result[0]
                                        }
                                        var token = jwt.sign(payload, app.get('superSecret'), {
                                            expiresIn: 86400 // expires in 24 hours = 86400    -  28800
                                        });

                                        if(result[0].role == 2 ||  result[0].role == 3)
                                        {
                                            res.send(
                                                {
                                                    success:true,
                                                    firstlogin: result[0].firstlogin,
                                                    rolename: result[0].rolename,
                                                    designationname: result[0].designationname,
                                                    name:result[0].name,
                                                    _id: result[0].id,
                                                    token:token
                                                }
                                            );
                                        }
                                        else
                                        {
                                         if(result[0].uuid != undefined && result[0].uuid != null && result[0].uuid != '')
                                            {
                                            
                                                if(req.body.uuid == undefined || req.body.uuid == null || req.body.uuid == '')
                                                {
                                                    res.send(
                                                        {
                                                            success:false,
                                                            type:'error',
                                                            title:'Faied to signin',
                                                            message:'User details does not match.'
                                                        }
                                                        );
                                                }
                                                else{
                                                    if(req.body.uuid == result[0].uuid)
                                                    {
                                                        res.send(
                                                            {
                                                                success:true,
                                                                firstlogin: result[0].firstlogin,
                                                                rolename: result[0].rolename,
                                                                designationname: result[0].designationname,
                                                                name:result[0].name,
                                                                _id: result[0].id,
                                                                token:token
                                                            }
                                                        );
                                                    }
                                                    else
                                                    {
                                                        res.send(
                                                            {
                                                                success:false,
                                                                type:'error',
                                                                title:'Faied to signin',
                                                                message:'User details does not match.'
                                                            }
                                                            );
                                                    }
                                                }
                                               
                                            }

                                            else 
                                                    {
                                                      
                                                        if(req.body.uuid != undefined && req.body.uuid != null && req.body.uuid != '')
                                                        {
                                                            con.query('UPDATE employees SET uuid = ? WHERE id = ?',[req.body.uuid,result[0].id,],function(err, result){
                                                                console.log(err)
                                                            });
                                                                
                                                        }
                                                        res.send(
                                                            {
                                                                success:true,
                                                                firstlogin: result[0].firstlogin,
                                                                rolename: result[0].rolename,
                                                                designationname: result[0].designationname,
                                                                name:result[0].name,
                                                                _id: result[0].id,
                                                                token:token
                                                            }
                                                        );

                                                    }
                                                    
                                                }  
                                        
                                        
                                    }
                                    else
                                    {
                                        res.send(
                                        {
                                            success:false,
                                            type:'error',
                                            title:'Faied to signin',
                                            message:'Company id is deactivated, please contact to admin for details.'
                                        }
                                        );
                                    }
                                }
                            });
                        }
                        else
                        {
                            var payload = {
                                logedinuser: result[0]
                            }
                            var token = jwt.sign(payload, app.get('superSecret'), {
                                expiresIn: 86400 // expires in 24 hours = 86400    -  28800
                            });

                            // console.log('-----------------res send',result)

                            res.send(
                                {
                                    success:true,
                                    firstlogin: result[0].firstlogin,
                                    name:result[0].name,
                                    rolename: result[0].rolename,
                                    designationname: result[0].designationname,
                                    _id: result[0].id,
                                    token:token
                                }
                            );
                        }
                       
                    }
                    else
                    {
                        res.send(
                            {
                                success:false,
                                type:'error',
                                title:'Faied to signin',
                                message:'User details does not match.'
                            }
                            );
                    }
                }
            });
            con.release();
        });
    },

    autoAuthenticate: function(req, res)
    {
        connection.acquire(function(err, con){
            con.query('SELECT `id`,`name`,allow_bg_location, uuid, (SELECT role_master.name from role_master WHERE role_master.id = employees.role) AS `rolename`, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation`, `role`,`companyid`,`firstlogin` FROM `employees` WHERE  `id` = ?',[req.body.id], function(err,result){
                if(err)
                {
                    console.log(err)
                    res.send(
                        {
                            status:0,
                            type:'error',
                            title:'Oops!',
                            message:'Something went wrong'
                        }
                    );
                }
                else
                {
                    if(result.length == 1)
                    {
                        if(result[0].role != 1)
                        {
                            con.query('SELECT `status` FROM `company` WHERE `id` = ?',[result[0].companyid], function(err,activecompany){
                                if(err)
                                {
                                    console.log(err)
                                    res.send(
                                        {
                                            status:0,
                                            type:'error',
                                            title:'Oops!',
                                            message:'Something went wrong'
                                        }
                                    );
                                }
                                else
                                {
                                    if(activecompany.length >0 && activecompany[0].status == 1)
                                    {
                                        var payload = {
                                            logedinuser: result[0]
                                        }
                                        var token = jwt.sign(payload, app.get('superSecret'), {
                                            expiresIn: 86400 // expires in 24 hours = 86400    -  28800
                                        });


                                        if(req.body.uuid != undefined && req.body.uuid != null && req.body.uuid != '')
                                        {
                                            con.query('UPDATE employees SET uuid = ? WHERE id = ?',[req.body.uuid,result[0].id,],function(err, result){
                                                console.log(err)
                                            });
                                                   
                                        }
                                        res.send(
                                            {
                                                success:true,
                                                firstlogin: result[0].firstlogin,
                                                rolename: result[0].rolename,
                                                designationname: result[0].designationname,
                                                name:result[0].name,
                                                _id: result[0].id,
                                                token:token
                                            }
                                        );
                                    }
                                    else
                                    {
                                        res.send(
                                        {
                                            success:false,
                                            type:'error',
                                            title:'Faied to signin',
                                            message:'Company id is deactivated, please contact to admin for details.'
                                        }
                                        );
                                    }
                                }
                            });
                        }
                        else
                        {
                            var payload = {
                                logedinuser: result[0]
                            }
                            var token = jwt.sign(payload, app.get('superSecret'), {
                                expiresIn: 86400 // expires in 24 hours = 86400    -  28800
                            });

                            // console.log('-----------------res send',result)

                            res.send(
                                {
                                    success:true,
                                    firstlogin: result[0].firstlogin,
                                    name:result[0].name,
                                    rolename: result[0].rolename,
                                    designationname: result[0].designationname,
                                    _id: result[0].id,
                                    token:token
                                }
                            );
                        }
                       
                    }
                    else
                    {
                        res.send(
                            {
                                success:false,
                                type:'error',
                                title:'Faied to signin',
                                message:'User details does not match.'
                            }
                            );
                    }
                }
            });
            con.release();
        });
    },


    authenticateEmployeeUuid: function(req, res)
    {
        connection.acquire(function(err, con){
            con.query('SELECT `id`,`name`, allow_bg_location, uuid, (SELECT role_master.name from role_master WHERE role_master.id = employees.role) AS `rolename`, `role`, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation`, `companyid`,`firstlogin` FROM `employees` WHERE `uuid` = ?',[req.body.uuid], function(err,result){
                if(err)
                {
                    console.log(err)
                    res.send(
                        {
                            status:0,
                            type:'error',
                            title:'Oops!',
                            message:'Something went wrong'
                        }
                    );
                }
                else
                {
                    if(result.length == 1)
                    {
                        if(result[0].role != 1)
                        {
                            con.query('SELECT `status` FROM `company` WHERE `id` = ?',[result[0].companyid], function(err,activecompany){
                                if(err)
                                {
                                    res.send(
                                        {
                                            status:0,
                                            type:'error',
                                            title:'Oops!',
                                            message:'Something went wrong'
                                        }
                                    );
                                }
                                else
                                {
                                    if(activecompany.length >0 && activecompany[0].status == 1)
                                    {
                                        var payload = {
                                            logedinuser: result[0]
                                        }
                                        var token = jwt.sign(payload, app.get('superSecret'), {
                                            expiresIn: 86400 // expires in 24 hours = 86400    -  28800
                                        });


                                        if(req.body.uuid != undefined && req.body.uuid != null && req.body.uuid != '')
                                        {
                                            con.query('UPDATE employees SET uuid = ? WHERE id = ?',[req.body.uuid,result[0].id,],function(err, result){
                                            });
                                                   
                                        }
                                        res.send(
                                            {
                                                success:true,
                                                firstlogin: result[0].firstlogin,
                                                rolename: result[0].rolename,
                                                designationname: result[0].designationname,
                                                name:result[0].name,
                                                _id: result[0].id,
                                                token:token
                                            }
                                        );
                                    }
                                    else
                                    {
                                        res.send(
                                        {
                                            success:false,
                                            type:'error',
                                            title:'Faied to signin',
                                            message:'Company id is deactivated, please contact to admin for details.'
                                        }
                                        );
                                    }
                                }
                            });
                        }
                        else
                        {
                            var payload = {
                                logedinuser: result[0]
                            }
                            var token = jwt.sign(payload, app.get('superSecret'), {
                                expiresIn: 86400 // expires in 24 hours = 86400    -  28800
                            });

                            res.send(
                                {
                                    success:true,
                                    firstlogin: result[0].firstlogin,
                                    name:result[0].name,
                                    rolename: result[0].rolename,
                                    designationname: result[0].designationname,
                                    _id: result[0].id,
                                    token:token
                                }
                            );
                        }
                       
                    }
                    else
                    {
                        res.send(
                            {
                                success:false,
                                type:'error',
                                title:'Faied to signin',
                                message:'User details does not match.'
                            }
                            );
                    }
                }
            });
            con.release();
        });
    },
    setNewPassword: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                con.query('UPDATE employees SET password = ?, firstlogin = 1 WHERE id = ?',[cryptconf.encrypt(req.body.new_password),req.decoded.logedinuser.id],function(err, result){
                    if(err)
                    {
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
                            message:'password updated successfully.'
                        })
                    }
                });
                con.release();
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

    setDefaultPassword: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                con.query('UPDATE employees SET password = ?, firstlogin = 1 WHERE id = ?',[cryptconf.encrypt('321'),req.params.id],function(err, result){
                    if(err)
                    {
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
                            message:'password updated successfully.'
                        })
                    }
                });
                con.release();
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

    resetEmployeeDeviceId: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                con.query('UPDATE employees SET uuid = ? WHERE id = ?',[null,req.params.id],function(err, result){
                    if(err)
                    {
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
                            message:'Device id reset successfully.'
                        })
                    }
                });
                con.release();
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


    ForgotPassword: function(req,res)
    {
        connection.acquire(function (err, con) {
            con.query("SELECT id,email from employees WHERE email = ?", [req.body.email], function (err, result) {
             if (err) {
                 console.log(err)
                 res.send({
                     success: false,
                         type: "error",
                         title: "Oops!",
                     message: 'Somthing went wrong, Please try again.'
                 });
             } else {
                 
                 if (result.length > 1 || result.length <= 0) {
                     res.json({
                         success: false,
                         type: "error",
                         title: "Oops!",
                         message: 'Details does not matched.'
                     });
                 }
                 if (result.length == 1) {
                     var d = new Date();
                     d.setTime(d.getTime() + (0.1 * 24 * 60 * 60 * 1000));
                     var expires = d.toUTCString();
         
                     var otp = Math.floor(100000 + Math.random() * 900000);
                     var sentotp = cryptconf.encrypt(String(otp));
                     var userid = String(result[0].id);
                     
                     res.cookie('otp', sentotp, {
                         expires: new Date(expires),
                         httpOnly: true
                     });
         
                     res.cookie('forgotpassword', 1, {
                         expires: new Date(expires),
                         httpOnly: true
                     });
                     
                     
                                         var payload = {
                                             logedinuser: result[0]
                                         }
                                         var token = jwt.sign(payload, app.get('superSecret'), {
                                             expiresIn: 28800 // expires in 24 hours = 86400
                                         });
         
                                         var d = new Date();
                                         d.setTime(d.getTime() + (0.7 * 24 * 60 * 60 * 1000));
                                         var expires = d.toUTCString();
         
                                         res.cookie('token', token, {
                                             expires: new Date(expires),
                                             httpOnly: true
                                         });
                                         
         
                     const mailOptions = {
                         from: cryptconf.decrypt(env.sendermail), // sender address
                         to: result[0].email, // list of receivers
                         subject: 'Forgot Password', // Subject line
                         html: '<h1 style="font-weight:bold;text-align:center;">' + otp + '</h1> <br> <p>Please enter it for reset your password for CS portal.<br> This OTP is valid for 10 minuts. <br><br><br> <div style="float:left;text-align:left;">Thanks, <br> Admin <br> (CS Pvt. Ltd.)</div></p>' // plain text body
                     };
                     mailer.transporter.sendMail(mailOptions, function (err, info) {
                         if (err)
                         {
                             console.log(err)
                             res.send({
                                success: false,
                                type: "error",
                                title: "Error!",
                                message: 'Something went wrong, please try again!',
                            });
                         }
                         else
                         {
                            res.send({
                             success: true,
                             type: "success",
                             title: "Sent!",
                             message: 'OTP sent to your registered mobile number.',
                             otp: sentotp,
                             forgotpassword:1,
                             token:token
                         });
                         }
                     });
         
         
                 }
             }
          });
          });
    },

    verifyOTP: function(req,res)
    {
        /* console.log(req.headers)
        var cookies = req.headers.cookie.split(';', 5);
        cookies.map(function (value) {
            getvaluesinObject(value)
        }); */
     
        var recievedotp = cryptconf.encrypt(String(req.body.otp))
        //  if (recievedotp === verificationObject[0].otp) {
         if (recievedotp === req.body.sentOtp) {
            res.clearCookie('otp', {
                path: '/'
            });
            res.send({
                status: 0
            });
        } else {
            res.send({
                status: 1
            });
        }
    },

    ResetPassword: function(req,res)
    {
        if (req.headers.cookie) {
            var cookies = req.headers.cookie.split(';', 5);
            cookies.map(function (value) {
                getvaluesinObject(value)
            });
            if (verificationObject[0].id) {
    
                if (err) {
                    res.send({
                        status: 1,
                        message: 'Somthing went wrong, Please try again!'
                    });
                } else {
                    res.send({
                        status: 0,
                        message: 'Password updated successfully, Thank you!'
                    });
                }
    
            } else {
                res.send({
                    status: 1,
                    message: 'Somthing went wrong, Please generate OTP again'
                });
            }
        } else {
            res.send({
                status: 1,
                message: 'Somthing went wrong, Please generate OTP again'
            });
        }
    },



    getMyDocuments: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT CONCAT("https://threesainfoway.net:8896/uploads/employee/",adhaar_pic) AS adhaar_pic, CONCAT("https://threesainfoway.net:8896/uploads/employee/",resume) AS resume, (CASE WHEN ((employees.gender = "Female") AND (employees.profilepic = "" OR profilepic is null)) THEN CONCAT("https://threesainfoway.net:8896/uploads/employee/","default_f.png") WHEN ((employees.gender = "Male" OR employees.gender = "Other" or employees.gender = "" or employees.gender is null) AND (employees.profilepic = "" OR profilepic is null)) THEN CONCAT("https://threesainfoway.net:8896/uploads/employee/","default.jpg") ELSE CONCAT("https://threesainfoway.net:8896/uploads/employee/",employees.profilepic) END) AS profile_pic  FROM `employees` WHERE `id` = '+req.params.id, function(err, result){
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
                    res.send(result)
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

    getUserDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT *, (CASE WHEN ((employees.gender = "Female") AND (employees.profilepic = "" OR profilepic is null)) THEN "default_f.png" WHEN ((employees.gender = "Male" OR employees.gender = "Other" or employees.gender = "" or employees.gender is null) AND (employees.profilepic = "" OR profilepic is null)) THEN "default.jpg" ELSE employees.profilepic END) AS profile_pic  FROM `employees` WHERE `id` = '+req.params.userid, function(err, result){
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

    getUserProfile: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT *, (CASE WHEN ((employees.gender = "Female") AND (employees.profilepic = "" OR profilepic is null)) THEN "/uploads/employee/default_f.png" WHEN ((employees.gender = "Male" OR employees.gender = "Other" or employees.gender = "" or employees.gender is null) AND (employees.profilepic = "" OR profilepic is null)) THEN "/uploads/employee/default.jpg" ELSE CONCAT("/uploads/employee/",employees.profilepic) END) AS profile_pic, (SELECT role_master.name FROM role_master WHERE role_master.id = role) as role_name ,`role`, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, (SELECT CONCAT(shift_management.name," ", "(",shift_management.intime,"-",shift_management.outtime,")") FROM shift_management WHERE shift_management.id = employees.shiftid) as sifht_details  FROM `employees` WHERE `id` = '+req.params.userid, function(err, result){
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

    officeContacts: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`,`name`, (CASE WHEN DATE_FORMAT(`dob`,"%D %M") = DATE_FORMAT(CURDATE(),"%D %M") THEN 1 ELSE 0 END) AS has_birthday, DATE_FORMAT(`dob`, "%D %M") AS _dob, (SELECT designation_master.name FROM designation_master WHERE designation_master.id = employees.designation LIMIT 1) AS designation_name, mobile1,mobile2, (CASE WHEN ((employees.gender = "Female") AND (employees.profilepic = "" OR profilepic is null)) THEN "https://threesainfoway.net:8896/uploads/employee/default_f.png" WHEN ((employees.gender = "Male" OR employees.gender = "Other" or employees.gender = "" or employees.gender is null) AND (employees.profilepic = "" OR profilepic is null)) THEN "https://threesainfoway.net:8896/uploads/employee/default.jpg" ELSE CONCAT("https://threesainfoway.net:8896/uploads/employee/",employees.profilepic) END) AS profile_pic, CONCAT(`mobile1`,CASE WHEN mobile2 > 0 THEN CONCAT(" / ",mobile2) ELSE "" END) AS mobiles, `email`, (SELECT role_master.name FROM role_master WHERE role_master.id = employees.role LIMIT 1) AS role_name, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation` FROM `employees` WHERE STATUS = 1 AND `companyid` = '+req.decoded.logedinuser.companyid+' AND id != '+parseInt(req.decoded.logedinuser.id)+' ORDER BY name ASC'
                }
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    getUsersList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                if(req.decoded.logedinuser.role == 1)
                {
                    var sql = 'SELECT `id`,`name`, `gender`, CONCAT(`mobile1`,(CASE WHEN `mobile2` IS NULL OR `mobile2` = "" THEN "" ELSE CONCAT(" / ",`mobile2`) END )) AS mobiles, `email`,(SELECT role_master.name FROM role_master WHERE role_master.id = role) as role_name ,`role`, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation`, (SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid LIMIT 1) AS working_shift, (SELECT company.name FROM company WHERE company.id = employees.companyid) as company_name,(CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status, uuid FROM `employees`'
                }
                else
                {
                    var sql = 'SELECT `id`,`name`,`gender`, CONCAT(`mobile1`,CASE WHEN  mobile2 > 0 THEN CONCAT(" / ",mobile2) ELSE "" END) AS mobiles, `email`,IFNULL(DATE_FORMAT(`dob`,"%D %M %Y"), "") AS  birth_date,DATE_FORMAT(`doj`,"%D %M, %Y") AS  joining_date, (SELECT role_master.name FROM role_master WHERE role_master.id = employees.role LIMIT 1) AS role_name, `role`, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation`, (SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid LIMIT 1) AS working_shift, (SELECT company.name FROM company WHERE company.id = employees.companyid) as company_name,(CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status, uuid FROM `employees` WHERE role != 14 AND `companyid` = '+req.decoded.logedinuser.companyid
                }
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    getAdvertisingPartnersList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT *, (SELECT COUNT(*) FROM `enquiry` WHERE enquiry.source = advertising_partners.`unique_number` AND enquiry.conectionstats = 1 LIMIT 1) AS totalConnections, (SELECT SUM(partner_creditpointsredeem.redeem_points) FROM partner_creditpointsredeem WHERE partner_creditpointsredeem.agentid = advertising_partners.id) AS total_redeem_points FROM `advertising_partners` WHERE `companyid` = '+req.decoded.logedinuser.companyid
                
                
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

  
    resetAgentsPassword: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                var password = generaterandomPassword();
                con.query('SELECT email, name FROM `advertising_partners` WHERE id = ?', [req.params.id], function(err, agentEmail){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                con.query('UPDATE `employees` SET `password` = ? WHERE `agentid` = ?; UPDATE `advertising_partners` SET `password` = ? WHERE `id` = ?', [password, req.params.id, password, req.params.id], function(err, result){
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

                        if(agentEmail && agentEmail.length > 0 && (agentEmail[0].email != undefined && agentEmail[0].email != null && agentEmail[0].email != ''))
                            {
                                var mailbody = {
                                 reciver:agentEmail[0].email,
                                 subject:"One Time Password",
                                 content: 'Dear ' + agentEmail[0].name + '<br><br><br><h1 style="font-weight:bold;text-align:center;">' + cryptconf.decrypt(password) + '</h1> <br> <p>enter this as a  password for the app.<br><br><br><br> <div style="float:left;text-align:left;">Thanks, <br> Admin <br> (L.N. software Pvt. Ltd.)</div></p>' // plain text body
                                }
                                sendMail(mailbody)
                            }

                        res.send({
                            status:1,
                            type:'success',
                            title:'Done',
                            message:'Password updated successfully.'
                        })
                    }
                });
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

    // WHERE employees.mobile1 != ? OR mobile2 != ?

    savePartnerDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            if(req.body.totalConnections)
            {
                delete req.body.totalConnections;
            }
            if(req.body.total_redeem_points)
            {
                delete req.body.total_redeem_points;
            }

            connection.acquire(function(err, con){
                
                var partnerDetails = req.body;

                var sql = 'SELECT id FROM employees WHERE (employees.mobile1 = ? OR mobile2 = ?)';
                var parameters = [partnerDetails.mobile1, partnerDetails.mobile1]

                if(partnerDetails.id != undefined)
                {
                    sql = sql +' AND  `agentid` != ?';
                    parameters.push(partnerDetails.id);
                }
                con.query(sql, parameters, function(err, employee_exist){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else{
                        if(employee_exist && employee_exist.length > 0 && (employee_exist[0].id != undefined && employee_exist[0].id > 0))
                        {
                            res.send({
                                status:0,
                                type:'error',
                                title:'Error',
                                message:'Mobile number already exist in employee details.'
                            });
                        }
                        else
                        {
                            // var employeeId = employee_exist[0].id ;
                if(partnerDetails.id != undefined)
                {
    
                    delete partnerDetails.createddate;
                    
                     con.query('UPDATE `advertising_partners` SET ? WHERE id = ?', [partnerDetails, partnerDetails.id], function(err, result){
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
                           
                            // if(employeeId)
                             partnerDetails['status'] = 1;
                             partnerDetails['agentid'] = partnerDetails.id;
                             partnerDetails['role'] = 14;
                           
                             delete partnerDetails.id;
                             delete partnerDetails.unique_number;
                             delete partnerDetails.creditpoints;
                             
                             con.query('SELECT id FROM `employees` WHERE agentid = ?', [partnerDetails['agentid']], function(err, employeeResult){
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
                                else{
                                    if(employeeResult && employeeResult.length > 0)
                                    {
                                        con.query('UPDATE `employees` SET ? WHERE id = ?', [partnerDetails, employeeResult[0].id], function(err, result){
                                            if(err)
                                            {
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
                                                    message:'Partner details updated successfully.'
                                                });
                                            }
                                        });
                                    }
                                    else
                                    {
                                        partnerDetails['password'] = generaterandomPassword();

                                        con.query('INSERT INTO `employees` SET ?', partnerDetails, function(err, result){
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
                            
                                                try{
                                                if(partnerDetails.email != undefined && partnerDetails.email != null && partnerDetails.email != '')
                                                {
                                                    var mailbody = {
                                                     reciver:partnerDetails.email,
                                                     subject:"One Time Password",
                                                     content: 'Dear ' + partnerDetails.name + '<br><br><br><h1 style="font-weight:bold;text-align:center;">' + cryptconf.decrypt(partnerDetails.password) + '</h1> <br> <p>enter this as a  password for the app.<br><br><br><br> <div style="float:left;text-align:left;">Thanks, <br> Admin <br> (L.N. software Pvt. Ltd.)</div></p>' // plain text body
                                                    }
                                                    sendMail(mailbody)
                                                }
                                            }
                                            catch(ex)
                                            {
                            
                                            }
                                                /*if(partnerDetails.mobile1 != undefined && partnerDetails.mobile1 != null && partnerDetails.mobile1 != '')
                                                {
                                                    var msg='Dear ' + partnerDetails.name + '\n\n' + cryptconf.decrypt(partnerDetails.password) + '\nenter this as a  password for the app.\n\n Thanks, \n Admin <br> (L.N. software Pvt. Ltd.)';
                            
                                                    var url = 'http://sms.threesainfoway.net/app/smsapi/index.php?key=25C65576831AFC&routeid=415&type=text&contacts=' + partnerDetails.mobile1+ '&senderid=THRESA&msg='+msg;
                            
                                        axios.post(url, {
                                            json: {
                                                key: '25C65576831AFC',
                                                routeid: 415,
                                                type: 'text',
                                                contacts: req.body.contacts,
                                                senderid: req.body.senderid
                                            }
                                          })
                                          .then(function (error, response) {
                                            res.send({
                                                status:0,
                                                type:'success',
                                                title:'Done',
                                                message:'Message shared to submitted contacts.'
                                            });
                                          })
                                    }*/
                                                
                                                res.send({
                                                    status:1,
                                                    type:'success',
                                                    title:'Done',
                                                    message:'Partner details saved successfully.'
                                                });
                                            }
                                        });
                                    }
                        }
                            });


                        }
                    });
                }    
                else{

                    partnerDetails.unique_number = generateUniqueNumber();
                    partnerDetails.password = generaterandomPassword();
                    partnerDetails.createdby = req.decoded.logedinuser.id;
                    partnerDetails.companyid = req.decoded.logedinuser.companyid;
                    

                    con.query('INSERT INTO `advertising_partners` SET ?', partnerDetails, function(err, result){
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

                            partnerDetails['agentid'] = result.insertId;
                            partnerDetails['role'] = 14;
                           delete partnerDetails.unique_number;
                           delete partnerDetails.creditpoints;
                           partnerDetails['status'] = 1;
                           
                            con.query('INSERT INTO `employees` SET ?', partnerDetails, function(err, result){
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

                    try{
                    if(partnerDetails.email != undefined && partnerDetails.email != null && partnerDetails.email != '')
                    {
                        var mailbody = {
                         reciver:partnerDetails.email,
                         subject:"One Time Password",
                         content: 'Dear ' + partnerDetails.name + '<br><br><br><h1 style="font-weight:bold;text-align:center;">' + cryptconf.decrypt(partnerDetails.password) + '</h1> <br> <p>enter this as a  password for the app.<br><br><br><br> <div style="float:left;text-align:left;">Thanks, <br> Admin <br> (L.N. software Pvt. Ltd.)</div></p>' // plain text body
                        }
                        sendMail(mailbody)
                    }
                }
                catch(ex)
                {

                }
                    /*if(partnerDetails.mobile1 != undefined && partnerDetails.mobile1 != null && partnerDetails.mobile1 != '')
                    {
                        var msg='Dear ' + partnerDetails.name + '\n\n' + cryptconf.decrypt(partnerDetails.password) + '\nenter this as a  password for the app.\n\n Thanks, \n Admin <br> (L.N. software Pvt. Ltd.)';

                        var url = 'http://sms.threesainfoway.net/app/smsapi/index.php?key=25C65576831AFC&routeid=415&type=text&contacts=' + partnerDetails.mobile1+ '&senderid=THRESA&msg='+msg;

            axios.post(url, {
                json: {
                    key: '25C65576831AFC',
                    routeid: 415,
                    type: 'text',
                    contacts: req.body.contacts,
                    senderid: req.body.senderid
                }
              })
              .then(function (error, response) {
                res.send({
                    status:0,
                    type:'success',
                    title:'Done',
                    message:'Message shared to submitted contacts.'
                });
              })
        }*/
                    
                    res.send({
                        status:1,
                        type:'success',
                        title:'Done',
                        message:'Partner details saved successfully.'
                    });
                }
            });
 
                        }
                    });
                }
            }
        }
            });
                con.release();
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


    
    getAgentProfile: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT id, name, email, Address, mobile1, unique_number, creditpoints FROM `advertising_partners` WHERE `id` = (SELECT employees.agentid FROM employees WHERE employees.id = ? LIMIT 1)', req.decoded.logedinuser.id, function(err, result){
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
                    res.send(result)
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
    
    getAgentTotalConnectionsCount: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT COUNT(*) AS totalConnections, (SELECT SUM(partner_creditpointsredeem.redeem_points) FROM partner_creditpointsredeem WHERE partner_creditpointsredeem.agentid = (SELECT employees.agentid FROM employees WHERE employees.id = ?)) AS total_redeem_points FROM `enquiry` WHERE enquiry.source = (SELECT advertising_partners.unique_number FROM advertising_partners WHERE advertising_partners.id = (SELECT employees.agentid FROM employees WHERE employees.id = ?) LIMIT 1)', [req.decoded.logedinuser.id, req.decoded.logedinuser.id], function(err, result){
                if(err)
                {
                    console.log(err)
                    res.send({
                        status:0,
                        type:'error',
                        title:'Oops!',
                        message:'Somthing went wrong.'
                    })
                }
                else
                {
                    res.send(result)
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

    getRedeemTransactinsList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT `id`, `redeem_points`, `payment_date`, `createddate` FROM `partner_creditpointsredeem` WHERE `agentid` = (SELECT employees.agentid FROM employees WHERE employees.id = ? LIMIT 1);', [req.decoded.logedinuser.id], function(err, result){
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
                    res.send(result)
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

    getAgentPaymentHistory: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT `id`, `redeem_points`, DATE_FORMAT(`payment_date`, "%D %M, %Y") AS paymentDate, `createddate` FROM `partner_creditpointsredeem` WHERE `agentid` = ?;', [req.params.partnerId], function(err, result){
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
                    res.send(result)
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

    getAgentsEnquiriesAndConnections: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT *, (CASE WHEN conectionstats = 2 THEN "Rejected / Denied" WHEN conectionstats = 1 THEN "Connection Done" ELSE "Pending" END) as connection_status , DATE_FORMAT(enqdate, "%D/%M/%Y") AS enq_date FROM `enquiry` WHERE enquiry.source = (SELECT advertising_partners.unique_number FROM advertising_partners WHERE advertising_partners.id = (SELECT employees.agentid FROM employees WHERE employees.id = ?) LIMIT 1) AND DATE_FORMAT(`enqdate`, "%Y-%m") = ? order by id DESC', [req.decoded.logedinuser.id, req.body.selectedMonth], function(err, result){
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
                    res.send(result)
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

    getAgentsEnquiriesAndConnectionsYearly: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT *, (CASE WHEN conectionstats = 2 THEN "Rejected / Denied" WHEN conectionstats = 1 THEN "Connection Done" ELSE "Pending" END) as connection_status , DATE_FORMAT(enqdate, "%D/%M/%Y") AS enq_date FROM `enquiry` WHERE enquiry.source = (SELECT advertising_partners.unique_number FROM advertising_partners WHERE advertising_partners.id = (SELECT employees.agentid FROM employees WHERE employees.id = ?) LIMIT 1) AND DATE_FORMAT(`enqdate`, "%Y") = ? order by id DESC', [req.decoded.logedinuser.id, req.body.selectedYear], function(err, result){
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
                    res.send(result)
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

    disableEmployee: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('UPDATE employees SET status = 0 WHERE `id` in ('+req.body.userids+')', function(err, result){
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
                        message:'Employee/Employees Deactiveted'
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
    
    deleteEmployee: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('DELETE FROM `employees` WHERE `id` in ('+req.body.userids+')', function(err, result){
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
                        message:'Employee(s) deleted permanently'
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

    saveshiftAssignmentDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('UPDATE employees SET shiftid = '+req.body.shiftid+' WHERE `id` in ('+req.body.uerids+')', function(err, result){
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
                        message:'Shift Assigned to employee.'
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

    getUserRoles: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                if(req.decoded.logedinuser.role == 2)
                {
                    var sql = 'SELECT `id`,`name` FROM `role_master` WHERE id NOT IN (1)'
                }
                else
                {
                    var sql = 'SELECT `id`,`name` FROM `role_master` WHERE id NOT IN (1,2)';
                }
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    getManagersList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
               
                {
                    var sql = 'SELECT `id`, `name` FROM `employees` WHERE `role` IN (2, 12);';
                }
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    getStaffUsersList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
               
                {
                    var sql = 'SELECT `id`, `name` FROM `employees` WHERE `role` IN (4, 5);';
                }
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    deleteAttendanceRecord: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){

                con.query(' DELETE FROM `attendance` WHERE `id` = '+req.params.id,function(err, result){
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
                            message:'Record deleted successfully.'
                        });
                    }
                });  
                con.release();  

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

    saveAttendanceDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                var sql = "";
                if(req.body.attendanceDetails.type == 'in')
                {
                    for(var i = 0 ; i < req.body.uerids.length; i++)
                    {
                        // sql = sql+'INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `companyid`) VALUES ('+req.body.uerids[i]+','+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+','+convertTime12to24(req.body.attendanceDetails.time)+',"Registered by HR.",'+req.decoded.logedinuser.companyid+');';
                        
                        sql = sql+'INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `companyid`) SELECT * FROM (SELECT '+req.body.uerids[i]+',"'+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+'","'+convertTime12to24(req.body.attendanceDetails.intime)+'","In time registered by HR.",'+req.decoded.logedinuser.companyid+') AS tmp WHERE NOT EXISTS (SELECT employee_id FROM `attendance` WHERE `employee_id` = '+req.body.uerids[i]+' and date="'+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+'");';
                    }
                }
                if(req.body.attendanceDetails.type == 'both')
                {
                    for(var i = 0 ; i < req.body.uerids.length; i++)
                    {
                        
                        sql = sql+'INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`,`outtime`,`out_address`, `companyid`) SELECT * FROM (SELECT '+req.body.uerids[i]+',"'+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+'","'+convertTime12to24(req.body.attendanceDetails.intime)+'","In time registered by HR.","'+convertTime12to24(req.body.attendanceDetails.outtime)+'","Out time registered by HR.",'+req.decoded.logedinuser.companyid+') AS tmp WHERE NOT EXISTS (SELECT employee_id FROM `attendance` WHERE `employee_id` = '+req.body.uerids[i]+' and date="'+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+'");';
                    }
                }
                if(req.body.attendanceDetails.type == 'out')
                {
                    for(var i = 0 ; i < req.body.uerids.length; i++)
                    {
                        
                        sql = sql+'UPDATE attendance SET `outtime` = "'+convertTime12to24(req.body.attendanceDetails.outtime)+'", `out_address` = "Out time registered by HR." WHERE employee_id = '+req.body.uerids[i]+' AND `date` = "'+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+'";';
                    }
                }
                con.query(sql,function(err, result){
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
                            message:'Attendance set successfully.'
                        });
                    }
                });  
                con.release();    
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


    getEmployeesOndutyList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                
                    var sql = 'SELECT DATE_FORMAT(`date`, "%d-%m-%Y") AS att_date, DATE_FORMAT(`intime`, "%h:%i %p") AS in_time, DATE_FORMAT(`outtime`, "%h:%i %p") AS out_time,`in_address`, `out_address`, (CASE WHEN onduty_approval = 1 THEN "Approved" WHEN onduty_approval = 2 THEN "Denied" ELSE "Pending" END) onduty_approval FROM `attendance` WHERE attendance.`companyid` = '+req.decoded.logedinuser.companyid+' AND isonduty = 1 AND attendance.`employee_id` = '+req.body.employee_id+' AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'"';

                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    setAttendanceOnDuty: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {


                                 res.send({
                                            status:0,
                                            type:'error',
                                            title:'Error',
                                            message:'On duty system temporary disabled from admin.'
                                        });

            //  connection.acquire(function(err, con){

            //     con.query('SELECT `id` FROM `attendance` WHERE `employee_id` = ? AND DATE_FORMAT(`date`, "%d-%m-%Y") = DATE_FORMAT(CURDATE(),"%d-%m-%Y") limit 1',[req.decoded.logedinuser.id],function(err, result){
            //         if(err)
            //         {
            //             res.send({
            //                 status:0,
            //                 type:'error',
            //                 title:'Error',
            //                 message:'Something went wrong.'
            //             });
            //         }
            //         else
            //         {
            //             if(result != undefined && result.length > 0)
            //             {
            //                 con.query('UPDATE `attendance` SET `outtime`=?,`out_address`=?,`out_latlang`=? WHERE `id` = ?',[moment(req.body.time).format("HH:mm"), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), result[0].id],function(err, result){
            //                     if(err)
            //                     {
            //                         res.send({
            //                             status:0,
            //                             type:'error',
            //                             title:'Error',
            //                             message:'Something went wrong.'
            //                         });
            //                     }
            //                     else
            //                     {
            //                         res.send({
            //                             status:1,
            //                             type:'success',
            //                             title:'Done',
            //                             message:'Out time set successfully.',
            //                             outtime:moment(new Date(req.body.time)).format("HH:mm a")

            //                         });
            //                     }
            //                 });
            //             }
            //             else{
            //                 //moment(new Date()).format("HH:MM")
            //                 con.query('INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `in_lanLang`,`isonduty`, `companyid`) VALUES (?,?,?,?,?,?, ?)',[req.decoded.logedinuser.id,  moment(new Date()).format("YYYY-MM-DD"),moment(req.body.time).format("HH:mm"), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}),1, req.decoded.logedinuser.companyid],function(err, result){
            //                     if(err)
            //                     {
            //                         console.log(err)
            //                         res.send({
            //                             status:0,
            //                             type:'error',
            //                             title:'Error',
            //                             message:'Something went wrong.'
            //                         });
            //                     }
            //                     else
            //                     {
            //                         res.send({
            //                             status:1,
            //                             type:'success',
            //                             title:'Done',
            //                             message:'Intime set successfully.',
            //                             intime: moment(new Date(req.body.time)).format("HH:mm a")
            //                         });
            //                     }
            //                 });
            //             }
            //         }
            //     });
            //     con.release();
            // }); 

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


    
    setAttendance: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
            
                var currentTime = new Date();

            con.query('SELECT `lat`,`lang` FROM `office_locations` WHERE `companyid` = ?',[req.decoded.logedinuser.companyid],function(err, officeLocations){

                if(err)
                {

                }
                else
                {
                    if(officeLocations != undefined && officeLocations != null && officeLocations.length > 0)
                    {
                        var counter = 0;

                        for(var i = 0 ;i < officeLocations.length;i++)
                        {
                            var addressRadius = distance(req.body.latitude, req.body.longitude, officeLocations[i].lat, officeLocations[i].lang);
                            if(addressRadius < 200)
                            {
                                counter = counter + 1;
                            }
                        }
        
        
                        if(counter > 0 || (req.body['source'] && req.body['source'] == 'browser'))
                        {
                            
                            if(req.body['source'] && req.body['source'] == 'browser')
                            {
                                req.body.address = req.body.address + "\n Source: "+req.body['source']+"\n Address Radius: "+addressRadius;
                            }

                        con.query('SELECT `id` FROM `attendance` WHERE `employee_id` = ? AND DATE_FORMAT(`date`, "%d-%m-%Y") = DATE_FORMAT(CURDATE(),"%d-%m-%Y") limit 1',[req.decoded.logedinuser.id],function(err, result){
                            if(err)
                            {
                                res.send({
                                    status:0,
                                    type:'error',
                                    title:'Error',
                                    message:'Something went wrong.'
                                });
                            }
                            else
                            {
                                if(result != undefined && result.length > 0)
                                {
                                    con.query('UPDATE `attendance` SET `outtime`=?,`out_address`=?,`out_latlang`=?, `out_uuid`=? WHERE `id` = ?',[moment(currentTime).format("HH:mm"), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), req.decoded.logedinuser.uuid, result[0].id],function(err, result){
                                        if(err)
                                        {
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
                                                message:'Out time set successfully.',
                                                outtime:moment(new Date(currentTime)).format("HH:mm a")
        
                                            });
                                        }
                                    });
                                }
                                else{
                                    //moment(new Date()).format("HH:MM")
                                    con.query('INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `in_lanLang`, `uuid`,`companyid`) VALUES (?,?,?,?,?,?,?)',[req.decoded.logedinuser.id,  moment(new Date()).format("YYYY-MM-DD"),moment(currentTime).format("HH:mm"), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), req.decoded.logedinuser.uuid, req.decoded.logedinuser.companyid],function(err, result){
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
                                                message:'Intime set successfully.',
                                                intime: moment(new Date(currentTime)).format("HH:mm a")
                                            });
                                        }
                                    });
                                }
                            }
                        });
                       
                    }
                    else{
                        res.send({
                            success: false,
                            type: "error",
                            title: "Wrong Location",
                            message: 'You are far away from office location, Please try from your current office location',
                        });
                    }
                    }
                    else
                    {
                        con.query('SELECT `id` FROM `attendance` WHERE `employee_id` = ? AND DATE_FORMAT(`date`, "%d-%m-%Y") = DATE_FORMAT(CURDATE(),"%d-%m-%Y") limit 1',[req.decoded.logedinuser.id],function(err, result){
                            if(err)
                            {
                                res.send({
                                    status:0,
                                    type:'error',
                                    title:'Error',
                                    message:'Something went wrong.'
                                });
                            }
                            else
                            {
                                if(result != undefined && result.length > 0)
                                {
                                    con.query('UPDATE `attendance` SET `outtime`=?,`out_address`=?,`out_latlang`=?, `out_uuid`=? WHERE `id` = ?',[moment(currentTime).format("HH:mm"), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), req.decoded.logedinuser.uuid, result[0].id],function(err, result){
                                        if(err)
                                        {
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
                                                message:'Out time set successfully.',
                                                outtime:moment(new Date(currentTime)).format("HH:mm a")
        
                                            });
                                        }
                                    });
                                }
                                else{
                                    //moment(new Date()).format("HH:MM")
                                    con.query('INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `in_lanLang`, `uuid`,`companyid`) VALUES (?,?,?,?,?,?,?)',[req.decoded.logedinuser.id,  moment(new Date()).format("YYYY-MM-DD"),moment(currentTime).format("HH:mm"), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), req.decoded.logedinuser.uuid, req.decoded.logedinuser.companyid],function(err, result){
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
                                                message:'Intime set successfully.',
                                                intime: moment(new Date(currentTime)).format("HH:mm a")
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
        });
            con.release();
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

    setAttendance_oldLatest: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            var officeLocations = [
                {
                    lat: 19.222056,
                    lang: 72.982150,
                    location: 'highland'
                },
                {
                    lat: 19.203329,
                    lang: 72.969038,
                    location: 'Dev Corpora'
                },
                {
                    lat: 19.223004,
                    lang: 72.964130,
                    location: 'Siddhachal'
                },
                {
                    lat: 19.229695,
                    lang: 72.984433,
                    location: 'Dhokali'
                },
                {
                    lat:19.209583,
                    lang: 72.979717,
                    location:"Rutu park"
                },
                {
                    lat:19.261880,
                    lang: 72.968315,
                    location:"Anand Nagar, GB road "
                },
                {
                    lat:19.208665,
                    lang: 72.952393,
                    location:"lokaranya nagar "
                },
                {
                    lat:19.209810,
                    lang: 72.952710,
                    location:"lokaranya nagar 2"
                },
                {
                    lat:19.190429,
                    lang: 72.980169,
                    location:"Khartan Road"
                },
                {
                    lat:19.229583,
                    lang: 72.984676,
                    location:"Dhokali 2"
                },
                {
                    lat:19.226356,
                    lang: 72.964941,
                    location:"pawar nagar"
                },
                {
                    lat:19.152175,
                    lang: 72.998611,
                    location:"Airoli"
                }, {
                    lat:19.234814,
                    lang: 72.989818,
                    location:"Lodha Amara"
                }                ];

                var counter = 0;

                for(var i = 0 ;i < officeLocations.length;i++)
                {
                    var addressRadius = distance(req.body.latitude, req.body.longitude, officeLocations[i].lat, officeLocations[i].lang);
                    if(addressRadius < 100)
                    {
                        counter = counter + 1;
                    }
                    // console.log(officeLocations[i].location+": "+addressRadius)
                }


                if(counter > 0)
                {
             connection.acquire(function(err, con){

                con.query('SELECT `id` FROM `attendance` WHERE `employee_id` = ? AND DATE_FORMAT(`date`, "%d-%m-%Y") = DATE_FORMAT(CURDATE(),"%d-%m-%Y") limit 1',[req.decoded.logedinuser.id],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        // moment(req.body.time).format("HH:mm"),
                        if(result != undefined && result.length > 0)
                        {
                            con.query('UPDATE `attendance` SET `outtime`= DATE_FORMAT(CURRENT_TIME(),"%H:%i"),`out_address`=?,`out_latlang`=?, `out_uuid`=? WHERE `id` = ?',[req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), req.decoded.logedinuser.uuid, result[0].id],function(err, result){
                                if(err)
                                {
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
                                        message:'Out time set successfully.',
                                        outtime:moment(new Date(req.body.time)).format("HH:mm a")

                                    });
                                }
                            });
                        }
                        else{
                            //moment(new Date()).format("HH:MM")
                            // moment(req.body.time).format("HH:mm")
                            con.query('INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `in_lanLang`, `uuid`,`companyid`) VALUES (?,?,DATE_FORMAT(CURRENT_TIME(),"%H:%i"),?,?,?,?)',[req.decoded.logedinuser.id,  moment(new Date()).format("YYYY-MM-DD"), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), req.decoded.logedinuser.uuid, req.decoded.logedinuser.companyid],function(err, result){
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
                                        message:'Intime set successfully.',
                                        intime: moment(new Date(req.body.time)).format("HH:mm a")
                                    });
                                }
                            });
                        }
                    }
                });
                con.release();
            }); 
            }
            else{
                res.send({
                    success: false,
                    type: "error",
                    title: "Wrong Location",
                    message: 'You are far away from office location, Please try from your current office location',
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
    },
    getAttendanceStatus: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
             connection.acquire(function(err, con){

                con.query('SELECT `id`,intime, outtime FROM `attendance` WHERE `employee_id` = ? AND DATE_FORMAT(`date`, "%d-%m-%Y") = DATE_FORMAT(CURDATE(),"%d-%m-%Y") limit 1',[req.decoded.logedinuser.id],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        if(result != undefined && result.length > 0)
                        {
                            if(result[0].intime != null && result[0].outtime == null)
                            {
                                res.send({status:1, result: result[0]});
                            }
                             if(result[0].outtime != null)
                            {
                                    res.send({status:2, result: result[0]});
                            }
                            if(result[0].intime == null && result[0].outtime == null)
                            {
                                res.send({status:3});
                            }
                        }
                        else
                        {
                             res.send({status:3});
                        }
                    }
                           
                });
                con.release();
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

    getApprisalList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
             connection.acquire(function(err, con){

                con.query('SELECT `id`, `employee_id`, DATE_FORMAT(`apprisal_date`,"%d-%M-%Y") AS apprisal_date, `net_salary`, (SELECT employees.name FROM employees WHERE employees.id = salary_master.`createdby`) AS created_by, (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status, status FROM `salary_master` WHERE salary_master.employee_id = ? order by id desc limit 10',[req.params.id],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        
                        res.send(result);
                    }
                           
                });
                con.release();
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

    getLeaveshistory: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
             connection.acquire(function(err, con){

                con.query('SELECT `id`,`leave_type`,CONCAT(DATE_FORMAT(`from_date`,"%d %M, %Y")," to ", DATE_FORMAT(`to_date`,"%d %M, %Y")) AS date_range, (CASE WHEN `approval_status` = 1 THEN "Approved" WHEN `approval_status` = 2 THEN "Denied" ELSE "Pending" END) as approval FROM `leaves` WHERE `employee_id` = ? ORDER BY id DESC LIMIT 20',[req.params.id],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        
                        res.send(result);
                    }
                           
                });
                con.release();
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

    getLoanHistory: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
             connection.acquire(function(err, con){

                con.query('SELECT `id`,`tenure`,`emi`,`interest_rate`,`approval_amt`,`starting_month`,DATE_FORMAT(`createddate`,"%d %M, %Y") AS loan_date,(SELECT SUM(loan_payment.emi) FROM loan_payment WHERE loan_payment.loan_id = loan.id) as total_piad_amount,(CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `loan` WHERE `employee_id` = ? ORDER BY id DESC LIMIT 10',[req.params.id],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        
                        res.send(result);
                    }
                           
                });
                con.release();
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

    getreviewsList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
             connection.acquire(function(err, con){

                con.query('SELECT `id`,`note`,`review`,DATE_FORMAT(`createddate`, "%d %M, %Y") as review_date,(SELECT employees.name FROM employees WHERE employees.id = employee_reviews.createdby) AS reviewd_by FROM `employee_reviews` WHERE `employee_id` = ? AND DATE_FORMAT(`createddate`,"%Y-%m") = ?',[req.params.id, req.params.reviewMonth],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        
                        res.send(result);
                    }
                           
                });
                con.release();
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

    getreviewsHistory: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
             connection.acquire(function(err, con){

                con.query('SELECT `id`,`note`,`review`,DATE_FORMAT(`createddate`, "%d %M, %Y") as review_date,(SELECT employees.name FROM employees WHERE employees.id = employee_reviews.createdby) AS reviewd_by FROM `employee_reviews` WHERE `employee_id` = ? AND `createdby` = ? AND DATE_FORMAT(`createddate`,"%Y-%m") = ?',[req.params.id, req.decoded.logedinuser.id, req.params.reviewMonth],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        
                        res.send(result);
                    }
                           
                });
                con.release();
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

    getAddress: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            
            var url =  "https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?prox=" + req.body.latitude + ","+ req.body.longitude + "&mode=retrieveAddresses&maxresults=1&gen=9&app_id=F2DrM7GiRxDODD2SR10H&app_code=KA7GSs5492GnQ5Xxzq791Q";


            https.get(url, (resp) => {
                // A chunk of data has been recieved.
                var data ='';
                resp.on('data', (chunk) => {
                    data = data+chunk;
                  //console.log(data)
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    
                    var addressobj = JSON.parse(data).Response.View[0].Result[0].Location.Address
                    addressobj['attendnace_time'] = moment(new Date(req.body.time));
                          res.send(addressobj)

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

    getMyReviewsList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`,`note`,`review`, reviews_types, DATE_FORMAT(`createddate`, "%d %M, %Y") as review_date,(SELECT employees.name FROM employees WHERE employees.id = employee_reviews.createdby) AS reviewd_by FROM `employee_reviews` WHERE `employee_id` = ? AND DATE_FORMAT(`createddate`,"%Y-%m") = ? order by id desc'
                }
                con.query(sql,[req.decoded.logedinuser.id, req.params.reviewMonth], function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
   

    getSelectedEmployeeReviews: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT * FROM `employee_reviews` WHERE `createdby` = ? AND `employee_id` = ? order by id desc limit 31'
                }
                con.query(sql,[req.decoded.logedinuser.id, req.params.emp_id], function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    
    saveEmpoolyeeReview: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            
                {
                    connection.acquire(function(err, con){
                   
                     con.query('INSERT INTO `employee_reviews`(`employee_id`, `note`, `review`, `reviews_types`, `createdby`, `companyid`) VALUES (?,?,?,?,?,?)', [req.body.id, req.body.note, parseFloat(req.body.reviews_types.overall_review), JSON.stringify(req.body.reviews_types),req.decoded.logedinuser.id, req.decoded.logedinuser.companyid], function(err, result){
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
                                message:'Your review saved successfully.!'
                            })
                        }
                    });
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
    },

    saveUserProfile: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            
                {
                    connection.acquire(function(err, con){
                    var userDetails = req.body;
                    
                    if(userDetails.dob)
                     userDetails.dob =  moment(new Date(userDetails.dob)).format("YYYY-MM-DD");
                     if(userDetails.doj)
                    userDetails.doj =  moment(new Date(userDetails.doj)).format("YYYY-MM-DD");
                    delete userDetails.createddate;
                    delete userDetails.profile_pic;
                     con.query('UPDATE `employees` SET ? WHERE id = ?', [userDetails, userDetails.id], function(err, result){
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
                                message:'Profile updated successfully.'
                            })
                        }
                    });
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
    },

    changeUserProfilePic: function(req, res)
    {
                connection.acquire(function(err, con){
                    con.query('UPDATE `employees` SET profilepic = ? WHERE id = ?', [req.files[0].filename, parseInt(req.headers.userid)], function(err, result){
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
                                message:'Employee details updated successfully.'
                            })
                        }
                    });
                });

    },

    saveUserDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {    
                var userDetails = JSON.parse(req.body.userDetails);

                if(req.files.length > 0)
                {
                    for(var i = 0; i< req.files.length; i++)
                    {
                        if(req.files[i].fieldname == 'uid')
                        userDetails.adhaar_pic =  req.files[i].filename;
                        if(req.files[i].fieldname == 'resume')
                        userDetails.resume =  req.files[i].filename;
                        if(req.files[i].fieldname == 'file')
                        userDetails.profilepic =  req.files[i].filename;
                    }
                    
                }

                userDetails.createdby = req.decoded.logedinuser.id;
                userDetails.companyid = req.decoded.logedinuser.companyid;
                
                connection.acquire(function(err, con){
    
        if(userDetails.id != undefined)
        {

            //  userDetails.profilepic =  userDetails.profilepic.replace(/http:\/\/103.252.7.5:8895\/uploads\/employee\//g, "");
            if(userDetails.dob)
             userDetails.dob =  moment(new Date(userDetails.dob)).format("YYYY-MM-DD");
             if(userDetails.doj)
            userDetails.doj =  moment(new Date(userDetails.doj)).format("YYYY-MM-DD");
            delete userDetails.createddate;
            delete userDetails.profile_pic;
             con.query('UPDATE `employees` SET ? WHERE id = ?', [userDetails, userDetails.id], function(err, result){
                if(err)
                {
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
                        message:'Employee details updated successfully.'
                    });
                }
            });
        }    
        else{

            userDetails.password = generaterandomPassword();
            if(userDetails.dob)
            userDetails.dob =  moment(new Date(userDetails.dob)).format("YYYY-MM-DD");
            if(userDetails.doj)
            userDetails.doj =  moment(new Date(userDetails.doj)).format("YYYY-MM-DD");
            

            con.query('INSERT INTO `employees` SET ?', userDetails, function(err, result){
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

                    try{
                    if(userDetails.email != undefined && userDetails.email != null && userDetails.email != '')
                    {
                        var mailbody = {
                         reciver:userDetails.email,
                         subject:"One Time Password",
                         content: 'Dear ' + userDetails.name + '<br><br><br><h1 style="font-weight:bold;text-align:center;">' + cryptconf.decrypt(userDetails.password) + '</h1> <br> <p>enter this as a  password for the app.<br><br><br><br> <div style="float:left;text-align:left;">Thanks, <br> Admin <br> (L.N. software Pvt. Ltd.)</div></p>' // plain text body
                        }
                        sendMail(mailbody)
                    }
                }
                catch(ex)
                {

                }
                    /*if(userDetails.mobile1 != undefined && userDetails.mobile1 != null && userDetails.mobile1 != '')
                    {
                        var msg='Dear ' + userDetails.name + '\n\n' + cryptconf.decrypt(userDetails.password) + '\nenter this as a  password for the app.\n\n Thanks, \n Admin <br> (L.N. software Pvt. Ltd.)';

                        var url = 'http://sms.threesainfoway.net/app/smsapi/index.php?key=25C65576831AFC&routeid=415&type=text&contacts=' + userDetails.mobile1+ '&senderid=THRESA&msg='+msg;

            axios.post(url, {
                json: {
                    key: '25C65576831AFC',
                    routeid: 415,
                    type: 'text',
                    contacts: req.body.contacts,
                    senderid: req.body.senderid
                }
              })
              .then(function (error, response) {
                res.send({
                    status:0,
                    type:'success',
                    title:'Done',
                    message:'Message shared to submitted contacts.'
                });
              })
        }*/
                    
                    res.send({
                        status:1,
                        type:'success',
                        title:'Done',
                        message:'Employee details saved successfully.'
                    });
                }
            });
        }
       
        con.release();
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
    SignOut(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true)
        {
            res.clearCookie('token');
            res.send({
                status: true,
                 type: "success",
                 title: "Thank You!",
                 message: 'Successfully Signout'
            });
        }
        else
        {
            res.send({
                status: false,
                 type: "error",
                 title: "Oops!",
                 message: 'Token already expired'
            });
        }   
    },


    // WORKING SHIFT MANAGEMENT

    

    getActivateWorkingShiftList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`,`name`,DATE_FORMAT(`intime`, "%I:%i") AS in_time,DATE_FORMAT(`outtime`, "%I:%i") AS out_time,`latemark_interval`,`halfday_interval` FROM `shift_management` WHERE  status != 0 AND `companyid` =  '+req.decoded.logedinuser.companyid
                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    getWorkingShiftList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`,`name`,DATE_FORMAT(`intime`, "%I:%i") AS in_time,DATE_FORMAT(`outtime`, "%I:%i") AS out_time,`latemark_interval`,`halfday_interval`,(CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `shift_management` WHERE `companyid` =  '+req.decoded.logedinuser.companyid
                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    getShiftDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT * FROM `shift_management` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    saveShiftDetails:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
            conn.query('UPDATE `shift_management` SET ? WHERE `id` = ?',[req.body, req.body.id], function(err, result){
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
                        message:'Shift details updated successfully.'
                    })
                }
            });
        }
        else
        {
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            conn.query('INSERT INTO `shift_management` SET ?',req.body, function(err, result){
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
                        message:'Shift details saved successfully.'
                    })
                }
            });
        }
            conn.release();
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


    // WORKING SHIFT MANAGEMENT


    // DESIGNATION MANAGEMENT

    getActivateDesignationList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT * FROM `designation_master` WHERE status != 0 AND  `companyid` =  '+req.decoded.logedinuser.companyid
                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    getDesignationList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT * , (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `designation_master` WHERE `companyid` =  '+req.decoded.logedinuser.companyid
                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    getdesignationDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT * FROM `designation_master` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    saveDesignationDetails:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
            conn.query('UPDATE `designation_master` SET ? WHERE `id` = ?',[req.body, req.body.id], function(err, result){
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
                        message:'Designation details updated successfully.'
                    })
                }
            });
        }
        else
        {
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            conn.query('INSERT INTO `designation_master` SET ?',req.body, function(err, result){
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
                        message:'Designation details saved successfully.'
                    })
                }
            });
        }
            conn.release();
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


    // DESIGNATION MANAGEMENT


    // SALARY MANAGEMENT

    getEmployeesList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`, `name` FROM `employees` WHERE role != 14 AND status != 0 AND `companyid` =   '+req.decoded.logedinuser.companyid
                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    getSalaryApprisalList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`, (SELECT employees.name FROM employees WHERE employees.id = salary_master.employee_id LIMIT 1) AS emp_name, FORMAT(`net_salary`,2) AS fixed_amt, (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `salary_master` WHERE `companyid` =   '+req.decoded.logedinuser.companyid
                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    // new changes
    getSalaryApprisalDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT *, (SELECT employees.name FROM employees WHERE employees.id = salary_master.`createdby`) AS created_by FROM `salary_master` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    deleteSalaryRecord: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'DELETE FROM `salary_master` WHERE `id` IN  '+req.body.ids
                con.query(sql,function(err, result){
                    console.log(err)
                    if(err)
                    {
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
                            message:'Record deleted successfully.'
                        })
                    }
                });
                con.release();
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

    saveSalaryApprisalDetails:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
                    req.body.apprisal_date =  moment(new Date(req.body.apprisal_date)).format("YYYY-MM-DD");
            conn.query('UPDATE `salary_master` SET ? WHERE `id` = ?',[req.body, req.body.id], function(err, result){
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
                        message:'Salary Apprisal details updated successfully.'
                    })
                }
            });
        }
        else
        {
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            req.body.apprisal_date =  moment(new Date(req.body.apprisal_date)).format("YYYY-MM-DD");
            conn.query('UPDATE `salary_master` SET status = 0 WHERE `employee_id` = '+ req.body.employee_id+';INSERT INTO `salary_master` SET ?',req.body, function(err, result){
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
                        message:'Salary Apprisal details saved successfully.'
                    })
                }
            });
        }
            conn.release();
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


    getAttendanceList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT `id`, (SELECT employees.name FROM employees WHERE employees.id = attendance.employee_id) AS emp_name, DATE_FORMAT(`date`, "%D %M, %Y") AS att_date, DATE_FORMAT(`intime`, "%I:%i %p") AS in_time, DATE_FORMAT(`outtime`, "%I:%i %p") AS out_time, `in_address`, `out_address` FROM `attendance` WHERE (isonduty IS NULL OR onduty_approval = 1) AND DATE_FORMAT(`date`, "%Y-%m-%d") = "'+moment(new Date(req.body.attendnaceDate)).format("YYYY-MM-DD")+'" AND `companyid` =  '+req.decoded.logedinuser.companyid
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    getAbsenceList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT `id`,`name`,CONCAT(`mobile1`,(CASE WHEN `mobile2` IS NULL OR `mobile2` = "" THEN "" ELSE CONCAT(" / ",`mobile2`) END )) AS mobiles, `email`,(SELECT role_master.name FROM role_master WHERE role_master.id = role) as role_name ,`role`, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation`, (SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid LIMIT 1) AS working_shift FROM `employees` WHERE `id` NOT IN (SELECT attendance.employee_id FROM attendance WHERE DATE_FORMAT(`date`, "%Y-%m-%d") = "'+moment(new Date(req.body.attendnaceDate)).format("YYYY-MM-DD")+'" AND `companyid` =  '+req.decoded.logedinuser.companyid+') AND `companyid` = '+req.decoded.logedinuser.companyid;

                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    getAttendanceReport: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                
                    var sql = 'SELECT `name`,`id`, DATE_FORMAT(CURDATE(),"%D %M, %Y") AS  salary_date, DAY(LAST_DAY(CURDATE())) no_days, DATE_FORMAT(`doj`,"%D %M, %Y") AS  joining_date,(SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid) as working_shift, (SELECT role_master.name FROM role_master WHERE role_master.id = employees.role) AS rolename, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation`, ((SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND DATE_FORMAT(attendance.intime,"%H:%i") <= (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.outtime,"%H:%i") >= (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid))) AS prest_days_count, (SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND (attendance.outtime != "00:00:00" AND attendance.intime != "00:00:00") AND (DATE_FORMAT(attendance.outtime,"%H:%i") < (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid) OR (DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")))) OR (attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND attendance.outtime IS NULL)) AS half_days_count, (SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.intime,"%H:%i") < (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND attendance.outtime IS NOT NULL) AS latemarks_count, 4 AS monthly_holidays FROM `employees` WHERE `companyid` = '+req.decoded.logedinuser.companyid+' AND id = '+req.body.employee_id;

                    // console.log(sql)

                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    getAttendanceReportOfEmployees: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                
                    var sql = 'SELECT  (select day(last_day((SELECT atts.date FROM attendance atts WHERE atts.employee_id = employees.id AND DATE_FORMAT(atts.date,"%M-%Y") = "'+req.body.date+'" LIMIT 1)))) AS total_month_days, ((SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND DATE_FORMAT(attendance.intime,"%H:%i") <= (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.outtime,"%H:%i") >= (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid))) AS prest_days_count, (SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND (attendance.outtime != "00:00:00" AND attendance.intime != "00:00:00") AND (DATE_FORMAT(attendance.outtime,"%H:%i") < (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid) OR (DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")))) OR (attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND attendance.outtime IS NULL)) AS half_days_count, (SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.intime,"%H:%i") < (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND attendance.outtime IS NOT NULL) AS latemarks_count, 4 AS monthly_holidays FROM `employees` WHERE `companyid` = '+req.decoded.logedinuser.companyid+' AND id = '+req.body.employee_id;
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    getloanRecieptdDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                
                    var sql = 'SELECT `id`,`loan_id`,`emi` FROM `loan_payment` WHERE `employee_id` = '+req.body.employee_id+' AND DATE_FORMAT(loan_payment.paid_date,"%M-%Y") = "'+req.body.date+'" AND `companyid` = '+req.decoded.logedinuser.companyid;

                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    

    saveSalarySlipInPDF: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

           var options = { 
                    "header": {
                        "height": "1mm",
                        
                    },
                    "footer": {
                        "height": "1mm",
          },

          timeout: 540000, 
          phantomPath: require("phantomjs-prebuilt").path
    };

        var filename = 'salarySlip_'+req.body.emp_name+'-'+req.body.salary_month+'.pdf';
        filename = filename.replace(/ /g,"_")
        pdf.create(req.body.html, options).toFile('./app/salarySlips/'+filename, function(err, result) {
            if (err)
            {
                console.log(err); // { filename: '/app/businesscard.pdf' }
            }
            else
            {
                
                res.send({filename:'/salarySlips/'+filename});
            }
            
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
    saveSalarySlip: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                
                if(req.body.salary_slip_id)
                {
                    var sql = 'UPDATE `salaray_process` SET  `salary_month`=?, `working_days`=?, `working_half_days` = ?, `fixed`=?,`earned`=?,`deductions`=?,`finalfixedearns`=?,`net_salary`= ? WHERE `id` = '+req.body.salary_slip_id;
                }
                else
                {
                    var sql = 'INSERT INTO `salaray_process`(`employee_id`, `salary_month`,`working_days`, `working_half_days`, `fixed`, `earned`, `deductions`, `finalfixedearns`, `net_salary`, `createdby`, `companyid`) VALUES ('+req.body.employee_id+',?,?,?,?,?,?,?,?,'+req.decoded.logedinuser.id+','+req.decoded.logedinuser.companyid+')';
                }
                con.query(sql,[moment(new Date(req.body.salary_month)).format("YYYY-MM-DD"), req.body.working_days, req.body.working_half_days, req.body.fixed, req.body.earned, req.body.deductions, req.body.finalfixedearns, req.body.net_salary],function(err, result){
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
                            message:'Salary details saved successfully.'
                        });
                //sudo npm link phantomjs-prebuilt
                        var options = { 
                            "height": "11.5in",
                            "width": "8.5in",
                            "header": {
                                "height": "1mm",
                                
                            },
                            "footer": {
                                "height": "1mm",
                  },
                  phantomPath: require("phantomjs-prebuilt").path
            };
        
                var filename = 'salarySlip_'+req.body.emp_name+'-'+req.body.salary_file_month+'.pdf';
                filename = filename.replace(/ /g,"_");
                pdf.create(req.body.html, options).toFile('./app/salarySlips/'+filename, function(err, result) {
                    if (err)
                    {
                        console.log(err); // { filename: '/app/businesscard.pdf' }
                    }
                    else
                    {
                        console.log(result); // { filename: '/app/businesscard.pdf' }
                    }
                    
                  });

                    }
                });
                con.release();
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

    checkSalaryProceedStatus: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                con.query('SELECT * FROM `salaray_process` WHERE `employee_id` = ? AND DATE_FORMAT(`salary_month`, "%Y-%m") = ?',[req.body.employee_id, moment(new Date(req.body.salary_month)).format("YYYY-MM")],function(err, result){
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
                       
                        res.send(result);
                        
                    }
                });
                con.release();
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

    getSalarySlipList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                con.query('SELECT `id`,DATE_FORMAT(`salary_month`,"%M-%Y") AS salary_month, DATE_FORMAT(`createddate`,"%d %M, %Y") AS salary_date,`net_salary`, fixed, earned, deductions, (SELECT employees.name from employees where employees.id = salaray_process.employee_id) as emp_name FROM `salaray_process` WHERE `employee_id` = ? ORDER BY id DESC LIMIT 36',[req.params.id],function(err, result){
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
                       
                        res.send(result);
                        
                    }
                });
                con.release();
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

    getEmployeeSalaryDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                
                    var sql = 'SELECT * FROM `salary_master` WHERE status = 1 AND `companyid` = '+req.decoded.logedinuser.companyid+' AND employee_id = '+req.body.employee_id;

                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    getEmployeesAttendanceList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                
                    var sql = 'SELECT attendance.id,(SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) as min_intime, DATE_FORMAT(`date`, "%d-%m-%Y") AS att_date, DATE_FORMAT(`date`, "%d") AS att_day, DATE_FORMAT(`date`, "%M") AS att_month, IFNULL(DATE_FORMAT(`intime`, "%H:%i"),"--:--") AS in_time, IFNULL(DATE_FORMAT(`outtime`, "%H:%i"),"--:--") AS out_time,`in_address`, `out_address`, (CASE WHEN  DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.intime,"%H:%i") < (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND attendance.outtime IS NOT NULL THEN 1 ELSE 0 END) AS latemark_status, (CASE WHEN attendance.employee_id ='+req.body.employee_id+' AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND (attendance.outtime IS NULL OR DATE_FORMAT(attendance.outtime,"%H:%i") < (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid) OR (DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")))) THEN 1 ELSE 0 END) AS half_day_status, attendance.uuid, attendance.out_uuid FROM `attendance` INNER JOIN employees ON employees.id = attendance.employee_id WHERE attendance.`companyid` = '+req.decoded.logedinuser.companyid+' AND attendance.`employee_id` = '+req.body.employee_id+' AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" ORDER BY att_date ASC';

                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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


    getEmployeesAttendanceMonthlyReport: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                
                    // var sql = 'SELECT employees.id, employees.name, GROUP_CONCAT(DATE_FORMAT(attendance.date,"%d") ORDER BY attendance.date ASC SEPARATOR \', \') AS attendance_dates, GROUP_CONCAT(CASE WHEN ISNULL(attendance.`intime`) THEN "--:--" ELSE  DATE_FORMAT(attendance.`intime`, "%H:%i") END ORDER BY attendance.date ASC SEPARATOR \', \') AS attendance_intimes, GROUP_CONCAT(CASE WHEN ISNULL(`attendance`.`outtime`) THEN "--:--" ELSE  DATE_FORMAT(`attendance`.`outtime`, "%H:%i") END ORDER BY attendance.date ASC SEPARATOR \', \') AS attendance_outtimes FROM attendance INNER JOIN employees ON attendance.employee_id = employees.id WHERE DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" GROUP BY employees.id ORDER BY employees.id ASC';

                        var monthDate = new Date('01-'+req.body.date);
                        //var day = monthDate.getDay();
                        //if(day < 10)
                        //day = '0'+day;

                        var day = "01"
                        var month = monthDate.getMonth();
                        if(month < 10)
                        month = '0'+month;
                        var year = monthDate.getFullYear();
                        var fullDate =year+'-'+month+'-'+day; 



                       // var sql = 'SELECT employees.id, employees.name, (select GROUP_CONCAT(DATE_FORMAT(_date,"%D") ORDER BY date ASC SEPARATOR ", ") FROM ( SELECT ADDDATE("'+fullDate+'", INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY) AS _date FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a CROSS JOIN ( SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 ) AS b CROSS JOIN ( SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 ) AS c ) AS dates WHERE DATE_FORMAT(_date, "%M-%Y") =  "'+req.body.date+'" ORDER BY _date) AS attendance_dates, GROUP_CONCAT(CASE WHEN (ISNULL(attendance.`intime`) AND ISNULL(`attendance`.`outtime`)) THEN "A" WHEN ISNULL(attendance.`intime`) THEN "--:--" ELSE  DATE_FORMAT(attendance.`intime`, "%H:%i") END ORDER BY _date ASC SEPARATOR ", ") AS attendance_intimes, GROUP_CONCAT(CASE WHEN ISNULL(`attendance`.`outtime`) THEN "--:--" ELSE  DATE_FORMAT(`attendance`.`outtime`, "%H:%i") END ORDER BY _date ASC SEPARATOR ", ") AS attendance_outtimes FROM attendance INNER JOIN employees ON attendance.employee_id = employees.id WHERE DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" GROUP BY employees.id ORDER BY employees.id ASC'


                    //var sql = 'SELECT employees.id, employees.name, (select GROUP_CONCAT(DATE_FORMAT(date,"%D") ORDER BY date ASC SEPARATOR ", ") FROM ( SELECT ADDDATE("'+fullDate+'", INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY) AS date FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a CROSS JOIN ( SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 ) AS b CROSS JOIN ( SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 ) AS c ) AS dates WHERE DATE_FORMAT(date, "%M-%Y") =  "'+req.body.date+'" ORDER BY date) AS attendance_dates, GROUP_CONCAT(CASE WHEN ISNULL(attendance.`intime`) THEN "--:--" ELSE  DATE_FORMAT(attendance.`intime`, "%H:%i") END ORDER BY attendance.date ASC SEPARATOR ", ") AS attendance_intimes, GROUP_CONCAT(CASE WHEN ISNULL(`attendance`.`outtime`) THEN "--:--" ELSE  DATE_FORMAT(`attendance`.`outtime`, "%H:%i") END ORDER BY attendance.date ASC SEPARATOR ", ") AS attendance_outtimes FROM attendance INNER JOIN employees ON attendance.employee_id = employees.id WHERE DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" GROUP BY employees.id ORDER BY employees.id ASC'

                    var sql = 'SET @p0="'+req.body.date+'"; SET @p1="'+fullDate+'"; SET @p2='+req.decoded.logedinuser.companyid+'; CALL `monthlyAttendanceReport`(@p0, @p1, @p2);'
                     console.log(sql)
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    


    
    // SALARY MANAGEMENT

    // LEAVES MANAGEMENT

    getLeavesListForEmployee: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
             connection.acquire(function(err, con){

                con.query('SELECT `id`,`leave_type`, `approval_status`, CONCAT(DATE_FORMAT(`from_date`,"%d %b, %Y")," to ", DATE_FORMAT(`to_date`,"%d %b, %Y")) AS date_range, (CASE WHEN `approval_status` = 1 THEN "Approved" WHEN `approval_status` = 2 THEN "Denied" ELSE "Pending" END) as approval, DATE_FORMAT(`createddate`, "%d") AS _day, DATE_FORMAT(`createddate`, "%b %Y") AS _month FROM `leaves` WHERE `employee_id` = ? ORDER BY id DESC',[req.params.id],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        
                        res.send(result);
                    }
                           
                });
                con.release();
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


    getLeavesList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    if(req.decoded.logedinuser.role == 4) 
                    {
                        var sql = 'SELECT `id`, (SELECT employees.name from employees WHERE employees.id = leaves.employee_id LIMIT 1) AS emp_name, `leave_type`, DATE_FORMAT(`from_date`, "%D %M, %Y") AS from_date, DATE_FORMAT(`to_date`, "%D %M, %Y") AS to_date,(CASE WHEN `approval_status` = 1 THEN "Approved" WHEN `approval_status` = 2 THEN "Denied" ELSE "Pending" END) as approval  FROM `leaves` WHERE `employee_id`= '+req.decoded.logedinuser.id
                    }
                    else
                    var sql = 'SELECT `id`, (SELECT employees.name from employees WHERE employees.id = leaves.employee_id LIMIT 1) AS emp_name, `leave_type`, DATE_FORMAT(`from_date`, "%D %M, %Y") AS from_date, DATE_FORMAT(`to_date`, "%D %M, %Y") AS to_date,(CASE WHEN `approval_status` = 1 THEN "Approved" WHEN `approval_status` = 2 THEN "Denied" ELSE "Pending" END) as approval  FROM `leaves` WHERE `companyid`= '+req.decoded.logedinuser.companyid

                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    getleaveDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT *, (SELECT employees.name FROM employees WHERE employees.id = leaves.approved_by) as _approved_by FROM `leaves` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    deleteLeaveDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'DELETE FROM `leaves` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
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
                            message:'Leave details deleted successfully.'
                        });
                    }
                });
                con.release();
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

    saveLeaveDetails:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
                    delete req.body._approved_by;
                    if(req.body.from_date)
                    req.body.from_date =  moment(new Date(req.body.from_date)).format("YYYY-MM-DD");
                    if(req.body.to_date)
                    req.body.to_date =  moment(new Date(req.body.to_date)).format("YYYY-MM-DD");
            conn.query('UPDATE `leaves` SET ? WHERE `id` = ?',[req.body, req.body.id], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Leave details updated successfully.'
                    })
                }
            });
        }
        else
        {
            delete req.body._approved_by;
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            req.body.employee_id = req.decoded.logedinuser.id;
            req.body.approval_status = 0;
            if(req.body.from_date)
                    req.body.from_date =  moment(new Date(req.body.from_date)).format("YYYY-MM-DD");
                    if(req.body.to_date)
                    req.body.to_date =  moment(new Date(req.body.to_date)).format("YYYY-MM-DD");
            conn.query('INSERT INTO `leaves` SET ?',req.body, function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Leave details saved successfully.'
                    })
                }
            });
        }
            conn.release();
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


    // LEAVES MANAGEMENT
    
    // ONDUTY REQUEST

    saveOndutyRequest:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
                    delete req.body._approved_by;
                    if(req.body.date)
                    req.body.date =  moment(new Date(req.body.date)).format("YYYY-MM-DD");
                    // if(req.body.intime)
                    // req.body.intime =  moment(new Date(req.body.intime)).format("HH:mm");
                    // if(req.body.outtime)
                    // req.body.outtime =  moment(new Date(req.body.outtime)).format("HH:mm");
            conn.query('UPDATE `onduty` SET ? WHERE `id` = ?',[req.body, req.body.id], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Leave details updated successfully.'
                    })
                }
            });
        }
        else
        {
            delete req.body._approved_by;
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.employee_id = req.decoded.logedinuser.id;
            req.body.approval_status = 0;
            if(req.body.date)
                    req.body.date =  moment(new Date(req.body.date)).format("YYYY-MM-DD");
                    // if(req.body.intime)
                    // req.body.intime =  moment(new Date(req.body.intime)).format("HH:mm");
                    // if(req.body.outtime)
                    // req.body.outtime =  moment(new Date(req.body.outtime)).format("HH:mm");
            conn.query('INSERT INTO `onduty` SET ?',req.body, function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Leave details saved successfully.'
                    })
                }
            });
        }
            conn.release();
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

    getondutyRequestDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT *, (SELECT employees.name FROM employees WHERE employees.id = onduty.approvedby) as _approved_by FROM `onduty` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

    deleteOndutyDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'DELETE FROM `onduty` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
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
                            message:'Leave details deleted successfully.'
                        });
                    }
                });
                con.release();
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

    // ONDUTY REQUEST



    // LOAN REQUEST

    getloanRequestList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    // if(req.decoded.logedinuser.role != 1 && req.decoded.logedinuser.role != 2 && req.decoded.logedinuser.role != 3) 
                    if(req.decoded.logedinuser.role != 1 && req.decoded.logedinuser.role != 2) 
                    {
                        var sql = 'SELECT `id`, approval_status, (SELECT employees.name FROM employees WHERE employees.id = loan.employee_id) AS emp_name, FORMAT(`loan_amt`, 2) AS loan_amt, FORMAT(`approval_amt`, 2) AS approved_amt, CONCAT(`tenure`," months") as `tenure`,FORMAT(`emi`, 2) AS `emi`,`interest_rate`, (CASE WHEN `approval_status` = 1 THEN CONCAT("Approved ", "(", FORMAT(`approval_amt`,2),")") WHEN `approval_status` = 2 THEN "Denied" ELSE "Pending" END) as approval, `starting_month`,IFNULL((SELECT FORMAT(SUM(loan_payment.emi), 2) FROM loan_payment WHERE loan_payment.loan_id = loan.id AND loan_payment.status = 1),"00.00") AS paid_emi, (CASE WHEN `approval_status` = 1 THEN FORMAT(loan.approval_amt, 2) ELSE FORMAT(`loan_amt`, 2) END) AS final_loan_amt, (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status, DATE_FORMAT(`createddate`, "%D %M, %Y") AS `requested_date`, DATE_FORMAT(`createddate`, "%d") AS `_day`, DATE_FORMAT(`createddate`, "%b %Y") AS `_month`  FROM `loan` WHERE `employee_id`= '+req.decoded.logedinuser.id
                    }
                    else
                    var sql = 'SELECT `id`, approval_status, (SELECT employees.name FROM employees WHERE employees.id = loan.employee_id) AS emp_name, FORMAT(`loan_amt`, 2) AS loan_amt, FORMAT(`approval_amt`, 2) AS approved_amt, CONCAT(`tenure`," months") as `tenure`,FORMAT(`emi`, 2) AS `emi`,`interest_rate`, (CASE WHEN `approval_status` = 1 THEN CONCAT("Approved ", "(", FORMAT(`approval_amt`,2),")") WHEN `approval_status` = 2 THEN "Denied" ELSE "Pending" END) as approval, `starting_month`,IFNULL((SELECT FORMAT(SUM(loan_payment.emi), 2) FROM loan_payment WHERE loan_payment.loan_id = loan.id AND loan_payment.status = 1),"00.00") AS paid_emi, (CASE WHEN `approval_status` = 1 THEN FORMAT(loan.approval_amt, 2) ELSE FORMAT(`loan_amt`, 2) END) AS final_loan_amt, (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status, DATE_FORMAT(`createddate`, "%D %M, %Y") AS `requested_date`, DATE_FORMAT(`createddate`, "%d") AS `_day`, DATE_FORMAT(`createddate`, "%b %Y") AS `_month`  FROM `loan` WHERE `companyid` = '+req.decoded.logedinuser.companyid

                }

                
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    getloanRequestDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT *, (SELECT employees.name FROM employees WHERE employees.id = loan.approvedby) AS _approved_by FROM `loan` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    deleteLoanRequest: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'DELETE FROM `loan` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
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
                            message:'Loan details deleted successfully.'
                        });
                    }
                });
                con.release();
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

    saveLoanRequest:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body._approved_by)
                delete req.body._approved_by;
                
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
                    delete req.body._approved_by;
                    if(req.body.loan_amt_paid_date != undefined && req.body.loan_amt_paid_date != null)
            req.body.loan_amt_paid_date =  moment(new Date(req.body.loan_amt_paid_date)).format("YYYY-MM-DD");
            conn.query('UPDATE `loan` SET ? WHERE `id` = ?',[req.body, req.body.id], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Loan details updated successfully.'
                    })
                }
            });
        }
        else
        {
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            if(req.body.employee_id == undefined || req.body.employee_id == null || req.body.employee_id == '')
                req.body.employee_id = req.decoded.logedinuser.id;

            req.body.approval_status?req.body.approval_status:req.body.approval_status = 0;
            if(req.body.loan_amt_paid_date != undefined && req.body.loan_amt_paid_date != null)
            req.body.loan_amt_paid_date =  moment(new Date(req.body.loan_amt_paid_date)).format("YYYY-MM-DD");
            conn.query('INSERT INTO `loan` SET ?',req.body, function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Loan request saved successfully.'
                    })
                }
            });
        }
            conn.release();
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


    // LOAN REQUEST

    // LOAN RECIEPT

    getloanRecieptList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    if(req.decoded.logedinuser.role == 4) 
                    {
                        var sql = 'SELECT `id`, (case WHEN length(`loan_id`) = 1 THEN concat("00000",loan_id) WHEN length(`loan_id`) = 2 THEN concat("0000",loan_id) WHEN length(`loan_id`) = 3 THEN concat("000",loan_id) WHEN length(`loan_id`) = 4 THEN concat("00",loan_id) WHEN length(`loan_id`) = 5 THEN concat("0",loan_id) ELSE loan_id END) AS `loan_id`, (SELECT employees.name FROM employees WHERE employees.id = loan_payment.employee_id) AS emp_name, FORMAT(`emi`,2) AS paid_emi, DATE_FORMAT(`paid_date`, "%D %M, %Y") AS `paid_date`, (SELECT employees.name FROM employees WHERE employees.id = loan_payment.recieved_by) AS `recieved_by`, (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status  FROM `loan_payment` WHERE `employee_id`= '+req.decoded.logedinuser.id
                    }
                    else
                    var sql = 'SELECT `id`, (case WHEN length(`loan_id`) = 1 THEN concat("00000",loan_id) WHEN length(`loan_id`) = 2 THEN concat("0000",loan_id) WHEN length(`loan_id`) = 3 THEN concat("000",loan_id) WHEN length(`loan_id`) = 4 THEN concat("00",loan_id) WHEN length(`loan_id`) = 5 THEN concat("0",loan_id) ELSE loan_id END) AS `loan_id` , (SELECT employees.name FROM employees WHERE employees.id = loan_payment.employee_id) AS emp_name, FORMAT(`emi`,2) AS paid_emi, DATE_FORMAT(`paid_date`, "%D %M, %Y") AS `paid_date`, (SELECT employees.name FROM employees WHERE employees.id = loan_payment.recieved_by) AS `recieved_by`, (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status  FROM `loan_payment` WHERE `companyid` = '+req.decoded.logedinuser.companyid

                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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


    deleteLoanReciept: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'DELETE FROM `loan_payment` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
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
                            message:'Loan reciept details deleted successfully.'
                        });
                    }
                });
                con.release();
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

    getLoanApplications: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                   
                    var sql = 'SELECT `id`,(case WHEN length(`id`) = 1 THEN concat("00000",id) WHEN length(`id`) = 2 THEN concat("0000",id) WHEN length(`id`) = 3 THEN concat("000",id) WHEN length(`id`) = 4 THEN concat("00",id) WHEN length(`id`) = 5 THEN concat("0",id) ELSE id END) AS `loan_id` , (SELECT employees.name FROM employees WHERE employees.id = loan.employee_id LIMIT 1) AS emp_name, employee_id, `approval_amt`,`interest_rate`,`emi`,`tenure` FROM `loan` WHERE  `status` = 1  AND `companyid` = '+req.decoded.logedinuser.companyid

                }
                con.query(sql,function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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
    getloanRecieptDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT * FROM `loan_payment` WHERE `id` =  '+req.params.id
                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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

    getTotalPaidEmiAmount: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT SUM(loan_payment.emi) as total_paid_emi FROM loan_payment WHERE loan_payment.loan_id = ? AND loan_payment.status = 1';

                con.query(sql,[req.body.loan_id],function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {
                        res.send(result)
                    }
                });
                con.release();
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


    saveLoanReciet:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
                    req.body.paid_date =  moment(new Date(req.body.paid_date)).format("YYYY-MM-DD");
            conn.query('UPDATE `loan_payment` SET ? WHERE `id` = ?; UPDATE loan SET `status` = (CASE WHEN (SELECT SUM(loan_payment.emi) FROM loan_payment WHERE loan_payment.loan_id = loan.id AND loan_payment.status = 1) >= loan.approval_amt THEN 0 ELSE 1 END) WHERE loan.id = ?',[req.body, req.body.id,  req.body.loan_id], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Loan reciept updated successfully.'
                    })
                }
            });
        }
        else
        {
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            req.body.recieved_by = req.decoded.logedinuser.id;

            req.body.paid_date =  moment(new Date(req.body.paid_date)).format("YYYY-MM-DD");
            conn.query('INSERT INTO `loan_payment` SET ?; UPDATE loan SET `status` = (CASE WHEN (SELECT SUM(loan_payment.emi) FROM loan_payment WHERE loan_payment.loan_id = loan.id AND loan_payment.status = 1) >= loan.approval_amt THEN 0 ELSE 1 END) WHERE loan.id = ?',[req.body, req.body.loan_id], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Loan reciept saved successfully.'
                    })
                }
            });
        }
            conn.release();
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


    // LOAN RECIEPT

    // DASHBOARD

    
    getDashboardLoanData: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT SUM(loan.approval_amt) as requests,(SELECT SUM(loan_payment.emi) FROM loan_payment WHERE loan_payment.status = 1 AND loan_payment.companyid = loan.companyid) as reciepts FROM loan WHERE loan.status = 1 AND loan.approval_status = 1 AND loan.companyid = '+req.decoded.logedinuser.companyid;

                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                        res.send([result[0].requests, result[0].reciepts])
                    }
                });
                con.release();
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
    
    getRestUsersList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT `id`,`name`, IFNULL(`profilepic`,"default.jpg") as profilepic, dob, CONCAT(`mobile1`,(CASE WHEN `mobile2` IS NULL OR `mobile2` = "" THEN "" ELSE CONCAT(" / ",`mobile2`) END )) AS mobiles, `email`,(SELECT role_master.name FROM role_master WHERE role_master.id = role) as role_name, (SELECT designation_master.name from designation_master WHERE designation_master.id = employees.designation) AS `designationname`, `designation` FROM `employees` WHERE `id` != '+req.decoded.logedinuser.id+' AND `companyid` = '+req.decoded.logedinuser.companyid;

                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                        res.send(result)
                    }
                });
                con.release();
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

    
    deleteOfficeLocations: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('DELETE FROM `office_locations` WHERE `id` in ('+req.body.locationIds+')', function(err, result){
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
                        message:'Office location(s) deleted permanently'
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

    saveOfficeLocationDetails:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
            conn.query('UPDATE `office_locations` SET ? WHERE `id` = ?',[req.body, req.body.id], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Office location details updated successfully.'
                    })
                }
            });
        }
        else
        {
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            conn.query('INSERT INTO `office_locations` SET ?',[req.body], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Office location details saved successfully.'
                    })
                }
            });
        }
            conn.release();
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

    getOfficeLocationsList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT `id`, `name`, `lat`, `lang`, address FROM `office_locations` WHERE `companyid` = '+req.decoded.logedinuser.companyid;

                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                        res.send(result)
                    }
                });
                con.release();
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
    
    
    getChatLog: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
var charLogs = [];
            fs.readdir('./chat-logs', (err, files) => { 
                if (err) 
                  console.log(err); 
                else { 
                  console.log("\nCurrent directory filenames:"); 
                //   files.forEach(file => { 
                  for(var i = 0; i < files.length;i++) { 
                    if(files[i].includes(req.decoded.logedinuser.id+'_'+req.params.userid) || files[i].includes(req.params.userid+'_'+req.decoded.logedinuser.id))
                    {
                        fs.readFile('./chat-logs/'+files[i], 'utf8', function(err, data){ 
      
                            // Display the file content 
                            console.log(err); 
                            var jsonData = data.split('*-/n*')
                            jsonData.map(function(value){
                                charLogs.push(JSON.parse(value));
                            })
                            

                           
                        }); 
                    }
                    if(i == files.length)
                    {
                        res.send(charLogs);
                    }
                    
                  }
                 
                  
                } 
              }) 
          

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
    
    getMobileDashboardRecord: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT id, DATE_FORMAT(CURDATE(),"%M, %Y") AS  salary_date, DAY(LAST_DAY(CURDATE())) no_days, ((SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = DATE_FORMAT(CURDATE(),"%M-%Y") AND DATE_FORMAT(attendance.intime,"%H:%i") <= (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.outtime,"%H:%i") >= (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid))) AS prest_days_count, (SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid) as working_shift, (SELECT CASE WHEN ISNULL(attendance.outtime) THEN CASE WHEN ISNULL(attendance.intime) THEN "--:--" ELSE DATE_FORMAT(attendance.intime, "%H:%i") END ELSE DATE_FORMAT(attendance.outtime, "%H:%i") END FROM attendance WHERE attendance.employee_id =  employees.id AND DATE_FORMAT(attendance.date,"%D-%M-%Y") = DATE_FORMAT(CURDATE(),"%D-%M-%Y")) AS last_punch, (SELECT IFNULL(DATE_FORMAT(attendance.intime,"%H:%i"), "--:--") FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%D-%M-%Y") = DATE_FORMAT(CURDATE(),"%D-%M-%Y")) AS in_time, (SELECT IFNULL(DATE_FORMAT(attendance.outtime,"%H:%i"), "--:--") FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%D-%M-%Y") = DATE_FORMAT(CURDATE(),"%D-%M-%Y")) AS out_time, IFNULL(CONCAT("uploads/employee/", profilepic), "") AS `_profilepic`, (SELECT m.name FROM employees AS m WHERE m.id = employees.manager_id) AS manager_name, (SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = DATE_FORMAT(CURDATE(),"%M-%Y") AND DATE_FORMAT(attendance.intime,"%H:%i") <= (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.outtime,"%H:%i") >= (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid)) AS prest_days_count, IFNULL((SELECT SUM(loan.approval_amt) FROM loan WHERE loan.employee_id = employees.id),0) as total_loan_amt, IFNULL((SELECT SUM(loan_payment.emi) FROM loan_payment WHERE loan_payment.employee_id = employees.id),0) as total_emi_paid, (SELECT COUNT(*) FROM leaves WHERE leaves.approval_status = 1 AND leaves.employee_id = employees.id) as total_leaves, (SELECT DATE_FORMAT(salary_master.apprisal_date, "%M, %Y") FROM salary_master WHERE salary_master.status != 0  AND salary_master.employee_id = employees.id) AS last_apprisal, (SELECT CASE WHEN AVG(employee_reviews.review) >= 3 THEN "BEST" WHEN (AVG(employee_reviews.review) < 3 && AVG(employee_reviews.review) >= 2) THEN "AVERAGE" WHEN AVG(employee_reviews.review) < 2 THEN "BAD" ELSE "AVERAGE" END FROM employee_reviews WHERE employee_reviews.employee_id = employees.id) AS my_review  FROM `employees` WHERE `id` = '+req.decoded.logedinuser.id+' AND `companyid` = '+req.decoded.logedinuser.companyid;

                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                        res.send(result)
                    }
                });
                con.release();
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

    getTopThreeEmployeesReview: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT (SELECT employees.name FROM employees WHERE employees.id = employee_reviews.employee_id) AS employee_name, (SELECT IFNULL(CONCAT("uploads/employee/", employees.profilepic), "") FROM employees WHERE employees.id = employee_reviews.employee_id) AS profilepic, review FROM `employee_reviews` WHERE  DATE_FORMAT(employee_reviews.createddate, "%Y-%M") = DATE_FORMAT(CURDATE(), "%Y-%M") AND companyid = '+req.decoded.logedinuser.companyid+' GROUP BY employee_id  ORDER BY review DESC LIMIT 3;';

                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                        res.send(result)
                    }
                });
                con.release();
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

    getBirthdaysInCurrentWeek: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT `id`, SUBSTRING_INDEX(`name`, " ", 1) as first_name, SUBSTRING_INDEX(`name`, " ", -1) as last_name, IFNULL(CONCAT("uploads/employee/", profilepic), "") AS `_profilepic`, DATE_FORMAT(`dob`, "%D %M") AS _dob FROM `employees` WHERE WEEK(dob) = WEEK(CURRENT_DATE()) AND companyid = '+req.decoded.logedinuser.companyid+';';

                con.query(sql,function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                        res.send(result)
                    }
                });
                con.release();
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

    
    // DASHBOARD


    importattendanceLog:function(req, res)
    {
        
            connection.acquire(function(err, con){

                req.body.record.map(function(val, index){
                    
                    con.query("SELECT `id` FROM `employees` WHERE employees.emp_code = ? LIMIT 1",[val.EmployeeId], function(err, idexist){
                        if(err)
                        {

                        }
                        else
                        {
                            if(idexist != undefined && idexist.length > 0 && idexist[0].id > 0) 
                            {
                                con.query('SELECT `id` FROM `attendance` WHERE `employee_id` = (SELECT `id` FROM `employees` WHERE employees.emp_code = ? LIMIT 1) AND DATE_FORMAT(`date`, "%d-%m-%Y") = "'+moment(new Date(val.AttendanceDate)).format("DD-MM-YYYY")+'" limit 1',[val.EmployeeId],function(err, result){
                                    if(err)
                                    {
                                        console.log(err)
                                        var logText = index+"- Error in record date: "+val.AttendanceDate+", Employee code: "+val.EmployeeId+"\n-------------------------------\n";
                                        fs.appendFile('./attendance-import-logs/log_error'+moment(new Date()).format("YYYY-MM-DD")+'.log', logText, function (err) {
                                            if (err) 
                                            console.log(err);
                                            else
                                            console.log('Saved!');
                                          });
                                    }
                                    else
                                    {
                                        if(result != undefined && result.length > 0)
                                        {
                                            con.query('UPDATE `attendance` SET `outtime`=?,`out_address`=? WHERE `id` = ?',[moment(val.OutTime).format("HH:mm"), "imported from biomatric", result[0].id],function(err, result){
                                                if(err)
                                                {
                                                    var logText = index+"- Error in record date: "+val.AttendanceDate+", Employee code: "+val.EmployeeId+", Error: "+err+"\n-------------------------------\n";
                                        fs.appendFile('./attendance-import-logs/log_error'+moment(new Date()).format("YYYY-MM-DD")+'.log', logText, function (err) {
                                            if (err) 
                                            console.log(err);
                                            else
                                            console.log('Saved!');
                                          });
                                                }
                                                else
                                                {
                                                    
                                                }
                                            });
                                        }
                                        else{
            
                                            
                                            //moment(new Date()).format("HH:MM")
                                            con.query('INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`,  `companyid`) VALUES ((SELECT `id` FROM `employees` WHERE employees.emp_code = ? LIMIT 1),?,?,?,?)',[val.EmployeeId,  moment(new Date(val.AttendanceDate)).format("YYYY-MM-DD"),moment(val.InTime).format("HH:mm"), "imported from biomatric",req.body.companyid],function(err, result){
                                                if(err)
                                                {
                                                    
                                                    var logText = index+"- Error in record date: "+val.AttendanceDate+", Employee code: "+val.EmployeeId+", Error: "+err+"\n-------------------------------\n";
                                        fs.appendFile('./attendance-import-logs/log_error'+moment(new Date()).format("YYYY-MM-DD")+'.log', logText, function (err) {
                                            if (err) 
                                            console.log(err);
                                            else
                                            console.log('Saved!');
                                          });
                                                }
                                                else
                                                {
                                                    
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });

                });
                res.send(200)
               con.release();
           }); 

       
    },


    saveCurrrentLocationDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {


            /* connection.acquire(function(err, con){
                con.query('',, function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                        res.send(result)
                    }
                });
                con.release();
            }); */
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

    getPolicies:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                con.query('SELECT `id`,`name`,`description`,CONCAT("https://threesainfoway.net:8896/uploads/company/",`filename`) AS policy_file FROM `policies` WHERE `companyid` = ? AND `status` = 0',[req.decoded.logedinuser.companyid], function(err, result){
                    if(err)
                    {
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Something went wrong.'
                        });
                    }
                    else
                    {

                        res.send(result)
                    }
                });
                con.release();
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


    savePartnerPaymentDetails:function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.payment_date)
                {
                    req.body.payment_date =  moment(new Date(req.body.payment_date)).format("YYYY-MM-DD");
                }
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
            conn.query('UPDATE `partner_creditPointsRedeem` SET ? WHERE `id` = ?',[req.body, req.body.id], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Partner paymentdetails updated successfully.'
                    })
                }
            });
        }
        else
        {
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            conn.query('INSERT INTO `partner_creditPointsRedeem` SET ?',[req.body], function(err, result){
                if(err)
                {
                    console.log(err)
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
                        message:'Partner payment details saved successfully.'
                    })
                }
            });
        }
            conn.release();
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

    getMyondutiesList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`,`employee_id`, `date`,  date_format(`intime`,"%H:%i") as intime, date_format(`outtime`,"%H:%i") as outtime, `approval_status`, `note`, `approval_note`, `approvedby`, date_format(date, "%d") as att_day, date_format(date, "%M") as att_month, (CASE WHEN approval_status = 1 THEN "Approved" WHEN approval_status = 2 THEN "Denied" ELSE "Pending" END) _approval_status FROM `onduty` WHERE `employee_id` = ? AND DATE_FORMAT(`date`,"%Y-%m") = ? order by id desc'
                }
                con.query(sql,[req.decoded.logedinuser.id, req.params.selectedmonth], function(err, result){
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
                        res.send(result)
                    }
                });
                con.release();
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

};

