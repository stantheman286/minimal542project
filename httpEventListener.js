var http=require('http');
var url  = require('url');

exports.httpEventListener = httpEventListener;

function httpEventListener(event_arg, listen_port) {
  //
  // A basic http event listener class.
  // Makes an http server that listens for commands of the form
  // ?event_arg=command_name
  // command_name is then parsed out and if it matches an event name
  // in the registered event list the associated callback is called
  //
  // event_arg: the string name of the event argument eg 'cmd' for a device
  //            or 'action' for the manager
  // listen_port: the http port that it should listen on.
  //             (binds to all addresses)
  var this_device = this;
  this.events = [];
  this.event_noun = event_arg;
  
  http.createServer(function(req,res) {
    this_device.manageHTTPRequest(req,res);
  }).listen(listen_port);
  
}
httpEventListener.prototype.manageHTTPRequest = function(request,response) {
  //called when an http request happens
  //wrapped up in such a way that 'this' still refers to a device object,
  //as it should.
  //request: http request
  //response: http response
    
  //parse request
  //TODO: figure out how to handle POST data portion of request
  //      for now nothing needs it so it has been left out.
  var req_args = url.parse(request.url,true).query;
  var eventfn = this.events[req_args[this.event_noun]];
  var event_data = null; //this is where the post data goes.
  if (typeof(eventfn) === 'function' ) {
    eventfn(event_data, response);
  } else {
    //bad request!
    response.writeHead(400, {'Content-Type': 'text/plain'});
    response.end();
  }
  
}
httpEventListener.prototype.addEventHandler = function(event_name, handler) {
  // Adds an event handler.
  // 
  this.events[event_name] = handler;
}