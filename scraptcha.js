//
//  Scraptcha device.  invoked using nodejs
//

var http = require('http');
var fs   = require('fs');
var HEL  = require('./httpEventListener.js').HttpEventListener;
var OS   = require('os');
var crypto = require('crypto');
var dgram = require('dgram');

//some parameters.  they should go in a config file later:
var app_code_path  = 'app.js';
var html_code_path = 'app.html';
var name           = 'Scraptcha';
var keystr = "obqQm3gtDFZdaYlENpIYiKzl+/qARDQRmiWbYhDW9wreM/APut73nnxCBJ8a7PwW";

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
  this.addEventHandler('getPicture',this.getPicture); 
  this.addEventHandler('getCode',getCodeEvent); 
  this.addEventHandler('getHTML',getHTMLEvent); 
  this.addEventHandler('info',this.info);
  this.addEventHandler('ping',this.info);
  this.addEventHandler('acquire',this.acquire);
  
  //advertise that i'm here every 10 seconds until i'm aquired
  var this_device = this;
  this.advert_timer = setInterval(function(){
    this_device.advertise('224.250.67.238',17768);
  },10000) ;
}
Device.prototype = Object.create(HEL.prototype);
Device.prototype.constructor = Device;
Device.prototype.advertise = function(mcastAddr,mport) {
  //broadcast on a specified multicast address/port that you exist
  // mcastAddr: the multicast address
  // mport: the port to listen on.
  var p = "00000" + this.port;
  p = p.substr(p.length-5); //zero pad up to 5 chars
  
  var udpsock = dgram.createSocket('udp4');
  udpsock.bind();
  udpsock.setMulticastTTL(10);
  
  var message = new Buffer(keystr+p);
  udpsock.send(message,0,message.length,mport,mcastAddr,
               function(err,bytes){
    udpsock.close();
  });
};
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
  
};
Device.prototype.acquire = function(fields,response) {
  //
  // set this as acquired
  // fields: the html query fields
  // response: an http.ServerResponse object used to respond to the server
  //
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end();
  this.manager_port = parseInt(fields.port,10);
  this.manager_IP  = fields['@ip'] ;
  clearInterval(this.advert_timer);

//  this.getPicture();  //ms: test, wait until acquired
};
function getCodeEvent(event_data, response) {
  //gets the app code and sends it in the response body
  //response: the HTTP response
  
  fs.readFile(app_code_path,'utf8',function(err,file) {
    if (!err) {
      response.writeHead(200, {'Content-Type': 'text/javascript'});
      response.end(file);
    } else {
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.end('cannot read file \n' + err);
    }
  });
}
function getHTMLEvent(event_data, response) {
  //gets the app code and sends it in the response body
  //response: the HTTP response
  
  fs.readFile(html_code_path,'utf8',function(err,file) {
    if (!err) {
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end(file);
    } else {
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.end('cannot read file \n' + err);
    }
  });
}
Device.prototype.getPicture = function(fields,response) {

  var options = {
    hostname: this.manager_IP,
    port: this.manager_port,
    path: '/?action=storeBig&uuid=' + this.uuid,
    method: 'POST'
  };

  var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });

    // Wait to finish POST then complete
    response.writeHead(res.statusCode, res.headers);
    response.end();

  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  

  // Generate a random number to pick a file
  var rand = Math.floor((Math.random()*5)+1);

  // Read data from file
  var filename;

  switch(rand)
  {
    case 1: filename = './images/apple.jpg'; break;
    case 2: filename = './images/orange.jpg'; break;
    case 3: filename = './images/watermelon.jpg'; break;
    case 4: filename = './images/banana.jpg'; break;
    case 5: filename = './images/tomato.jpg'; break;
    default: filename = './images/apple.jpg'; break;
  }

  // Open specified file
  var myData = fs.readFileSync(filename);

  // Write data to request body
  req.write(myData);
  req.end();

}

///////////////////////////////////// MAIN ////////////////////////////////////
//if i'm being called from command line
if(require.main === module) {
  var d1 = new Device(1337);

//  setTimeout(function(){
//    var d2 = new Device(8081);
//  },1000);
}

