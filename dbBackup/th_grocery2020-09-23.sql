/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: manufacturers
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `manufacturers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `address` varchar(2500) DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `companyid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: categories
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `companyid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: distrubution_details
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `distrubution_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `distrubution_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `net_price` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: distrubution_master
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `distrubution_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) DEFAULT NULL,
  `distrubution_date` datetime DEFAULT NULL,
  `net_amount` double DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `createdby` int(11) DEFAULT NULL,
  `companyid` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: employees
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(250) DEFAULT NULL,
  `mobile1` varchar(15) DEFAULT NULL,
  `mobile2` varchar(15) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `address` varchar(1500) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `firstlogin` int(11) NOT NULL DEFAULT 0,
  `profilepic` varchar(500) DEFAULT 'default.jpg',
  `uid` varchar(50) DEFAULT NULL,
  `pan` varchar(50) DEFAULT NULL,
  `doj` date DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `locationid` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `companyid` int(11) DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: gr_details
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gr_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gr_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `gr_qty` int(11) DEFAULT NULL,
  `unit` varchar(10) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `net_price` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: gr_master
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gr_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_id` int(11) DEFAULT NULL,
  `gr_date` datetime DEFAULT NULL,
  `gross_amount` double DEFAULT NULL,
  `cgst` double DEFAULT NULL,
  `sgst` double DEFAULT NULL,
  `igst` double DEFAULT NULL,
  `net_amount` double DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `createdby` int(11) DEFAULT NULL,
  `companyid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: locations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(1500) DEFAULT NULL,
  `address` varchar(10000) DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lang` double DEFAULT NULL,
  `managerid` int(11) DEFAULT NULL,
  `contact1` bigint(20) DEFAULT NULL,
  `contact2` bigint(20) DEFAULT NULL,
  `email` varchar(2500) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `companyid` int(11) DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: company
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `company` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `owner` varchar(200) DEFAULT NULL,
  `slogan` varchar(1000) DEFAULT NULL,
  `description` varchar(2500) DEFAULT NULL,
  `mobile1` varchar(15) DEFAULT NULL,
  `mobile2` varchar(15) DEFAULT NULL,
  `email1` varchar(200) DEFAULT NULL,
  `email2` varchar(200) DEFAULT NULL,
  `landline1` varchar(15) DEFAULT NULL,
  `landline2` varchar(15) DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `address_line1` varchar(500) DEFAULT NULL,
  `address_line2` varchar(500) DEFAULT NULL,
  `city` int(11) DEFAULT NULL,
  `state` int(11) DEFAULT NULL,
  `country` int(11) DEFAULT NULL,
  `zip` int(11) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `gstin` varchar(100) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `createdby` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: offers
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `offers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `description` varchar(2500) DEFAULT NULL,
  `catagoryids` varchar(1500) DEFAULT NULL,
  `productids` varchar(1500) DEFAULT NULL,
  `offer_image` varchar(250) DEFAULT NULL,
  `offer_prcnt` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `companyid` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `createdby` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: product_images
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filename` varchar(500) DEFAULT NULL,
  `unitid` int(11) DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `companyid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 10 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: product_units
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `product_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productid` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `mrp` double DEFAULT NULL,
  `sell_price` double DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `companyid` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: products
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `description` varchar(2000) DEFAULT NULL,
  `catagoryid` int(11) DEFAULT NULL,
  `manufacturerid` int(11) DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `companyid` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: purchase_details
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `purchase_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `unit` varchar(10) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `net_price` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: purchase_master
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `purchase_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendorid` int(11) DEFAULT NULL,
  `po_date` datetime DEFAULT NULL,
  `gross_amount` double DEFAULT NULL,
  `cgst` double DEFAULT NULL,
  `sgst` double DEFAULT NULL,
  `igst` double DEFAULT NULL,
  `net_amount` double DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `createdby` int(11) DEFAULT NULL,
  `companyid` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: stock_point
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `stock_point` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `address` varchar(2500) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `contact1` varchar(10) DEFAULT NULL,
  `contact2` varchar(10) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `createdby` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `companyid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: vendors
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `owner` varchar(200) DEFAULT NULL,
  `gstin` varchar(100) DEFAULT NULL,
  `mobile1` varchar(15) DEFAULT NULL,
  `mobile2` varchar(15) DEFAULT NULL,
  `email1` varchar(200) DEFAULT NULL,
  `email2` varchar(200) DEFAULT NULL,
  `landline1` varchar(15) DEFAULT NULL,
  `landline2` varchar(15) DEFAULT NULL,
  `address` varchar(2500) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `companyid` int(11) DEFAULT NULL,
  `createddate` datetime NOT NULL DEFAULT current_timestamp(),
  `createdby` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: manufacturers
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: categories
# ------------------------------------------------------------

INSERT INTO
  `categories` (
    `id`,
    `name`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (1, 'Dry fruits', 2, '2020-09-22 17:37:15', 1);
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (2, 'Vegitable oil', 2, '2020-09-22 17:37:50', 1);
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (
    3,
    'Grocery and Staples',
    2,
    '2020-09-22 17:39:06',
    1
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (4, 'Kitchen and Dining', 2, '2020-09-22 17:39:31', 1);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: distrubution_details
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: distrubution_master
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: employees
# ------------------------------------------------------------

INSERT INTO
  `employees` (
    `id`,
    `name`,
    `mobile1`,
    `mobile2`,
    `email`,
    `address`,
    `password`,
    `role`,
    `firstlogin`,
    `profilepic`,
    `uid`,
    `pan`,
    `doj`,
    `dob`,
    `locationid`,
    `status`,
    `companyid`,
    `createdby`,
    `createddate`
  )
VALUES
  (
    1,
    'Mayur Mhatre',
    '9768241151',
    NULL,
    'mhatre975@gmail.com',
    NULL,
    '8d7420eee7bb9b726ed6d45d59286845',
    'Superadmin',
    1,
    'default.jpg',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    '2020-09-22 11:16:29'
  );
INSERT INTO
  `employees` (
    `id`,
    `name`,
    `mobile1`,
    `mobile2`,
    `email`,
    `address`,
    `password`,
    `role`,
    `firstlogin`,
    `profilepic`,
    `uid`,
    `pan`,
    `doj`,
    `dob`,
    `locationid`,
    `status`,
    `companyid`,
    `createdby`,
    `createddate`
  )
VALUES
  (
    2,
    'Yogesh Bhoir',
    '9768634000',
    NULL,
    'threesainfoway00@gmail.com',
    'Shop No.4, 1st Floor, Anand Laghu Sankul,, Near Siddhachal Phase 4, Vasant Vihar,',
    'edff20c26344cf6f7d46e1b2ed49ae1a',
    'siteadmin',
    1,
    'default.jpg',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    1,
    1,
    '2020-09-22 14:28:52'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: gr_details
# ------------------------------------------------------------

INSERT INTO
  `gr_details` (
    `id`,
    `gr_id`,
    `product_id`,
    `unit_id`,
    `gr_qty`,
    `unit`,
    `price`,
    `net_price`
  )
VALUES
  (1, 1, 1, 1, 15, 'gm', 166.66666666666666, 2500);
INSERT INTO
  `gr_details` (
    `id`,
    `gr_id`,
    `product_id`,
    `unit_id`,
    `gr_qty`,
    `unit`,
    `price`,
    `net_price`
  )
VALUES
  (2, 1, 1, NULL, 10, 'kg', 200, 2000);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: gr_master
# ------------------------------------------------------------

INSERT INTO
  `gr_master` (
    `id`,
    `po_id`,
    `gr_date`,
    `gross_amount`,
    `cgst`,
    `sgst`,
    `igst`,
    `net_amount`,
    `createddate`,
    `createdby`,
    `companyid`
  )
VALUES
  (
    1,
    1,
    '2020-09-25 00:00:00',
    4500,
    2,
    3,
    2,
    4815,
    '2020-09-22 17:56:09',
    2,
    1
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: locations
# ------------------------------------------------------------

INSERT INTO
  `locations` (
    `id`,
    `name`,
    `address`,
    `lat`,
    `lang`,
    `managerid`,
    `contact1`,
    `contact2`,
    `email`,
    `status`,
    `companyid`,
    `createdby`,
    `createddate`
  )
VALUES
  (
    1,
    'shivai nagar',
    'Address of shivai nagar',
    NULL,
    NULL,
    NULL,
    9897256726,
    NULL,
    NULL,
    0,
    1,
    2,
    '2020-09-22 17:34:55'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: company
# ------------------------------------------------------------

INSERT INTO
  `company` (
    `id`,
    `name`,
    `owner`,
    `slogan`,
    `description`,
    `mobile1`,
    `mobile2`,
    `email1`,
    `email2`,
    `landline1`,
    `landline2`,
    `website`,
    `address_line1`,
    `address_line2`,
    `city`,
    `state`,
    `country`,
    `zip`,
    `logo`,
    `gstin`,
    `status`,
    `createddate`,
    `createdby`
  )
VALUES
  (
    1,
    'Threesa Infoway',
    'Yogesh Bhoir',
    NULL,
    NULL,
    '9768634000',
    NULL,
    'threesainfoway00@gmail.com',
    NULL,
    NULL,
    NULL,
    'threesainfoway.net',
    'Shop No.4, 1st Floor, Anand Laghu Sankul,',
    'Near Siddhachal Phase 4, Vasant Vihar,',
    2836,
    22,
    101,
    400610,
    'file_1600765132725_.png',
    NULL,
    1,
    '2020-09-22 14:28:52',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: offers
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: product_images
# ------------------------------------------------------------

INSERT INTO
  `product_images` (
    `id`,
    `filename`,
    `unitid`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (
    1,
    'file0_1600776958935_.jpg',
    2,
    2,
    '2020-09-22 17:45:59',
    1
  );
INSERT INTO
  `product_images` (
    `id`,
    `filename`,
    `unitid`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (
    2,
    'file1_1600776959019_.jpg',
    2,
    2,
    '2020-09-22 17:45:59',
    1
  );
INSERT INTO
  `product_images` (
    `id`,
    `filename`,
    `unitid`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (
    4,
    'file3_1600776959229_.jpg',
    2,
    2,
    '2020-09-22 17:45:59',
    1
  );
INSERT INTO
  `product_images` (
    `id`,
    `filename`,
    `unitid`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (
    6,
    'file0_1600779423080_.jpg',
    1,
    2,
    '2020-09-22 18:27:03',
    1
  );
INSERT INTO
  `product_images` (
    `id`,
    `filename`,
    `unitid`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (
    7,
    'file1_1600779423310_.jpg',
    1,
    2,
    '2020-09-22 18:27:03',
    1
  );
INSERT INTO
  `product_images` (
    `id`,
    `filename`,
    `unitid`,
    `createdby`,
    `createddate`,
    `companyid`
  )
VALUES
  (
    8,
    'file2_1600779423724_.jpg',
    1,
    2,
    '2020-09-22 18:27:03',
    1
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: product_units
# ------------------------------------------------------------

INSERT INTO
  `product_units` (
    `id`,
    `productid`,
    `qty`,
    `unit`,
    `mrp`,
    `sell_price`,
    `createdby`,
    `createddate`,
    `companyid`,
    `status`
  )
VALUES
  (1, 1, 500, 'gm', 340, 300, 2, '2020-09-22 17:41:31', 1, 1);
INSERT INTO
  `product_units` (
    `id`,
    `productid`,
    `qty`,
    `unit`,
    `mrp`,
    `sell_price`,
    `createdby`,
    `createddate`,
    `companyid`,
    `status`
  )
VALUES
  (2, 1, 1, 'kg', 650, 600, 2, '2020-09-22 17:45:59', 1, 1);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: products
# ------------------------------------------------------------

INSERT INTO
  `products` (
    `id`,
    `name`,
    `description`,
    `catagoryid`,
    `manufacturerid`,
    `createdby`,
    `createddate`,
    `companyid`,
    `status`
  )
VALUES
  (
    1,
    'Cashow',
    'Primium Cashow',
    1,
    NULL,
    2,
    '2020-09-22 17:40:31',
    1,
    1
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: purchase_details
# ------------------------------------------------------------

INSERT INTO
  `purchase_details` (
    `id`,
    `po_id`,
    `product_id`,
    `unit_id`,
    `qty`,
    `unit`,
    `price`,
    `net_price`
  )
VALUES
  (1, 1, 1, 1, 15, 'gm', NULL, NULL);
INSERT INTO
  `purchase_details` (
    `id`,
    `po_id`,
    `product_id`,
    `unit_id`,
    `qty`,
    `unit`,
    `price`,
    `net_price`
  )
VALUES
  (2, 1, 1, NULL, 10, 'kg', NULL, NULL);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: purchase_master
# ------------------------------------------------------------

INSERT INTO
  `purchase_master` (
    `id`,
    `vendorid`,
    `po_date`,
    `gross_amount`,
    `cgst`,
    `sgst`,
    `igst`,
    `net_amount`,
    `createddate`,
    `createdby`,
    `companyid`,
    `status`
  )
VALUES
  (
    1,
    1,
    '2020-09-24 00:00:00',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '2020-09-22 17:53:09',
    2,
    1,
    0
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: stock_point
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: vendors
# ------------------------------------------------------------

INSERT INTO
  `vendors` (
    `id`,
    `name`,
    `owner`,
    `gstin`,
    `mobile1`,
    `mobile2`,
    `email1`,
    `email2`,
    `landline1`,
    `landline2`,
    `address`,
    `status`,
    `companyid`,
    `createddate`,
    `createdby`
  )
VALUES
  (
    1,
    'Vendor 1',
    'Vendor Owner',
    NULL,
    '983533573838',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    1,
    '2020-09-22 17:53:39',
    2
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
