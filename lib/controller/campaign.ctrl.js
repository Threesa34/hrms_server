var connection = require('../config/connection');
var mysql = require('mysql');
var cryptconf = require('../config/crypt.config');
var env = require('../config/env');
var fs = require('fs');
const axios = require('axios')
var mailer = require('../config/mailer.config');
var moment = require('moment');



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


const BitlyClient = require('bitly').BitlyClient;
const bitly = new BitlyClient('eb9be975f947cbd9f651387d6f38951927fb1cc3');


async function creatShortenUrl(url) {
    const response = await bitly.shorten(url);
    console.log(`Your shortened bitlink is ${response.link}`);
    return response.link;
  }

  function updateShortenLink(advurl,id)
  {

    bitly.shorten(advurl).then((result) => {
      if(result != undefined && typeof result == 'object' && result.link != undefined)
      {
        connection.acquire(function (err, con) {
          con.query('UPDATE `advertisements` SET `shorten_url` = ? WHERE `id` = ?', [result.link, id], function(err, updateresult){
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
      }
      
      }).catch((err) => {
        console.log(err);
      });

   
  }

function updateShortenLink_old(advurl,id)
{

    //thr@ees@34M@h@m@ayur@25

    const prettylink = require('prettylink');

// Init Access Token in constructor 
 const bitly = new prettylink.Bitly('90d7762b02f9bce4fc966897ce696cceba02463e');
// Or use init function
// bitly.init('90d7762b02f9bce4fc966897ce696cceba02463e');
bitly.short(advurl).then((result) => {
  console.log(result);
if(result != undefined && typeof result == 'object' && result.link != undefined)
{
  connection.acquire(function (err, con) {
    con.query('UPDATE `advertisements` SET `shorten_url` = ? WHERE `id` = ?', [result.link, id], function(err, updateresult){
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
}

}).catch((err) => {
  console.log(err);
});

	/* var shortUrl = require('node-url-shortener');
	try{
	shortUrl.short(advurl, function(err, url){
		
        console.log(url);
        
			connection.acquire(function (err, con) {
                con.query('UPDATE `advertisements` SET `shorten_url` = ? WHERE `id` = ?', [url, id], function(err, updateresult){
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
	 } */
	
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

    getNewsletterFeedback: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT `id`, status,(SELECT advertisements.title FROM advertisements WHERE advertisements.id = adv_id) as title, (SELECT advertisements.shorten_url FROM advertisements WHERE advertisements.id = adv_id) as shorten_url,`adv_id`,`name`,`contacts`,`message`,`emails`,DATE_FORMAT(`createdate`, "%d %M, %Y") AS created_date,(CASE WHEN status = 0 THEN "Pending" WHEN status = 1 THEN "Responsded" ELSE "Cancled" END) as _status, remark FROM `advertisements_feedback` WHERE `companyid` = '+req.decoded.logedinuser.companyid
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

    saveCustomerFeedback: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                con.query('UPDATE `advertisements_feedback` SET `status`=?,`remark`=? WHERE `id`=?', [req.body.status,req.body.remark,req.body.id],function(err, result){
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
                            title:'Done!',
                            message:'Record saved successfully.'
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

    getWebsiteEnquies: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT *, (CASE WHEN conectionstats = 2 THEN "Rejected / Denied" WHEN conectionstats = 1 THEN "Connection Done" ELSE "Pending" END) as connection_status , DATE_FORMAT(enqdate, "%D/%M/%Y") AS enq_date FROM `enquiry` order by id desc';
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

    getWebsiteVisitors: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT *, (select advertisements.title FROM advertisements WHERE advertisements.id = website_visitors.adv_id) as adv_name, DATE_FORMAT(createddate, "%D/%M/%Y") AS visited_date FROM `website_visitors` group BY adv_id, ip';
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

    getAgentEnquiries: function(req, res)
    {
         {

            connection.acquire(function(err, con){
                {
                    var sql = 'SELECT *, (CASE WHEN conectionstats = 2 THEN "Rejected / Denied" WHEN conectionstats = 1 THEN "Connection Done" ELSE "Pending" END) as connection_status , DATE_FORMAT(enqdate, "%D/%M/%Y") AS enq_date FROM `enquiry` WHERE enquiry.source = ? order by id DESC';
                }
                con.query(sql,[req.params.unique_id],function(err, result){
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
        
    },

    AuthenticateAgent: function(req, res)
    {

        connection.acquire(function(err, con){
            {
                var password = cryptconf.encrypt(req.body.password);
                var sql = 'SELECT * FROM `advertising_partners` WHERE `mobile1` = ? OR `mobile2` = ? AND password = ?';
            }
            con.query(sql,[req.body.mobile, req.body.mobile, password],function(err, result){
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
                    if(result && result.length == 1)
                    {
                        res.send(result)
                    }
                    else{
                        res.send({
                            status:0,
                            type:'error',
                            title:'Error',
                            message:'Details Does not match'
                        });
                    }
                }
            });
            con.release();
        });    
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


    getAdvNewsLetterHtmlTemplate: function(req, res)
    {
        
        connection.acquire(function(err, con){
            {
                var sql = 'SELECT enquiry_form FROM `advertisements` WHERE `id` = '+req.params.id
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
                    if(result != undefined && result.length > 0)
                    {
                        var json_file = './app/newsletters/html/'+req.params.id+'_html_template.html';
                        var filePath = 'https://threesainfoway.net:8896/newsletters/html/'+req.params.id+'_html_template.html';
                        fs.readFile(json_file, 'utf8', function(err, data){ 
                  
                            // Display the file content 
                            res.send({filepath: filePath, enquiry_form:result[0].enquiry_form});
                        });
                    }
                    else
                    {
                        var json_file = './app/newsletters/html/'+req.params.id+'_html_template.html';
                        var filePath = 'https://threesainfoway.net:8896/newsletters/html/'+req.params.id+'_html_template.html';
                    fs.readFile(json_file, 'utf8', function(err, data){ 
              
                        // Display the file content 
                        //res.send({data:data, enquiry_form:0}); 
                        res.send({filepath: filePath, enquiry_form:result[0].enquiry_form});
                    });
                    }
                     
                }
            });
            con.release();
        });

           

        
         
    },
    

    saveNewsLetter: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            var json_file = '';
            var html_file = '';

             connection.acquire(function(err, conn){
                
                if(req.body.id)
                {
                    var sql= 'UPDATE `advertisements` SET `title`=?,`description`=?,`whatsapp_no`=?,`whatsapp_msg`=?,`enquiry_form`=?,`status`=? WHERE `id` = ?';
                    var req_obj = [req.body.title, req.body.description,req.body.whatsapp_no,req.body.whatsapp_msg, req.body.enquiry_form, req.body.status, req.body.id];
                }
                else{
                    var sql= 'INSERT INTO `advertisements`(`title`, `description`,`whatsapp_no`, `whatsapp_msg`, `enquiry_form`, `createdby`, `companyid`) VALUES (?,?,?,?,?,?,?)'
                    var req_obj = [req.body.title, req.body.description,req.body.whatsapp_no,req.body.whatsapp_msg, req.body.enquiry_form, req.decoded.logedinuser.id, req.decoded.logedinuser.companyid];
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
                    
                    if(req.body.id)
                    {
                        var id =  req.body.id;
                    }
                    else
                    {
                        var id = result.insertId;
                    }

                    try{
                var adv_url = 'https://www.threesainfoway.net/promotions/?id='+String(id);

                            updateShortenLink(adv_url,id);

            
                    json_file = json_file+id+'_json_template.json';
                    html_file = html_file+id+'_html_template.html';
                    

                    var writeStream = fs.createWriteStream('./app/newsletters/json/'+json_file);
				writeStream.write(JSON.stringify(req.body.template));
                writeStream.end();
                

                var writeStream = fs.createWriteStream('./app/newsletters/html/'+html_file);
				writeStream.write(req.body.htmlTemplate.html);
				writeStream.end();
                    }
                    catch(ex)
                    {
                        console.log(ex)
                    }

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
                
                           /*  if(result[0].whatsapp_no != undefined && result[0].whatsapp_no != null && result[0].whatsapp_no != '')
                            {
                                var str = "https://wa.me/"+result[0].whatsapp_no+"?text="
                                if(result[0].whatsapp_msg != undefined && result[0].whatsapp_msg != null && result[0].whatsapp_msg != '')
                                {
                                    str = str+encodeURIComponent(result[0].whatsapp_msg);
                                }

                                var whatsappLink = '<p>Contact On Whatsapp: <a href="'+encodeURI(str)+'">'+result[0].whatsapp_no+'</a></p>'
                            }
                            else{
                                        var whatsappLink = '';
                            } */
                            
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
   

    saveFeedbacks: function(req, res)
    {
            connection.acquire(function(err, con){
                con.query("SELECT `companyid` FROM `advertisements` WHERE `id` = "+req.body.adv_id,function(err, result){
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

                        var contacts = '';

                        if(req.body.contact1 != undefined && req.body.contact1 != null && req.body.contact1 != '')
                        {
                            contacts = contacts + req.body.contact1;
                        }
                        if(req.body.contact2 != undefined && req.body.contact2 != null && req.body.contact2 != '')
                        {
                            contacts = contacts+', ' + req.body.contact2;
                        }

                        if(result.length > 0)
                        {
                        con.query('INSERT INTO `advertisements_feedback`(`adv_id`, `name`, `contacts`, `message`, `emails`, `companyid`) VALUES (?,?,?,?,?,?)',[req.body.adv_id, req.body.name, contacts, req.body.message, req.body.email, result[0].companyid],function(err, result){
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
                                    status:0,
                                    type:'success',
                                    title:'Done',
                                    message:'Thank you for getting in touch!'
                                });
                            }
                        }); 
                    }
                    }
                });
                con.release();
            });

    },


    savePromotionResponses: function(req, res)
    {
            connection.acquire(function(err, con){
                con.query("SELECT `companyid` FROM `advertisements` WHERE `id` = "+req.body.adv_id,function(err, result){
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

                    //    var  ipAddress = '';
                    //     if(req.socket && req.socket.localAddress)
                    //     {
                    //         ipAddress = ipAddress + req.socket.localAddress;
                    //     }

                        if(result.length > 0)
                        {
                        con.query('INSERT INTO `website_visitors`(`adv_id`, `ip`, `response`, `companyid`) VALUES (?,?,?,?)',[req.body.adv_id, req.body.ip, req.body.response, result[0].companyid],function(err, result){
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
                                    status:0,
                                    type:'success',
                                    title:'Done',
                                    message:'Thank you for getting in touch!'
                                });
                            }
                        }); 
                    }
                    }
                });
                con.release();
            });

    },

    SaveConnectionStatus: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {

            if(req.body.connectiondate)
            {
                req.body.connectiondate = moment(req.body.connectiondate).format("YYYY-MM-DD");
            }


           connection.acquire(function(err, con){
            {
                var sql = 'UPDATE `enquiry` SET ? WHERE `id` = ?'
            }
            con.query(sql,[req.body, req.body.id],function(err, result){
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
                        status:0,
                        type:'success',
                        title:'Done',
                        message:'Connection Status Saved successfully'
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