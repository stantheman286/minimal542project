var http=require('http');
var url  = require('url');

exports.httpEventListener = httpEventListener;

function httpEventListener(event_field_name, listen_port) {
  //
  // A basic http event listener class.
  // Makes an http server that listens for commands of the form
  // ?event_arg=command_name
  // command_name is then parsed out and if it matches an event name
  // in the registered event list the associated callback is called
  //
  // To add an event see addEventHandler
  //
  // event_arg: the string name of the event argument eg 'cmd' for a device
  //            or 'action' for the manager
  // listen_port: the http port that it should listen on.
  //             (binds to all addresses)
  var this_device = this;
  this.events = [];
  this.event_field_name = event_field_name;
  
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
  var post_data = '';
  var req_args = url.parse(request.url,true).query;
  var eventfn = this.events[req_args[this.event_field_name]];
  
  var handle_resp = function(){
    req_args.post_data = post_data;
    if (typeof(eventfn) === 'function' ) {
      eventfn(req_args, response);
    } else {
      //bad request!
      response.writeHead(400, {'Content-Type': 'text/plain'});
      response.end();
    }
  }
  
  if (request.method == 'POST') {
    request.on('data',function(d){
      post_data += d;
    });
    request.on('end', handle_resp);
  } else {
    handle_resp();
  }
  
  
}
httpEventListener.prototype.addEventHandler = function(command_name, handler) {
  // Adds an event handler.
  //
  // command_name: a string for the given event name
  // handler: a function that handles the event
  //          That function should have the prototype: function(data, response)
  //          data: Object with properties for each argument passed in the url
  //                data has a special property 'post_data' which contains
  //                the post data, if any, from the http POST request.  
  //          response: the http response object used to respond to the request
  // 
  this.events[command_name] = handler;
}