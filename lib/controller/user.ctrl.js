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


module.exports = {

    authenticateEmployee: function(req, res)
    {
        connection.acquire(function(err, con){
            con.query('SELECT `id`,`name`,(SELECT role_master.name from role_master WHERE role_master.id = employees.role) AS `rolename`, `role`,`companyid`,`firstlogin` FROM `employees` WHERE (`mobile1` = ? OR `email` = ?) AND `password` = ?',[req.body.mobile,req.body.mobile, cryptconf.encrypt(req.body.password)], function(err,result){
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

                                        res.send(
                                            {
                                                success:true,
                                                firstlogin: result[0].firstlogin,
                                                rolename: result[0].rolename,
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
                                    rolename: result[0].rolename,
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

    getUserDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT * FROM `employees` WHERE `id` = '+req.params.userid, function(err, result){
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

    getUsersList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                if(req.decoded.logedinuser.role == 1)
                {
                    var sql = 'SELECT `id`,`name`,CONCAT(`mobile1`,(CASE WHEN `mobile2` IS NULL OR `mobile2` = "" THEN "" ELSE CONCAT(" / ",`mobile2`) END )) AS mobiles, `email`,(SELECT role_master.name FROM role_master WHERE role_master.id = role) as role_name ,`role`,(SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid LIMIT 1) AS working_shift, (SELECT company.name FROM company WHERE company.id = employees.companyid) as company_name,(CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `employees`'
                }
                else
                {
                    var sql = 'SELECT `id`,`name`,CONCAT(`mobile1`,CASE WHEN  mobile2 > 0 THEN CONCAT(" / ",mobile2) ELSE "" END) AS mobiles, `email`,DATE_FORMAT(`dob`,"%D %M, %Y") AS  birth_date,DATE_FORMAT(`doj`,"%D %M, %Y") AS  joining_date, (SELECT role_master.name FROM role_master WHERE role_master.id = employees.role LIMIT 1) AS role_name, `role`, (SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid LIMIT 1) AS working_shift, (SELECT company.name FROM company WHERE company.id = employees.companyid) as company_name,(CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `employees` WHERE `companyid` = '+req.decoded.logedinuser.companyid
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


    saveAttendanceDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, con){
                var sql = "";
                for(var i = 0 ; i < req.body.uerids.length; i++)
                {
                    // sql = sql+'INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `companyid`) VALUES ('+req.body.uerids[i]+','+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+','+convertTime12to24(req.body.attendanceDetails.time)+',"Registered by HR.",'+req.decoded.logedinuser.companyid+');';
                    
                    sql = sql+'INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `companyid`) SELECT * FROM (SELECT '+req.body.uerids[i]+',"'+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+'","'+convertTime12to24(req.body.attendanceDetails.intime)+'","Registered by HR.",'+req.decoded.logedinuser.companyid+') AS tmp WHERE NOT EXISTS (SELECT employee_id FROM `attendance` WHERE `employee_id` = '+req.body.uerids[i]+' and date='+moment(req.body.attendanceDetails.att_date).format("YYYY-MM-DD")+' and intime IS NULL);';
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

    setAttendance: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

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
                        if(result != undefined && result.length > 0)
                        {
                            con.query('UPDATE `attendance` SET `outtime`=?,`out_address`=?,`out_latlang`=? WHERE `id` = ?',[convertTime12to24(req.body.time), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), result[0].id],function(err, result){
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
                                        message:'Out time set successfully.'
                                    });
                                }
                            });
                        }
                        else{
                            con.query('INSERT INTO `attendance`(`employee_id`, `date`, `intime`, `in_address`, `in_lanLang`,`companyid`) VALUES (?,?,?,?,?,?)',[req.decoded.logedinuser.id,  moment(new Date()).format("YYYY-MM-DD"), convertTime12to24(req.body.time), req.body.address, JSON.stringify({latitude:req.body.latitude, longitude:req.body.longitude}), req.decoded.logedinuser.companyid],function(err, result){
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
                                        message:'Intime set successfully.'
                                    });
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
                        console.log(JSON.stringify(result))
                        if(result != undefined && result.length > 0)
                        {
                            if(result[0].intime != null && result[0].outtime == null)
                            {
                                res.send({status:1});
                            }
                             if(result[0].outtime != null)
                            {
                                    res.send({status:2});
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

                con.query('SELECT `id`, `employee_id`, DATE_FORMAT(`apprisal_date`,"%d-%M-%Y") AS apprisal_date, FORMAT(`net_salary`, 2) AS `net_salary`, (SELECT employees.name FROM employees WHERE employees.id = salary_master.`createdby`) AS created_by, status FROM `salary_master` WHERE salary_master.employee_id = ? order by id desc limit 10',[req.params.id],function(err, result){
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

    getAddress: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            console.log(req.body)
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
                    addressobj['attendnace_time'] = moment(new Date(req.body.time)).format("hh:mm A")
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

    saveUserDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
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
    
                if(userDetails.id != undefined)
                {
    
                    //  userDetails.profilepic =  userDetails.profilepic.replace(/http:\/\/192.168.0.104:8895\/uploads\/employee\//g, "");
                    if(userDetails.dob)
                     userDetails.dob =  moment(new Date(userDetails.dob)).format("YYYY-MM-DD");
                     if(userDetails.doj)
                    userDetails.doj =  moment(new Date(userDetails.doj)).format("YYYY-MM-DD");
                    delete userDetails.createddate;
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
                            })
                        }
                    });
                }    
                else{

                    userDetails.password = generaterandomPassword();
                    userDetails.createdby = req.decoded.logedinuser.id;
                    userDetails.companyid = req.decoded.logedinuser.companyid;
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

                            if(userDetails.email != undefined && userDetails.email != null && userDetails.email != '')
                            {
                                var mailbody = {
                                 reciver:userDetails.email,
                                 subject:"One Time Password",
                                 content: 'Dear ' + userDetails.name + '<br><br><br><h1 style="font-weight:bold;text-align:center;">' + cryptconf.decrypt(userDetails.password) + '</h1> <br> <p>enter this as a  password for the app.<br><br><br><br> <div style="float:left;text-align:left;">Thanks, <br> Admin <br> (L.N. software Pvt. Ltd.)</div></p>' // plain text body
                                }
                                sendMail(mailbody)
                            }
                            if(userDetails.mobile1 != undefined && userDetails.mobile1 != null && userDetails.mobile1 != '')
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
                        console.log(response);
                        res.send({
                            status:0,
                            type:'success',
                            title:'Done',
                            message:'Message shared to submitted contacts.'
                        });
                      })
                }
                            
                            res.send({
                                status:1,
                                type:'success',
                                title:'Done',
                                message:'Employee details saved successfully.'
                            })
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

    // SALARY MANAGEMENT

    getEmployeesList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`, `name` FROM `employees` WHERE status != 0 AND `companyid` =   '+req.decoded.logedinuser.companyid
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
    getSalaryApprisalDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                
                    var sql = 'SELECT * FROM `salary_master` WHERE `id` =  '+req.params.id
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
                
                    var sql = 'SELECT `id`, (SELECT employees.name FROM employees WHERE employees.id = attendance.employee_id) AS emp_name, DATE_FORMAT(`date`, "%D %M, %Y") AS att_date, DATE_FORMAT(`intime`, "%I:%i %p") AS in_time, DATE_FORMAT(`outtime`, "%I:%i %p") AS out_time, `in_address`, `out_address` FROM `attendance` WHERE DATE_FORMAT(`date`, "%Y-%m-%d") = "'+moment(new Date(req.body.attendnaceDate)).format("YYYY-MM-DD")+'" AND `companyid` =  '+req.decoded.logedinuser.companyid
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
                
                    var sql = 'SELECT `id`,`name`,CONCAT(`mobile1`,(CASE WHEN `mobile2` IS NULL OR `mobile2` = "" THEN "" ELSE CONCAT(" / ",`mobile2`) END )) AS mobiles, `email`,(SELECT role_master.name FROM role_master WHERE role_master.id = role) as role_name ,`role`,(SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid LIMIT 1) AS working_shift FROM `employees` WHERE `id` NOT IN (SELECT attendance.employee_id FROM attendance WHERE DATE_FORMAT(`date`, "%Y-%m-%d") = "'+moment(new Date(req.body.attendnaceDate)).format("YYYY-MM-DD")+'" AND `companyid` =  '+req.decoded.logedinuser.companyid+') AND `companyid` = '+req.decoded.logedinuser.companyid;

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
                
                    var sql = 'SELECT `name`,`id`, DATE_FORMAT(CURDATE(),"%D %M, %Y") AS  salary_date, DAY(LAST_DAY(CURDATE())) no_days, DATE_FORMAT(`doj`,"%D %M, %Y") AS  joining_date,(SELECT shift_management.name FROM shift_management WHERE shift_management.id = employees.shiftid) as working_shift, (SELECT role_master.name FROM role_master WHERE role_master.id = employees.role) AS rolename,(SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND DATE_FORMAT(attendance.intime,"%H:%i") <= (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.outtime,"%H:%i") >= (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid)) AS prest_days_count,(SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND (attendance.outtime IS NULL OR DATE_FORMAT(attendance.outtime,"%H:%i") < (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid) OR (DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i"))))) AS half_days_count, (SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.intime,"%H:%i") < (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND attendance.outtime IS NOT NULL) AS latemarks_count FROM `employees` WHERE `companyid` = '+req.decoded.logedinuser.companyid+' AND id = '+req.body.employee_id;

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
                console.log(result); // { filename: '/app/businesscard.pdf' }
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
                    var sql = 'UPDATE `salaray_process` SET  `salary_month`=?,`fixed`=?,`earned`=?,`deductions`=?,`finalfixedearns`=?,`net_salary`= ? WHERE `id` = '+req.body.salary_slip_id;
                }
                else
                {
                    var sql = 'INSERT INTO `salaray_process`(`employee_id`, `salary_month`,`fixed`, `earned`, `deductions`, `finalfixedearns`, `net_salary`, `createdby`, `companyid`) VALUES ('+req.body.employee_id+',?,?,?,?,?,?,'+req.decoded.logedinuser.id+','+req.decoded.logedinuser.companyid+')';
                }
                con.query(sql,[moment(new Date(req.body.salary_month)).format("YYYY-MM-DD"), req.body.fixed, req.body.earned, req.body.deductions, req.body.finalfixedearns, req.body.net_salary],function(err, result){
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

                        var options = { 
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
                con.query('SELECT `id`,DATE_FORMAT(`salary_month`,"%M-%Y") AS salary_month, DATE_FORMAT(`createddate`,"%d %M, %Y") AS salary_date,`net_salary` FROM `salaray_process` WHERE `employee_id` = ? ORDER BY id DESC LIMIT 12',[req.params.id],function(err, result){
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
                
                    var sql = 'SELECT DATE_FORMAT(`date`, "%d-%m-%Y") AS att_date, DATE_FORMAT(`intime`, "%h:%i %p") AS in_time, DATE_FORMAT(`outtime`, "%h:%i %p") AS out_time,`in_address`, `out_address`, (CASE WHEN  DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.latemark_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND DATE_FORMAT(attendance.intime,"%H:%i") < (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")) AND attendance.outtime IS NOT NULL THEN 1 ELSE 0 END) AS latemark_status, (CASE WHEN attendance.employee_id ='+req.body.employee_id+' AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'" AND (attendance.outtime IS NULL OR DATE_FORMAT(attendance.outtime,"%H:%i") < (SELECT DATE_FORMAT(shift_management.outtime,"%H:%i") FROM shift_management WHERE shift_management.id = employees.shiftid) OR (DATE_FORMAT(attendance.intime,"%H:%i") > (SELECT DATE_FORMAT(ADDTIME((SELECT shift_management.intime FROM shift_management WHERE shift_management.id = employees.shiftid), (SELECT shift_management.halfday_interval FROM shift_management WHERE shift_management.id = employees.shiftid)),"%H:%i")))) THEN 1 ELSE 0 END) AS half_day_status FROM `attendance` INNER JOIN employees ON employees.id = attendance.employee_id WHERE attendance.`companyid` = '+req.decoded.logedinuser.companyid+' AND attendance.`employee_id` = '+req.body.employee_id+' AND DATE_FORMAT(attendance.date,"%M-%Y") = "'+req.body.date+'"';

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
                
                    var sql = 'SELECT * FROM `leaves` WHERE `id` =  '+req.params.id
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
                    req.body.from_date =  moment(new Date(req.body.from_date)).format("YYYY-MM-DD");
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
            req.body.companyid = req.decoded.logedinuser.companyid;
            req.body.createdby = req.decoded.logedinuser.id;
            req.body.employee_id = req.decoded.logedinuser.id;
            req.body.approval_status = 0;
            req.body.from_date =  moment(new Date(req.body.from_date)).format("YYYY-MM-DD");
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


    // LEAVES MANAGEMENT

    // LOAN REQUEST

    getloanRequestList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    if(req.decoded.logedinuser.role == 4) 
                    {
                        var sql = 'SELECT `id`, (SELECT employees.name FROM employees WHERE employees.id = loan.employee_id) AS emp_name, FORMAT(`loan_amt`, 2) AS loan_amt, CONCAT(`tenure`," months") as `tenure`,FORMAT(`emi`, 2) AS `emi`,`interest_rate`, (CASE WHEN `approval_status` = 1 THEN CONCAT("Approved ", "(", FORMAT(`approval_amt`,2),")") WHEN `approval_status` = 2 THEN "Denied" ELSE "Pending" END) as approval, `starting_month`,IFNULL((SELECT FORMAT(SUM(loan_payment.emi), 2) FROM loan_payment WHERE loan_payment.loan_id = loan.id AND loan_payment.status = 1),"00.00") AS paid_emi, (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status  FROM `loan` WHERE `employee_id`= '+req.decoded.logedinuser.id
                    }
                    else
                    var sql = 'SELECT `id`, (SELECT employees.name FROM employees WHERE employees.id = loan.employee_id) AS emp_name, FORMAT(`loan_amt`, 2) AS loan_amt, CONCAT(`tenure`," months") as `tenure`,FORMAT(`emi`, 2) AS `emi`,`interest_rate`, (CASE WHEN `approval_status` = 1 THEN CONCAT("Approved ", "(", FORMAT(`approval_amt`,2),")") WHEN `approval_status` = 2 THEN "Denied" ELSE "Pending" END) as approval, IFNULL((SELECT FORMAT(SUM(loan_payment.emi), 2) FROM loan_payment WHERE loan_payment.loan_id = loan.id AND loan_payment.status = 1),"00.00") AS paid_emi, `starting_month`, (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status  FROM `loan` WHERE `companyid` = '+req.decoded.logedinuser.companyid

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
                
                    var sql = 'SELECT * FROM `loan` WHERE `id` =  '+req.params.id
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
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
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
            req.body.employee_id = req.decoded.logedinuser.id;

            req.body.approval_status?req.body.approval_status:req.body.approval_status = 0;
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
                
                    var sql = 'SELECT `id`,`name`, IFNULL(`profilepic`,"default.jpg") as profilepic, dob, CONCAT(`mobile1`,(CASE WHEN `mobile2` IS NULL OR `mobile2` = "" THEN "" ELSE CONCAT(" / ",`mobile2`) END )) AS mobiles, `email`,(SELECT role_master.name FROM role_master WHERE role_master.id = role) as role_name FROM `employees` WHERE `id` != '+req.decoded.logedinuser.id+' AND `companyid` = '+req.decoded.logedinuser.companyid;

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
                    console.log(files[i]); 
                    if(files[i].includes(req.decoded.logedinuser.id+'_'+req.params.userid) || files[i].includes(req.params.userid+'_'+req.decoded.logedinuser.id))
                    {
                        console.log('------------')
                        fs.readFile('./chat-logs/'+files[i], 'utf8', function(err, data){ 
      
                            // Display the file content 
                            console.log(err); 
                            console.log(data); 
                            var jsonData = data.split('*-/n*')
                            console.log(jsonData)
                            jsonData.map(function(value){
                                charLogs.push(JSON.parse(value));
                            })
                            

                           console.log(i == parseInt(files.length),'-------------------')
                           
                        }); 
                    }
                    if(i == files.length)
                    {
                       console.log(charLogs);
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
    


    // DASHBOARD

};

