//
//  Scraptcha device.  invoked using nodejs
//

//NODE libraries
var fs     = require('fs');
var OS     = require('os');
var crypto = require('crypto');
var dgram  = require('dgram');
var http   = require('http');
var url    = require('url');
//My libraries
var HEL       = require('./httpEventListener.js').HttpEventListener;
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

var CLOCK_PIN = 22;
var LATCH_PIN = 21;
var DATA_PIN = 17;

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

var timer = null;

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
  
  //init device info
  this.port   = listen_port;
  this.status = "ready"; //other options are "logging"
  this.state  = "none"; //no other state for such a simple device
  this.uuid = this.computeUUID();
  
  //some device state
  this.logging_timer = null;
  this.manager_port = null;
  this.manager_IP = null;

  //standard events
  this.addEventHandler('getCode',this.getCodeEvent); 
  this.addEventHandler('getHTML',this.getHTMLEvent); 
  this.addEventHandler('info',this.info);
  this.addEventHandler('ping',this.info);
  this.addEventHandler('acquire',this.acquire);
  
  //implementation specific events
  this.addEventHandler('auto_capture',this.auto_capture); 
  this.addEventHandler('getPicture',this.getPicture); 
  
  //manually attach to manager.
  this.manager_IP = '192.168.1.20';
//  this.manager_IP = 'bioturk.ee.washington.edu';
  this.manager_port = 9090;
  this.my_IP = OS.networkInterfaces().wlan0[0].address;
  this.sendAction('addDevice',
                  {port: listen_port, addr: this.my_IP},
                  function(){});
  
  //advertise that i'm here every 10 seconds until i'm aquired
  /*var this_device = this;
  this.advert_timer = setInterval(function(){
    this_device.advertise('224.250.67.238',17768);
  },10000);*/
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
////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////EVENTS////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
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
    name   : name
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
};
Device.prototype.getCodeEvent = function(event_data, response) {
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
};
Device.prototype.getHTMLEvent = function(event_data, response) {
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
};

////////////////////IMPLEMENTATION SPECIFIC COMMANDS////////////////////////////
Device.prototype.getPicture = function(fields,response) {
  "use strict";

  // Declare variables
  var myData;
  var filename  = 'image.jpg';
  var guess     = 'TRASH';
  var delay;
  var meta;
  var options;
  var req;

//ms: testing  // Generate a random number to pick a file and guess
//ms: testing  var rand1 = Math.floor((Math.random()*8)+1);
//ms: testing  var rand2 = Math.floor((Math.random()*3));
//ms: testing
//ms: testing  switch(rand1)
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

  
  console.log('Snapping picture and guessing...');
  scraptcha.takePicture(filename, CAPTURE);
  switch(scraptcha.detectScrap(filename))
  {
    case TRASH:     guess = 'TRASH'; break;
    case RECYCLING: guess = 'RECYCLING'; break;
    case COMPOST:   guess = 'COMPOST'; break;
    default: guess = 'TRASH'; break;
  }

  // Set LED delay
  delay = 500;

  // Prepare IO on the Pi
  scraptcha.setup_io();

  // Enable LED bar and reset values
  scraptcha.ledBarEnable();

  // Set LEDs
  if (guess === 'TRASH') {
    scraptcha.ledBlockSet(ANODE1, GREEN, delay);
  } else {
    scraptcha.ledBlockSet(ANODE1, RED, delay);
  }

  // Create meta information
  meta = JSON.stringify({
    guess: guess
  });
  console.log('GUESS: ' + guess);

  // Open specified file
  myData = fs.readFileSync(filename);

  // Set up options for POST request
  options = {
    hostname: this.manager_IP,
    port: this.manager_port,
    path: '/?action=storeBig&uuid=' + this.uuid + '&meta=' + meta,
    method: 'POST'
  };

  // Create request
  req = http.request(options, function(res) {
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
  
  // Write data to request body
  req.write(myData);
  req.end();

};

// Setup auto-capture settings
Device.prototype.auto_capture = function(fields,response) {
  "use strict"

  var this_device = this;

  // Turn on auto-capture 
  if (fields.auto === 'on') {

    // Clear any existing timers
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
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
    clearInterval(timer);
    timer = null;

  }
  
  response.end(); 
};
///////////////////////////////HELPER METHODS///////////////////////////////////
Device.prototype.getTemp = function() {
  //
  // Gets the temp from rpi.  Note this is blocking since the underlying
  // call to ioctl is blocking.
  // returns: the temp in deg C
  //
  var adcread = ((result[1]<<2) | (result[2]>>>6))*3.3/1024;
  var resistance = 3.3*10000/adcread - 10000;
  
  var a = 0.00113902;
  var b = 0.000232276;
  var c = 9.67879E-8;
  var lr = Math.log(resistance);
  var temp = -273.15+1/(a+b*lr+c*lr*lr*lr);

  return temp;  
};
Device.prototype.sendAction = function(action,fields,callback) {
  //
  // sends action to manager.
  // action: string - the action to send to manager
  // fields: object - a hash of fields to send to in the request
  // callback: called when done takes responce data as argument
  //
  
  //TODO: response_data sholud probably be a buffer incase of binary data
  var response_data = '';
  fields.action = action;
  var options = {
    hostname: this.manager_IP,
    port: this.manager_port,
    path: url.format({query:fields, pathname:'/'}),
    method: "GET"
  };
  console.log(options.path);
  var actionReq = http.request(options,function(result){
    result.on('data', function(chunk){
      response_data += chunk;
    });
    result.on('end',function(){
      callback(response_data);
    });
  });
  actionReq.end();
};
Device.prototype.computeUUID = function(){
  //
  // Computes the Device's UUID from a combination of listen port and hostname
  //
  var unique_str = OS.hostname()+this.port;
  if (OS.type() === 'Linux'){
    //TODO: fill in for linux the MAC addr + listen_port
    //unique_str = mac addr + listen_port;
  } 
  //make uuid from unique string, roughly following uuid v5 spec 
  var hash = crypto.createHash('sha1').update(unique_str).digest('hex');
  return uuid = hash.substr(0,8)+"-"+hash.substr(8,4)+"-5"+hash.substr(12,3) +
              "-b"+hash.substr(15,3)+"-"+hash.substr(18,12);  
};

///////////////////////////////////// MAIN /////////////////////////////////////
//if i'm being called from command line
if(require.main === module) {
  var d1 = new Device(4843);
}

