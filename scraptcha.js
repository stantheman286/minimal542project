//
//  Scraptcha device.  invoked using nodejs
//

var http = require('http');
var fs   = require('fs');
var HEL  = require('./httpEventListener.js').HttpEventListener;
var OS   = require('os');
var crypto = require('crypto');
var dgram = require('dgram');
var scraptcha = require('../c/build/Release/myScraptcha');

// Constants
var LOW = 0;
var HIGH = 1;

var LSBFIRST = 0;
var MSBFIRST = 1;

var GPIO_OUTPUT = 0;
var GPIO_INPUT = 1;

var ANODE0 = 25;
var ANODE1 = 24;
var ANODE2 = 23;

var CLOCK_PIN = 22
var LATCH_PIN = 21
var DATA_PIN = 17

var LED0_RED = 0xFE;
var LED0_GRN = 0xFD;
var LED1_RED = 0xFB;
var LED1_GRN = 0xF7;
var LED2_RED = 0xEF;
var LED2_GRN = 0xDF;
var LED3_RED = 0xBF;
var LED3_GRN = 0x7F;

var RED = 0;
var GREEN = 1;

var TRASH = 0;
var RECYCLING = 1;
var COMPOST = 2;

var CAPTURE = 0;
var LIVE = 1;

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
  this.addEventHandler('auto_capture',this.auto_capture); 
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

  // Set up options for POST request
  var options = {
    hostname: this.manager_IP,
    port: this.manager_port,
    path: '/?action=storeBig&uuid=' + this.uuid,
    method: 'POST'
  };

  // Create request
  var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });

    // If from POST request, wait to finish before completing
    if (response) {
      // Send status and header information
      response.writeHead(res.statusCode, res.headers);
      response.end();
    }

  });

  // Report any errors
  req.on('error', function(e) {
    console.log('Problem with request: ' + e.message);
  });
  
  var filename = 'image.jpg';

//ms: testing  // Generate a random number to pick a file
//ms: testing  var rand = Math.floor((Math.random()*8)+1);
//ms: testing
//ms: testing  // Read data from file
//ms: testing  var filename;
//ms: testing
//ms: testing  switch(rand)
//ms: testing  {
//ms: testing    case 1: filename = './images/apple.jpg'; break;
//ms: testing    case 2: filename = './images/orange.jpg'; break;
//ms: testing    case 3: filename = './images/watermelon.jpg'; break;
//ms: testing    case 4: filename = './images/banana.jpg'; break;
//ms: testing    case 5: filename = './images/tomato.jpg'; break;
//ms: testing    case 6: filename = './images/strawberry.jpg'; break;
//ms: testing    case 7: filename = './images/durian.jpg'; break;
//ms: testing    case 8: filename = './images/rambutan.jpg'; break;
//ms: testing    default: filename = './images/apple.jpg'; break;
//ms: testing  }

  scraptcha.takePicture(filename, CAPTURE);
  console.log('Snapping picture...');

  // Open specified file
  var myData = fs.readFileSync(filename);

  // Write data to request body
  req.write(myData);
  req.end();

}

// Setup auto-capture settings
Device.prototype.auto_capture = function(fields,response) {
  
  var this_device = this;

  // Turn on auto-capture 
  if (fields.auto === 'on') {

    // Clear any existing timers
    if(typeof(timer) !== 'undefined') {
      clearInterval(timer);
    }
    // Set up timer to read temperature at given sample rate
    timer = setInterval(function() {
     
      // Take a picture
      this_device.getPicture();
      
    }, (fields.sample_rate * 1000)); // Rate in ms

  }
  // Turn off auto-capture
  else {

    // Clear any existing timers
    if(typeof(timer) !== 'undefined') {
      clearInterval(timer);
    }

  }
  
  response.end(); 
}

///////////////////////////////////// MAIN ////////////////////////////////////
//if i'm being called from command line
if(require.main === module) {
  var d1 = new Device(1234);

//  setTimeout(function(){
//    var d2 = new Device(8081);
//  },1000);
}

