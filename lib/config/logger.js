const logger = require('./loggerConfig');

exports.writeLogs = function (details,loglvl) {

    var logtme = new Date();
    
    if (loglvl == 'info'){
        logger.info(logtme+'['+details.path+']-'+JSON.stringify(details.message));
    }
    if (loglvl == 'error') {
        logger.error(logtme+'['+details.path+']-'+JSON.stringify(details.message));
    }
    else {
        logger.info(logtme+'['+details.path+']-'+JSON.stringify(details.message));
     }
};