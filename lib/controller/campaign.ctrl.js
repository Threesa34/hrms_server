var connection = require('../config/connection');
var mysql = require('mysql');
var cryptconf = require('../config/crypt.config');
var env = require('../config/env');
var fs = require('fs');
const axios = require('axios')
var mailer = require('../config/mailer.config');



function sendMail(mailbody)
{
     const mailOptions = {
         from: cryptconf.decrypt(env.sendermail), // sender address
         to: mailbody.reciver, // list of receivers
         subject: mailbody.subject, // Subject line
         html: mailbody.content // plain text body
     };


     mailer.transporter.sendMail(mailOptions, function (err, info) {
         /* if(err)
           console.log(err)
         else
           console.log(info); */
      });
}


function updateShortenLink(advurl,id)
{
    console.log(advurl,'---------')
	var shortUrl = require('node-url-shortener');
	try{
	shortUrl.short(advurl, function(err, url){
		
        console.log(url);
        
			connection.acquire(function (err, con) {
                conn.query('UPDATE `advertisements` SET `shorten_url` = ? WHERE `id` = ?', [url, id], function(err, updateresult){
                    if(err)
                    {
                            console.log(err)
                    }
                    else
                    {
                        
                    }
                });
                con.release();
			});
	
			});
			
	 }
	 catch(ex)
	 {
		 console.log(ex);
	 }
	
}


function cretShortenUrl(adv_url)
{
    shortUrl.short(adv_url, function(err, url){
        console.log(err)
        return url;
    });   
}

module.exports = {


    getnewsLettersList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`, `title`, `shorten_url`, (CASE WHEN `enquiry_form` =1 THEN "Required" ELSE "Not Required" END) AS enquiry_required, (SELECT employees.name FROM employees WHERE employees.id = advertisements.`createdby`) AS created_by,DATE_FORMAT(`createdate`, "%d %M, %Y") AS created_date , (CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `advertisements` WHERE `companyid` = '+req.decoded.logedinuser.companyid
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

    getnewsLetterDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT * FROM `advertisements` WHERE `id` = '+req.params.id
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


    getnewsLetterJsonTemplate: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            var json_file = './app/newsletters/json/'+req.params.id+'_json_template.json';

            fs.readFile(json_file, 'utf8', function(err, data){ 
      
                // Display the file content 
                res.send({data:data}); 
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

    getnewsLetterHtmlTemplate: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            var json_file = './app/newsletters/html/'+req.params.id+'_html_template.html';

            fs.readFile(json_file, 'utf8', function(err, data){ 
      
                // Display the file content 
                res.send({data:data}); 
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


    

    saveNewsLetter: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            var json_file = '';
            var html_file = '';

             connection.acquire(function(err, conn){
                
                if(req.body.id)
                {
                    var sql= 'UPDATE `advertisements` SET `title`=?,`description`=?,`enquiry_form`=?,`status`=? WHERE `id` = ?';
                    var req_obj = [req.body.title, req.body.description, req.body.enquiry_form, req.body.status, req.body.id];
                }
                else{
                    var sql= 'INSERT INTO `advertisements`(`title`, `description`, `enquiry_form`, `createdby`, `companyid`) VALUES (?,?,?,?,?)'
                    var req_obj = [req.body.title, req.body.description, req.body.enquiry_form, req.decoded.logedinuser.id, req.decoded.logedinuser.companyid];
                }

            conn.query(sql, req_obj, function(err, result){
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
                    ;
                    if(req.body.id)
                    {
                        var id =  req.body.id;
                    }
                    else
                    {
                        var id = result.insertId;
                    }

                var adv_url = 'https://advertise-lninfotech.herokuapp.com?'+String(id);

                            updateShortenLink(adv_url,id);

            
                    json_file = json_file+id+'_json_template.json';
                    html_file = html_file+id+'_html_template.html';
                    

                    var writeStream = fs.createWriteStream('./app/newsletters/json/'+json_file);
				writeStream.write(JSON.stringify(req.body.template));
                writeStream.end();
                

                var writeStream = fs.createWriteStream('./app/newsletters/html/'+html_file);
				writeStream.write(req.body.htmlTemplate.html);
				writeStream.end();

                      res.send({
                        status:1,
                        type:'success',
                        title:'Done!',
                        message:'Record saved successfully.'
                    })
                }
            });
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


    shareOnMessage: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {


           connection.acquire(function(err, con){
            {
                var sql = 'SELECT * FROM `advertisements` WHERE `id` = '+req.body.adv_id
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

                    var url = 'http://sms.threesainfoway.net/app/smsapi/index.php?key=25C65576831AFC&routeid=415&type=text&contacts=' + req.body.contacts+ '&senderid=' + req.body.senderid + '&msg=' + result[0].description;

                    if(result[0].shorten_url != null && result[0].shorten_url != '')
                    {
                        url = url+ '\n' + result[0].shorten_url   
                    }

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

    shareOnEmail: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {


           connection.acquire(function(err, con){
            {
                var sql = 'SELECT * FROM `advertisements` WHERE `id` = '+req.body.adv_id
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


                   

                    if(result[0].shorten_url != null && result[0].shorten_url != '')
                    {
                        var link = '<br><a href="'+result[0].shorten_url+'">'+result[0].shorten_url+'/<a>';   
                    }
                    else
                    {
                        var link = '';
                    }

                    var json_file = './app/newsletters/html/'+req.body.adv_id+'_html_template.html';

                        fs.readFile(json_file, 'utf8', function(err, data){ 
                
                            var mailbody = {
                                reciver:req.body.contacts,
                                subject:req.body.subject,
                                content: 'Dear Sir/Madam,<br><br><p>'+result[0].description+link+'</p><br><br>'+data+'<br><br><p><div style="float:left;text-align:left;">Thanks.</div></p>' 
                               }
                               sendMail(mailbody);
                        }); 

                   

                       res.send({
                        status:0,
                        type:'success',
                        title:'Done',
                        message:'Message shared to submitted contacts.'
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
   

};