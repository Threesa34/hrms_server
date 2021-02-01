var path = require('path'),
fs = require('fs'),
moment = require('moment');;

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

module.exports = function (socketio) {


  socketio.on('connection', function(client) {
    console.log('connec user');

    client.on('new-message', (message) => {
      console.log(message);
      message.time = formatAMPM(new Date());
      message.date = moment(new Date()).format("YYYY-MM-DD")

      var filename = './chat-logs/chat-log_'+message.sender+'_'+message.reciever+'_'+new Date().toDateString().replace(/ /g,"_")+'.txt';
      
      fs.exists(filename, function (exists) {
          if(exists)
          {
            fs.appendFile(filename, '*-/n*'+JSON.stringify(message), (err) => { 
              if (err) 
                console.log(err); 
              else { 
                console.log("File written successfully\n"); 
                console.log("The written has the following contents:"); 
              } 
            });
          }
          else
          {
            fs.appendFile(filename, JSON.stringify(message), (err) => { 
              if (err) 
                console.log(err); 
              else { 
                console.log("File written successfully\n"); 
                console.log("The written has the following contents:"); 
              } 
            });
          }
      });

      /*   */
      socketio.emit(message)
    });

    client.on('disconnect', function() {
    console.log("disconnected")
    });
    });
  


     
};