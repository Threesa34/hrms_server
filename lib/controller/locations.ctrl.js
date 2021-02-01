var connection = require('../config/connection');
var mysql = require('mysql');
var cryptconf = require('../config/crypt.config');
var env = require('../config/env');


module.exports = {

    VerifyDuplicateContact: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT COUNT(*) as contactExist FROM `locations` WHERE id != ? AND `contact1` = ? OR `contact2` = ?',[req.params.locationid, req.params.contact, req.params.contact], function(err, result){
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

    getLocationsList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT `id`,`name`,(SELECT employees.name FROM employees WHERE employees.id = locations.managerid) as manager_name,CONCAT(`contact1`,CASE WHEN  `contact2` > 0 THEN CONCAT(" / ",`contact2`) ELSE "" END) AS contacts,`email`,(CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `locations` WHERE `companyid` = ? ORDER BY id DESC',[req.decoded.logedinuser.companyid], function(err, result){
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

    getManagersList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT employees.id, employees.name FROM employees WHERE employees.role = "manager" AND employees.id NOT IN (SELECT locations.managerid FROM locations WHERE locations.companyid = ? AND locations.id != ?) AND employees.companyid = ?',[req.decoded.logedinuser.companyid,req.params.locationid,  req.decoded.logedinuser.companyid], function(err, result){
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

    getLocationDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT * FROM `locations` WHERE `id` = ?',[req.params.locationid], function(err, result){
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

    saveLocationDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
                    conn.query('UPDATE `locations` SET ? WHERE `id` = ?', [req.body, req.body.id], function(err, result){
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
                                message:'Location details updated successfully.'
                            })
                        }
                    });
                }
                else
                {
                    req.body.companyid = req.decoded.logedinuser.companyid;
                    req.body.createdby = req.decoded.logedinuser.id;
                    conn.query('INSERT INTO `locations` SET ?', req.body, function(err, result){
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
                                message:'Location details saved successfully.'
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

    // STOCK POINT
    stock_VerifyDuplicateContact: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT COUNT(*) as contactExist FROM `stock_point` WHERE id != ? AND `contact1` = ? OR `contact2` = ?',[req.params.stockid, req.params.contact, req.params.contact], function(err, result){
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

    getStockPointsList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT `id`,`name`, CONCAT(`contact1`,CASE WHEN  `contact2` > 0 THEN CONCAT(" / ",`contact2`) ELSE "" END) AS contacts,`email`,(CASE WHEN status = 0 THEN "Deactive" ELSE "Active" END) as _status FROM `stock_point` WHERE `companyid` = ? ORDER BY id DESC',[req.decoded.logedinuser.companyid], function(err, result){
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
    getStockPointDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT * FROM `stock_point` WHERE `id` = ?',[req.params.stockpointid], function(err, result){
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

    saveStockPointDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
                    conn.query('UPDATE `stock_point` SET ? WHERE `id` = ?', [req.body, req.body.id], function(err, result){
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
                                message:'Stock point details updated successfully.'
                            })
                        }
                    });
                }
                else
                {
                    req.body.companyid = req.decoded.logedinuser.companyid;
                    req.body.createdby = req.decoded.logedinuser.id;
                    conn.query('INSERT INTO `stock_point` SET ?', req.body, function(err, result){
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
                                message:'Stock point details saved successfully.'
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

    // VENDORS
    
    saveVendorDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
                if(req.body.id != undefined && req.body.id > 0)
                {
                    delete req.body.createddate;
                    conn.query('UPDATE `vendors` SET ? WHERE `id` = ?', [req.body, req.body.id], function(err, result){
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
                                message:'Vendor details updated successfully.'
                            })
                        }
                    });
                }
                else
                {
                    req.body.companyid = req.decoded.logedinuser.companyid;
                    req.body.createdby = req.decoded.logedinuser.id;
                    conn.query('INSERT INTO `vendors` SET ?', req.body, function(err, result){
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
                                message:'Vendor details saved successfully.'
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

    getVendorsList: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT `id`,`name`,`owner`,CONCAT(`mobile1`,CASE WHEN  mobile2 > 0 THEN CONCAT(" / ",mobile2) ELSE "" END) AS mobiles, CONCAT(`email1`,(CASE WHEN  email2 != "" THEN CONCAT(" / ",email2) ELSE "" END)) AS emails, CONCAT(`landline1`,(CASE WHEN  landline2 > 0 THEN CONCAT(" / ",landline2) ELSE "" END)) AS landlines, gstin, (CASE WHEN status = 0 THEN "Deactive" WHEN status = 1 THEN "Active" ELSE "Deleted" END) AS status  FROM `vendors`', function(err, result){
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
    getVendorDetails: function(req, res)
    {
        if (req.decoded != undefined && req.decoded != null && req.decoded != '' && req.decoded.success == true) {
            connection.acquire(function(err, conn){
            conn.query('SELECT * FROM `vendors` WHERE `id` = ?',[req.params.id], function(err, result){
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


}