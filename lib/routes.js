var cors = require('cors');
const security = require('./config/auth');
const corsOpt = require('./config/cors');
const multer = require('multer');
var path = require('path');

const dir = './app/uploads';
const dir_company = './app/uploads/company';
const dir_employee = './app/uploads/employee';
const dir_member = './app/uploads/member';
const dir_products = './app/uploads/products';
const dir_offers = './app/uploads/offers';
const csvimport = './imports';

const users = require('./controller/user.ctrl');
const companies = require('./controller/company.ctrl');
const products = require('./controller/products.ctrl');
const locations = require('./controller/locations.ctrl');
const campaign = require('./controller/campaign.ctrl');


let storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, dir);
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname));
	}
});

let importStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, csvimport);
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '_' + Date.now() + '_' + path.extname(file.originalname));
	}
});

let companyStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, dir_company);
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '_' + Date.now() + '_' + path.extname(file.originalname));
	}
});

let memberStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, dir_member);
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '_' + Date.now() + '_' + path.extname(file.originalname));
	}
});

let employeeStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, dir_employee);
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '_' + Date.now() + '_' + path.extname(file.originalname));
	}
});

let productsStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, dir_products);
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '_' + Date.now() + '_' + path.extname(file.originalname));
	}
});

let bulkProductsStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, dir_products);
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	}
});

let offersStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, dir_offers);
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '_' + Date.now() + '_' + path.extname(file.originalname));
	}
});

let upload_company = multer({
	storage: companyStorage
});

let upload_employee = multer({
	storage: employeeStorage
});

let upload_member = multer({
	storage: memberStorage
});

let upload_products = multer({
	storage: productsStorage
});

let upload_products_bulk = multer({
	storage: bulkProductsStorage
});

let upload_offers = multer({
	storage: offersStorage
});

let upload = multer({
	storage: storage
});

let dataImport = multer({
	storage: importStorage
});


//cors(corsOpt.corsOptions),
module.exports = {

	configure: function (app) {
		
		app.get('/api/getCountryList',  function (req, res) {
			companies.getCountryList(req, res);
		});	

		app.get('/api/getStateListOnCountry/:countryid',  function (req, res) {
			companies.getStateListOnCountry(req, res);
		});	

		app.get('/api/getCityListOnState/:stateid',  function (req, res) {
			companies.getCityListOnState(req, res);
		});	

		app.post('/api/authenticateEmployee',  function (req, res) {
			users.authenticateEmployee(req, res);
		});	

		app.post('/api/setNewPassword',  function (req, res) {
			security(req, res);users.setNewPassword(req, res);
		});	

		app.post('/api/saveCompanyDetails',  upload_company.single('file'),  function (req, res) {
			security(req, res);companies.saveCompanyDetails(req, res);
		});	

		app.post('/api/deleteCompanies',  function (req, res) {
			security(req, res);companies.deleteCompanies(req, res);
		});	

		app.get('/api/getCompaniesList',  function (req, res) {
			security(req, res);companies.getCompaniesList(req, res);
		});	

		app.get('/api/getCompanyDetails/:companyid',  function (req, res) {
			security(req, res);companies.getCompanyDetails(req, res);
		});	
		
		app.get('/api/getUsersList',  function (req, res) {
			security(req, res);users.getUsersList(req, res);
		});	

		app.get('/api/getUserRoles',  function (req, res) {
			security(req, res);users.getUserRoles(req, res);
		});	

		app.get('/api/getUserDetails/:userid',  function (req, res) {
			security(req, res);users.getUserDetails(req, res);
		});	

		app.post('/api/disableEmployee',  function (req, res) {
			security(req, res);users.disableEmployee(req, res);
		});	

		app.post('/api/saveshiftAssignmentDetails',  function (req, res) {
			security(req, res);users.saveshiftAssignmentDetails(req, res);
		});	

		app.post('/api/saveUserDetails',  upload_employee.any(),  function (req, res) {
			security(req, res);users.saveUserDetails(req, res);
		});	

		app.get('/api/SignOut', function (req, res) {
			security(req, res);users.SignOut(req, res);
		});	

// WORKING SHIFT MANAGEMENT
		app.get('/api/getWorkingShiftList', function (req, res) {
			security(req, res);users.getWorkingShiftList(req, res);
		});	
		app.get('/api/getshiftDetails/:id',  function (req, res) {
			security(req, res);users.getShiftDetails(req, res);
		});	
		app.post('/api/saveShiftDetails', function (req, res) {
			security(req, res);users.saveShiftDetails(req, res);
		});	
// WORKING SHIFT MANAGEMENT

// SALARY APPRISAL MANAGEMENT
		app.get('/api/getSalaryApprisalList', function (req, res) {
			security(req, res);users.getSalaryApprisalList(req, res);
		});	
		app.get('/api/getEmployeesList', function (req, res) {
			security(req, res);users.getEmployeesList(req, res);
		});	
		app.get('/api/getSalaryApprisalDetails/:id',  function (req, res) {
			security(req, res);users.getSalaryApprisalDetails(req, res);
		});	
		app.post('/api/saveSalaryApprisalDetails', function (req, res) {
			security(req, res);users.saveSalaryApprisalDetails(req, res);
		});	
		app.post('/api/getAttendanceList', function (req, res) {
			security(req, res);users.getAttendanceList(req, res);
		});	
		app.post('/api/getAbsenceList', function (req, res) {
			security(req, res);users.getAbsenceList(req, res);
		});	
		app.post('/api/getAddress', function (req, res) {
			security(req, res);users.getAddress(req, res);
		});	
		app.post('/api/setAttendance', function (req, res) {
			security(req, res);users.setAttendance(req, res);
		});	
		app.get('/api/getAttendanceStatus', function (req, res) {
			security(req, res);users.getAttendanceStatus(req, res);
		});	
		app.post('/api/getAttendanceReport', function (req, res) {
			security(req, res);users.getAttendanceReport(req, res);
		});	
		app.post('/api/getEmployeesAttendanceList', function (req, res) {
			security(req, res);users.getEmployeesAttendanceList(req, res);
		});	
		app.get('/api/getApprisalList/:id', function (req, res) {
			security(req, res);users.getApprisalList(req, res);
		});	
// SALARY APPRISAL MANAGEMENT

// LEAVES MANAGEMENT
		app.get('/api/getLeavesList', function (req, res) {
			security(req, res);users.getLeavesList(req, res);
		});	
		app.get('/api/getleaveDetails/:id',  function (req, res) {
			security(req, res);users.getleaveDetails(req, res);
		});	
		app.delete('/api/deleteLeaveDetails/:id',  function (req, res) {
			security(req, res);users.deleteLeaveDetails(req, res);
		});	
		app.post('/api/saveLeaveDetails', function (req, res) {
			security(req, res);users.saveLeaveDetails(req, res);
		});	
// LEAVES MANAGEMENT

// LOAN REQUEST
		app.get('/api/getloanRequestList', function (req, res) {
			security(req, res);users.getloanRequestList(req, res);
		});	
		app.get('/api/getloanRequestDetails/:id',  function (req, res) {
			security(req, res);users.getloanRequestDetails(req, res);
		});	
		app.delete('/api/deleteLoanRequest/:id',  function (req, res) {
			security(req, res);users.deleteLoanRequest(req, res);
		});	
		app.post('/api/saveLoanRequest', function (req, res) {
			security(req, res);users.saveLoanRequest(req, res);
		});	
// LOAN REQUEST

// LOAN RECIEPT
		app.get('/api/getloanRecieptList', function (req, res) {
			security(req, res);users.getloanRecieptList(req, res);
		});	
		app.get('/api/getLoanApplications', function (req, res) {
			security(req, res);users.getLoanApplications(req, res);
		});	
		app.get('/api/getloanRecieptDetails/:id',  function (req, res) {
			security(req, res);users.getloanRecieptDetails(req, res);
		});	
		app.post('/api/saveLoanReciet', function (req, res) {
			security(req, res);users.saveLoanReciet(req, res);
		});	
		app.post('/api/getTotalPaidEmiAmount', function (req, res) {
			security(req, res);users.getTotalPaidEmiAmount(req, res);
		});	
// LOAN RECIEPT

// DASHBOARD
app.get('/api/getDashboardLoanData/',  function (req, res) {
	security(req, res);users.getDashboardLoanData(req, res);
});	

app.get('/api/getRestUsersList/',  function (req, res) {
	security(req, res);users.getRestUsersList(req, res);
});	
app.get('/api/getChatLog/:userid',  function (req, res) {
	security(req, res);users.getChatLog(req, res);
});	


// DASHBOARD

// CAMPAIGN

app.post('/api/saveNewsLetter/',  function (req, res) {
	security(req, res);campaign.saveNewsLetter(req, res);
});	

app.get('/api/getnewsLettersList/',  function (req, res) {
	security(req, res);campaign.getnewsLettersList(req, res);
});	

app.get('/api/getnewsLetterDetails/:id',  function (req, res) {
	security(req, res);campaign.getnewsLetterDetails(req, res);
});	

app.get('/api/getnewsLetterJsonTemplate/:id',  function (req, res) {
	security(req, res);campaign.getnewsLetterJsonTemplate(req, res);
});	

app.get('/api/getnewsLetterHtmlTemplate/:id',  function (req, res) {
	security(req, res);campaign.getnewsLetterHtmlTemplate(req, res);
});	

app.get('/api/getAdvNewsLetterHtmlTemplate/:id',  function (req, res) {
	campaign.getAdvNewsLetterHtmlTemplate(req, res);
});	


app.post('/api/saveFeedbacks/',  function (req, res) {
	campaign.saveFeedbacks(req, res);
});	

app.post('/api/shareOnMessage/',  function (req, res) {
	security(req, res);campaign.shareOnMessage(req, res);
});	

app.post('/api/shareOnEmail/',  function (req, res) {
	security(req, res);campaign.shareOnEmail(req, res);
});	


// CAMPAIGN

    }
};