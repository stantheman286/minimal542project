
var http = require('http');
var fs   = require('fs');
var url  = require('url');


///////////////////////////////// MINIMAL MANAGER //////////////////////////////
function Manager(listen_port){
  var this_device = this;
  var devices = [];  //a list of known devices
  
  http.createServer(function(req,res) {
    this_device.manageHTTPRequest(req,res);
  }).listen(listen_port);
}
Manager.prototype.manageHTTPRequest = function(request,response) {
  
  
}