//
//  Dummy device.  invoked using nodejs
//

var fs   = require('fs');
var HEL  = require('./httpEventListener.js').httpEventListener;

//some parameters.  they should go in a config file later:
var app_code_path = 'app.js';

/////////////////////////////// A basic device /////////////////////////////////
function Device(listen_port) {
  //a basic device.  Many functions are stubs and or return dummy values
  //listen_port: listen for http requests on this port
  HEL.call(this,'cmd',listen_port);

  //add apps events here
  this.addEventHandler('getCode',getAppEvent); 
}
Device.prototype = Object.create(HEL.prototype);
Device.prototype.constructor = Device;
Device.prototype.advertize = function() {
  //broadcast on a specified multicast address/port that you exist
  //TODO: fill in
  //TODO: add which multicast address/port should be used to the spec
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
