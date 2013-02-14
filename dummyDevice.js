//
//  Dummy device.  invoked using nodejs
//

var fs   = require('fs');
var HEL  = require('./httpEventListener.js').httpEventListener;
var OS   = require('os');
var crypto = require('crypto');

//some parameters.  they should go in a config file later:
var app_code_path = 'app.js';
var name          = 'Dummy Device';

/////////////////////////////// A basic device /////////////////////////////////
function Device(listen_port) {
  //a basic device.  Many functions are stubs and or return dummy values
  //listen_port: listen for http requests on this port
  //
  HEL.call(this,'cmd',listen_port);
  
  //Compute uuid
  var unique_str = OS.hostname()+listen_port;
  if (OS.type() == 'Linux'){
    //TODO: fill in for linux the MAC addr + listen_port
    //unique_str = mac addr + listen_port;
  } 
  //make uuid from unique string, roughly following uuid v5 spec 
  var hash = crypto.createHash('sha1').update(unique_str).digest('hex');
  this.uuid = hash.substr(0,8)+"-"+hash.substr(8,4)+"-5"+hash.substr(12,3)
              +"-b"+hash.substr(15,3)+"-"+hash.substr(18,12);
              
  //init device info
  this.port   = listen_port;
  this.status = "ready"; //other options are "logging"
  this.state  = "none"; //no other state for such a simple device

  //add apps events here
  this.addEventHandler('getCode',getAppEvent); 
  this.addEventHandler('info',this.info); 
}
Device.prototype = Object.create(HEL.prototype);
Device.prototype.constructor = Device;
Device.prototype.advertize = function() {
  //broadcast on a specified multicast address/port that you exist
  //TODO: fill in
  //TODO: add which multicast address/port should be used to the spec
}
Device.prototype.info = function(fields,response) {
  //
  // parses info request
  // fields: the html query fields
  // response: an http.ServerResponse object used to respond to the server
  //
  
  response.writeHead(200, {'Content-Type': 'text/plain'});
  
  response.end(JSON.stringify( {
    uuid   : this.uuid,
    status : this.status,
    state  : this.state,
    name   : name,
    }));
  console.log('info req');
  
}

function getAppEvent(event_data, response) {
  //gets the app code and sends it in the response body
  //response: the HTTP response
  
  //TODO: (vlp) make this an async call so we don't have to wait on IO
  var file =  fs.readFileSync(app_code_path,'utf8');
  //TODO: change content-type to javascript
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end(file);
}

///////////////////////////////////// MAIN ////////////////////////////////////
d = new Device(8080);
