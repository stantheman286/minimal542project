var mysql = require('mysql');
var http  = require('http');
var HEL   = require('./httpEventListener.js').httpEventListener;
var fs    = require('fs');
var url   = require('url');

//parameters
var table_name = 'manager';
var dash_HTML  = './dash.html';

///////////////////////////////// MINIMAL MANAGER //////////////////////////////
function Manager(listen_port){
  HEL.call(this,'action',listen_port);
  this.port = listen_port;
  this.devices = {};  //a hash table of known devices keyed by uuid
   
  //read dbconfig from an external file that is not part of the code repository
  var dbconfigTEXT = fs.readFileSync('./dbconfig.JSON','utf8');
  var dbconfig = JSON.parse(dbconfigTEXT);
  this.dbconn = mysql.createConnection(dbconfig);
  this.dbconn.connect();
  
  this.addEventHandler('store',this.storeData);
  this.addEventHandler('retrieve',this.getData);
  this.addEventHandler('list',this.getDevList);
  this.addEventHandler('forward',this.forward);
  
  //add the dummy device for now
  //TODO: delete this and implement the discovery protocol
  this.queryDeviceInfo('127.0.0.1',8080);
}
Manager.prototype = Object.create(HEL.prototype);
Manager.prototype.constructor = Manager;
Manager.prototype.addDevice = function(device) {
  //
  //Add a device to the known devices list.
  //
  var d = new Date();
  device.last_seen = d.getTime()/1000.0;
  
  this.devices[device.uuid.toLowerCase()] = device;
}
Manager.prototype.storeData = function(fields, response) {
  //
  // Event handler for store
  // fields: the query fields and post data
  // response: the http.ServerResponse object.
  //
  var dbconnection = this.dbconn;
  this.checkDBTable(table_name,function(e){
    if (fields.post_data) {
      var pd = dbconnection.escape(fields.post_data);
    }
    if(e) { //db error
      response.writeHead(503, {'Content-Type': 'text/plain'});
      response.end('database error: ' + e);
    } else if (!fields.uuid) {
      response.writeHead(400, {'Content-Type': 'text/plain'});
      response.end('missing device uuid');
    } else if (fields.post_data.length>1024){
      response.writeHead(413, {'Content-Type': 'text/plain'});
      response.end('post data too large try storeBIG action');
    } else {
      //TODO: update last seen
      var uuid = dbconnection.escape(fields.uuid);
      d = new Date();
      dbconnection.query("INSERT INTO " + table_name +
                        "(epoch,uuid,data) VALUES" +
                        "(" + d.getTime() + ", "+uuid +
                        ", " + pd + ");",function(e,r){
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('wrote '+fields.post_data.length+' bytes.');
      });
    }
  });
}
Manager.prototype.checkDBTable = function(tbl_name,callback) {
  //
  // Checks to make sure tabe tbl_name exists
  // if it does not it gets created
  // tbl_name: the table to check for
  // callback: function to be called when complete
  //           callback(error)
  //           error: the error string retuned by mysql or null if success
  //
  
  this.dbconn.query("SHOW TABLES LIKE '"+tbl_name+"';", function(e,r) {
    if (!e && r.length < 1){
      makeTable();
    } else {
      //queue up callbackfn
      setTimeout(callback(e),0);
    }
  });
  
  function makeTable(){
    this.dbconn.query('CREATE TABLE '+tbl_name+' (' +
                       'id INT NOT NULL AUTO_INCREMENT, ' +
                       'epoch BIGINT NOT NULL, ' + 
                       'uuid CHAR(36) NOT NULL, ' +
                       'data VARCHAR(1024), ' +
                       'PRIMARY KEY (id) ' +
                      ');',function(e,r){
      setTimeout(callback(e),0);
    });
  };
}
Manager.prototype.getData = function(fields,response){
  //
  //Event handler for ?action=retrieve.
  // fields: the query fields
  // response: the http.ServerResponse object.
  //
  if (!fields.uuid) {
    response.writeHead(400, {'Content-Type': 'text/plain'});
    response.end('missing device uuid');
  } else {
    //TODO: handle the since argument
    this.dbconn.query("SELECT data FROM " + table_name + " Where uuid LIKE " +
                      this.dbconn.escape(fields.uuid) + " ORDER BY id;",
                      function(e,r) {
      if(e) {
        response.writeHead(503, {'Content-Type': 'text/plain'});
        response.end('database error: ' + e);
      } else {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        for (var i = 0; i<r.length; i++){
          response.write(r[i].data + "\n");
        }
        response.end();
      }
    });
  }
}
Manager.prototype.queryDeviceInfo = function(ip,port){
  //
  //querys a device for more information
  // ip: the devices ip or host name
  // port: the tcp port to send http requests too.
  //
  var this_manager = this;
  var options = {
    host   : ip,
    port   : port,
    path   : '/?cmd=info',
    method : 'GET',
  };
  
  //TODO: this can trigger an exception if the device is gone
  //TODO: hande the exception
  http.request(options, function(res){
    var resp = '';
    var dev_info = null;
    if (res.statusCode == 200) {
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        //console.log('getting chunk');
        resp += chunk;
      });
      res.on('end',function(){
        //TODO: represent as xml
        dev_info = JSON.parse(resp);
        dev_info.ip = ip;
        dev_info.port = port;
        this_manager.addDevice(dev_info );
      });
    }
  }).end();
  
}
Manager.prototype.getDevList = function(fields,response) {
  //
  // Event handler for ?action=getCode
  // fields: the query fields 
  // response: the http.ServerResponse object.
  //
  
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end(JSON.stringify(this.devices));
}
Manager.prototype.forward = function(fields,response) {
  if (!fields.uuid) {  
    response.writeHead(400, {'Content-Type': 'text/plain'});
    response.end('missing device uuid');
  } else if (!this.devices[fields.uuid]) {
    response.writeHead(400, {'Content-Type': 'text/plain'});
    response.end('unknown device uuid');
  } else {
    
    var options = {
      host: this.devices[fields.uuid].addr,
      port: this.devices[fields.uuid].port,
      path: url.format({query: fields,pathname: '/'}),
      method: 'GET',
    };
    var app_code = '';
    http.request(options, function(res) {
      if (res.statusCode == 200) {
        console.dir(res);
        res.setEncoding('utf8');
        res.on('data', function(chunk){
          //console.log('getting chunk');
          app_code += chunk;
        });
        res.on('end',function(){
          response.writeHead(200, {'Content-Type': res.headers['content-type']});
          response.end(app_code);
        });
      } else {
        response.writeHead(503, {'Content-Type': 'text/plain'});
        response.end("device error");
      }
    }).end();
  }
}
//////////////////////////////STARTUP CODE/////////////////////////////////////

m=new Manager(9090);

