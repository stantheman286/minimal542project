//
//  Dummy device.  invoked using nodejs
//

var http = require('http');
var fs   = require('fs');
var url  = require('url');

//some parameters.  they should go in a config file later:
var app_code_path = 'app.js';


/////////////////////////////// A basic device /////////////////////////////////
function Device(listen_port) {
  //a basic device.  Many functions are stubs and or return dummy values
  //listen_port: listen for http requests on this port
  var this_device = this;
  this.events = [];
  
  http.createServer(function(req,res) {
    this_device.manageHTTPRequest(req,res);
  }).listen(listen_port);

  this.addEventHandler('getCode',getAppEvent); 
}
Device.prototype.advertize = function() {
  //broadcast on a specified multicast address/port that you exist
  //TODO: fill in
  //TODO: add which multicast address/port should be used to the spec
}
Device.prototype.manageHTTPRequest = function(request,response) {
  //called when an http request happens
  //wrapped up in such a way that 'this' still refers to a device object,
  //as it should.
  //request: http request
  //response: http response
    
  //parse request
  //TODO: figure out how to handle POST data portion of request
  //      for now nothing needs it so it has been left out.
  var req_args = url.parse(request.url,true).query;
  var eventfn = this.events[req_args.cmd](response);
  var event_data = null; //this is where the post data goes.
  if (typeof(eventfn) === 'function' ) {
    eventfn(event_data, response);
  } else {
    //bad request!
    response.writeHead(400, {'Content-Type': 'text/plain'});
    response.end();
  }
  
}
Device.prototype.addEventHandler = function(event_name, handler) {
  // Adds an event handler.
  // 
  this.events[event_name] = handler;
}

function getAppEvent(event_data, response) {
  //gets the app code and sends it in the response body
  //response: the HTTP response
  
  //TODO: (vlp) make this an async call so we don't have to wait on IO
  var file =  fs.readFileSync(app_code_path,'utf8');
  //TODO: change content-type to javascript
  response.writeHead(200, {'Content-Type': 'text/plain'});
  console.log(file);
  response.end(file);
}

///////////////////////////////////// MAIN ////////////////////////////////////
d = new Device(8080);
d.init();