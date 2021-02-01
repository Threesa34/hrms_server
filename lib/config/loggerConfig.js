var winston = require('winston');
require('winston-daily-rotate-file');
var path = require('path');


const level = 'info'

const currentDate = new Date(),
  dd = currentDate.getDate() < 10 ? '0' + String(currentDate.getDate()) : currentDate.getDate(),
  mm = (currentDate.getMonth() +1) < 10 ? '0' + String(currentDate.getMonth() + 1) : parseInt(currentDate.getMonth()) + 1,
  yyyy = currentDate.getFullYear(),
  hh = currentDate.getHours() < 10 ? '0' + String(currentDate.getHours()) : currentDate.getHours();

var exceptionlogfile = path.join(__dirname, 'logs', './log/Exception_' + dd + '_' + mm + '_' + yyyy + '_' + hh + '.log');

var error = new (winston.transports.DailyRotateFile)({
  filename: './logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '50m',
  maxFiles: '100d',
 level:'error'
});

var info = new (winston.transports.DailyRotateFile)({
  filename:'./logs/info-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '50m',
  maxFiles: '100d',
  level:'info'
});


const logger = winston.createLogger({
  level: level,
  format: winston.format.json(),
  transports: [

    // - Write to all logs with level `info` and below to Systme 
    // - Write all logs error (and below) to Error.
    info,
    error

  ],

  // - Write all logs error (and below) to Exception like uncouthException

 /*  exceptionHandlers: [
    new winston.transports.File({
      filename: exceptionlogfile
    })
  ], */
  exitOnError: false
});




// If we're not in production then log to the `console` with the format:



logger.stream = {
  write: function (message, encoding) {
    // use the 'info' log level so the output will be picked up by both transpssorts (file and console)
    logger.info(message+'- - Time: '+new Date());
  },
};

module.exports = logger;
