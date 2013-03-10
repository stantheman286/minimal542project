/*jshint node:true*/
var mysql = require('mysql');
var http  = require('http');
var HEL   = require('./httpEventListener.js').HttpEventListener;
var fs    = require('fs');
var url   = require('url');
var dgram = require('dgram');


//parameters
var data_table_name = 'manager';
var big_table_name = 'managerBig';
var devices_table_name = "devices";
var dash_HTML  = './dash.html';
var ping_interval = 30;
var keystr = "obqQm3gtDFZdaYlENpIYiKzl+/qARDQRmiWbYhDW9wreM/APut73nnxCBJ8a7PwW";
var __DEBUG_LEVEL__ = 15;

///////////////////////////////////// MANAGER //////////////////////////////////
function Manager(listen_port){
  "use strict";
  HEL.call(this,'action',listen_port,true);
  this.port = listen_port;
  this.devices = {};  //a hash table of known devices keyed by uuid
  this.insert_seq = 0;
   
  //read dbconfig from an external file that is not part of the code repository
  var dbconfigTEXT = fs.readFileSync('./dbconfig.JSON','utf8');
  var dbconfig = JSON.parse(dbconfigTEXT);
  this.dbconn = mysql.createConnection(dbconfig);
  this.dbconn.connect();
  
  this.addEventHandler('store',this.storeData);
  this.addEventHandler('storeBig',this.storeData);
  this.addEventHandler('retrieve',this.getData);
  this.addEventHandler('retrieveBig',this.retrieveBig);
  this.addEventHandler('listBig',this.getData);
  this.addEventHandler('list',this.getDevList);
  this.addEventHandler('forward',this.forward);
  this.addEventHandler('ping',this.ping);
  this.addEventHandler('addDevice',this.remoteAddDev);
  this.addEventHandler('whoami',this.whoami);
  
  this.loadDevicelistDB();
  this.setupMulticastListener('224.250.67.238',17768);
  
  //periodically check for dead devices
  var this_manager = this;
  this.dead_check_timer = setInterval(function(){
    this_manager.deviceKeepAlive();
  },1000*ping_interval);
}
Manager.prototype = Object.create(HEL.prototype);
Manager.prototype.constructor = Manager;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// Action Handlers /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
Manager.prototype.storeData = function(fields, response) {
  "use strict";
  //
  // Event handler for store and storeBig
  // fields: the query fields and post data
  // response: the http.ServerResponse object.
  //
  var dbconnection = this.dbconn;
  this.insert_seq = (this.insert_seq + 1)%1000;
  var insert_seq = this.insert_seq;
  var table_name;
  var big = false;
  
  if (fields.action === "storeBig") {
    table_name = big_table_name;
    big = true;
  } else {
    table_name = data_table_name;
    big = false;
  }
  this.checkDBTable(table_name,function(e){
    var pd, d, uuid;
    if (fields['@post_data']) {
      pd = dbconnection.escape(fields['@post_data']);
    }
    if(e) { //db error
      response.writeHead(503, {'Content-Type': 'text/plain'});
      response.end('database error: ' + e);
    } else if (!fields.uuid) {
      response.writeHead(400, {'Content-Type': 'text/plain'});
      response.end('missing device uuid');
    } else if (fields['@post_data'].length>1024 && !big){
      response.writeHead(413, {'Content-Type': 'text/plain'});
      response.end('post data too large try storeBIG action');
    } else {
      //TODO: update last seen
      uuid = dbconnection.escape(fields.uuid);
      d = new Date();
      //note: insert_seq is appended to the getTime() value to uniqueify it
      //a collision will only happen if there are >1000 inserts per milisecond.
      if (big) {
        dbconnection.query("INSERT INTO " + big_table_name +
                          "(epoch,uuid,meta,bigdata) VALUES (" +
                          String(d.getTime()*1000 + insert_seq) +
                          ", " + uuid +
                          ", " + dbconnection.escape(fields.meta) +
                          ", " + (pd?pd:"null") +
                          ");",function(e,r){
          response.writeHead(200, {'Content-Type': 'text/plain'});
          response.write("db response: " + r);
          response.write("\ndb error: " + e);
          response.end('\nwrote big'+fields['@post_data'].length+' bytes.');
        });        
      } else {
        dbconnection.query("INSERT INTO " + data_table_name +
                          "(epoch,uuid,data) VALUES (" +
                          String(d.getTime()*1000 + insert_seq) +
                          ", " + uuid + 
                          ", " + (pd?pd:"null") +
                          ");",function(e,r){
          response.writeHead(200, {'Content-Type': 'text/plain'});
          response.end('wrote '+fields['@post_data'].length+' bytes.');
        });
      }
    }
  });
};
Manager.prototype.getData = function(fields,response){
  "use strict";
  //
  //Event handler for ?action=retrieve and ?action=listBig
  // fields: the query fields
  // response: the http.ServerResponse object.
  //
  var since = parseInt(fields.since,10);
  var q,order;
  var timeArg = '';
  var big = (fields.action === "listBig");
  
  if (!fields.uuid) {
    response.writeHead(400, {'Content-Type': 'text/plain'});
    response.end('missing device uuid');
  } else {
    //construct the query
    if( since ){
      timeArg = " AND epoch > " + (since*1000+999)+" ";
    }
    if (fields.since === "latest") {
      order = " ORDER BY epoch DESC LIMIT 1;"; //most recent
    } else {
      order = " ORDER BY epoch ASC;";
    }
    if (big) {
      q = "SELECT epoch,meta FROM " + big_table_name + " WHERE uuid LIKE " +
            this.dbconn.escape(fields.uuid) + timeArg + order;
    } else { // action === retrieve
      q = "SELECT data FROM " + data_table_name + " WHERE uuid LIKE " +
            this.dbconn.escape(fields.uuid) + timeArg + order;
    }
    console.log("query: "+q);
    this.dbconn.query(q, function(e,r) {
      if(e) {
        response.writeHead(503, {'Content-Type': 'text/plain'});
        response.end('database error: ' + e);
      } else {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        if (!big){
          for (var i = 0; i<r.length; i++){
            response.write(r[i].data + "\n");
          }
        } else {
          response.write(JSON.stringify(r.map(function(x){
            var y = {};
            y.id = x.epoch;
            y.meta = x.meta;
            return y;
          })));
        }
        response.end();
      }
    });
  }
};
Manager.prototype.retrieveBig = function(fields,response) {
  "use strict";
  //
  //Event handler for ?action=retrieveBig
  // fields: the query fields
  // response: the http.ServerResponse object.
  //
  var q;
  //construct the query
  
  var id = parseInt(fields.id,10);
  
  q = "SELECT bigdata FROM " + big_table_name + " WHERE epoch = " +
      String(id) + ";";
  
  console.log("query: "+q);
  this.dbconn.query(q, function(e,r) {
    if(e) {
      response.writeHead(503, {'Content-Type': 'text/plain'});
      response.end('database error: ' + e);
    } else {
      response.writeHead(200);//, {'Content-Type': 'text/plain'});
      response.end(r[0].bigdata);
    }
  });
  
};
Manager.prototype.getDevList = function(fields,response) {
  "use strict";
  //
  // Event handler for ?action=getCode
  // fields: the query fields 
  // response: the http.ServerResponse object.
  //
  
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end(JSON.stringify(this.devices));
};
Manager.prototype.ping = function(fields,response) {
  "use strict";
  //
  // Event handler for ?action=ping
  // just returns 200ok with no body
  // fields: the query fields 
  // response: the http.ServerResponse object.
  //
  
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end();
};
Manager.prototype.remoteAddDev = function(fields,response) {
  "use strict";
  //
  // Event handler for ?action=addDevice
  // attempts to add the device described by addr and ip.
  // returns 200 ok with no body
  // fields: the query fields 
  // response: the http.ServerResponse object.
  //
  var port = parseInt(fields.port,10);
  
  if(fields.addr && port){
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end();
    this.queryDeviceInfo(fields.addr,port);
  } else {
    response.writeHead(503, {'Content-Type': 'text/plain'});
    response.end('error: no addr or port');
  }
  
};
Manager.prototype.forward = function(fields,response) {
  "use strict";
  var this_manager = this;
  if (!fields.uuid) {  
    response.writeHead(400, {'Content-Type': 'text/plain'});
    response.end('missing device uuid');
  } else if (!this.devices[fields.uuid]) {
    response.writeHead(400, {'Content-Type': 'text/plain'});
    response.end('unknown device uuid');
  } else {
    
    var options = {
      host: this.devices[fields.uuid].ip,
      port: this.devices[fields.uuid].port,
      path: url.format({query: fields,pathname: '/'}),
      method: 'GET',
    };
    if(fields['@post_data']) {
      options.method = 'POST';
    }
    var app_code = '';
    var fwd_req = http.request(options, function(res) {
      if (res.statusCode == 200) {
        res.setEncoding('utf8');
        res.on('data', function(chunk){
          app_code += chunk;
        });
        res.on('end',function(){
          response.writeHead(200,{'Content-Type': res.headers['content-type']});
          response.end(app_code);
        });
      } else {
        response.writeHead(503, {'Content-Type': 'text/plain'});
        response.end("device error");
      }
    });
    fwd_req.on("error",function(e){
      dbg("device unreachable: "+e,1);
      this_manager.forgetDevice(fields.uuid);
    });
    
    if(fields['@post_data']) {
      fwd_req.end(fields['@post_data']);
    } else {
      fwd_req.end();
    }
    
  }
};
Manager.prototype.whoami = function(fields,response){
  "use strict";
  //
  // Event handler for ?action=whoami
  // just returns 200ok with the currently authenticated username in body
  // fields: the query fields 
  // response: the http.ServerResponse object.
  //
  
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end(fields['@user']);  
};

////////////////////////////////////////////////////////////////////////////////
///////////////////////////// Device Methods ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
Manager.prototype.addDevice = function(device) {
  "use strict";
  //
  //Add a device to the known devices list.
  //
  var d = new Date();
  device.last_seen = d.getTime()/1000.0;
  
  console.log("adding dev:");
  console.dir(device);
  this.devices[device.uuid.toLowerCase()] = device;
  this.updateDevlistDB();
};
Manager.prototype.queryDeviceInfo = function(ip,port){
  "use strict";
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
  
  var inforeq = http.request(options, function(res){
    var resp = '';
    var dev_info = null;
    if (res.statusCode == 200) {
      res.setEncoding('utf8');
      res.on('data', function(chunk){
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
  });
  inforeq.on("error",function(e){
    //something wen't wrong, likely device unreachable
    dbg("cannot add client. " +e,5);
  });
  inforeq.end();
  
  
  options = {
    host   : ip,
    port   : port,
    path   : '/?cmd=acquire&port=' + this.port,
    method : 'GET',
  };
  var acqreq = http.request(options,function(res){
    if(res.statusCode==200) {
      //good do nothing.
    } else {
      //TODO: decide what to do with the error.
    }
  });
  acqreq.on("error",function(e){
    //something wen't wrong, likely device unreachable
    dbg("cannot acquire client. " +e,5);
  });
  acqreq.end();
  
};
Manager.prototype.checkDBTable = function(tbl_name,callback) {
  "use strict";
  //
  // Checks to make sure tabe tbl_name exists
  // if it does not it gets created
  // tbl_name: the table to check for
  // callback: function to be called when complete
  //           callback(error)
  //           error: the error string retuned by mysql or null if success
  //
  var this_manager = this;
  var q = ''; //the query string
  if  ((tbl_name !== data_table_name) && (tbl_name !== big_table_name)) {
    callback("ERROR: table unknown");
  }
  
  this.dbconn.query("SHOW TABLES LIKE '"+tbl_name+"';", function(e,r) {
    if (!e && r.length < 1 ){
      q = 'CREATE TABLE '+ tbl_name +' (' +
          'epoch BIGINT UNSIGNED NOT NULL, ' + 
          'uuid CHAR(36) NOT NULL, ' +
          ((tbl_name === data_table_name) ? ' data ' : ' meta ') +
          'VARCHAR(1024), ' +
          ((tbl_name === data_table_name) ? '' : ' bigdata MEDIUMBLOB, '  ) +
          'PRIMARY KEY (epoch), ' +
          'INDEX (uuid)' +');';
      console.log("ADDING TABLE: \n" + q);
      this_manager.dbconn.query(q,function(e,r){
        setTimeout(callback(e),0);
      });
        
    } else {
      //queue up callbackfn
      setTimeout(callback(e),0);
    }
  });
  
};
Manager.prototype.setupMulticastListener = function(mcastAddr,port){
  "use strict";
  //
  // Sets up a UDP multicast listener to listen for new devices
  // mcastAddr: the multicast address
  // port: the port to listen on.
  //
  var this_manager = this;
  var udpsock = dgram.createSocket('udp4', function (message, remote){
    var m = message.toString();
    var port = NaN;
    var remoteIP = remote.address;
    if (m.substr(0,64) === keystr) {
      port = parseInt(m.substr(64,5),10);
      this_manager.queryDeviceInfo(remoteIP,port);
    }
  });
  udpsock.bind(port);
  udpsock.addMembership(mcastAddr);
};
Manager.prototype.updateDevlistDB = function(){
  "use_strict";
  var q;
  var this_manager = this;
  var temp;
  
  checkdevDBTable(function(e){
    if(!e) {
      //insert/update the device list
      for(var uuid in this_manager.devices) {
        temp = this_manager.devices[uuid];
        q = "REPLACE INTO " + devices_table_name + " VALUES (" +
            "'" + temp.uuid +"', " +
            "'" + temp.status +"', " +
            "'" + temp.state +"', " +
            "'" + temp.name +"', " +
            "'" + temp.ip +"', " +
            temp.port +", " +
            temp.last_seen +
             ");";
        this_manager.dbconn.query(q,function(e,r){
          if (e) {
            dbg("db error 3 - "+e,1);
            dbg("query was:" + q, 10);
          }
        });
      }
    }
  });
  
  function checkdevDBTable(cb) {
    //if the table does not exist create it
    this_manager.dbconn.query("SHOW TABLES LIKE '"+ devices_table_name + "' ;",
                      function(e,r){
      if(!e && r.length<1 ) {
        dbg('creating device table',10);
        q = 'CREATE TABLE ' + devices_table_name + ' (' +
            'uuid CHAR(36) NOT NULL, ' +
            'status CHAR(50), ' +
            'state VARCHAR(1024), ' +
            'name VARCHAR(50), ' +
            'ip VARCHAR(253), ' +
            'port INT UNSIGNED, ' +
            'last_seen DOUBLE, ' +
            'PRIMARY KEY (uuid) ' +
            ');';
          this_manager.dbconn.query(q, function(err,resp){
            cb(e);
          });
      } else if(e){
        dbg('db error 1- updateDevlistDB:' + e,1);
      } 
      cb(e);
    });
  }
};
Manager.prototype.loadDevicelistDB = function(){
  "use strict";
  var this_manager = this;
  this.dbconn.query("SELECT * FROM " + devices_table_name + ";", function(e,r){
    if(e) {
      dbg('db error loadDevicelistDB: '+e,1);
    } else {
      //this_manager.devices = {};
      dbg("loading device list from DB...", 10);
      for (var i = 0; i<r.length; i++){
        this_manager.devices[r[i].uuid] = r[i];
      }
    }
  });
}
Manager.prototype.forgetDevice = function(uuid){
  delete this.devices[uuid];
  var q = "DELETE FROM " + devices_table_name + " WHERE uuid LIKE '" +
          uuid + "';"
  this.dbconn.query(q, function(e,r){
    dbg('deleted device.',5);
    dbg('query:'+q,10);
  });
};
Manager.prototype.deviceKeepAlive = function(){
  "use strict";
  //
  // Checks to see if a device is still there.  If it is, updates last seen.
  // If the device is not there, it will remove the device from the dev list.
  // and active device table in the DB.
  //
  var this_manager = this;
  var pingdev = function(uuid){ return function(head,data){
    if(head) {
      this_manager.devices[uuid].last_seen = (new Date()).getTime()/1000.0;
    } else {
      this_manager.forgetDevice(uuid);
    }
  };};
  for (var uuid in this.devices) {
    this.sendCMD(uuid,'ping',{},pingdev(uuid));    
  }
}
Manager.prototype.sendCMD = function(uuid, command_name, fields,callback){
  //
  // Sends a command to the device
  // uuid: String.  the device's uuid
  // command_name: string. the command to send
  // fields: object. a hash of query options. may be null or {}
  // callback: function(header,data).  
  //       header: http.ClientResponse - the device's response or null if error
  //       data: 'string' - the response body.
  //
  var this_manager = this;
  if (!fields) {
    fields = {};
  }
  fields.cmd = command_name;
  
  var options = {
    host   : this.devices[uuid].ip,
    port   : this.devices[uuid].port,
    path: url.format({query: fields,pathname: '/'}),
    method : 'GET'
  };
  
  var inforeq = http.request(options, function(res){
    var resp = '';
    var dev_info = null;
    if (res.statusCode == 200) {
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        resp += chunk;
      });
      res.on('end',function(){
        callback(res,resp);
      });
    }
  });
  inforeq.on("error",function(e){
    //something wen't wrong, likely device unreachable
    dbg("cannot send command. " +e,5);
    callback(null,e);
  });
  inforeq.end();
  dbg("sending command: " +options.path,10);
};
//console debug code:
function dbg(message, level){
  //
  // prints debug message to console.
  // message: a string with debug message
  // level: the level
  //        1) errors only
  //        5) warnings
  //        10) debug
  //
  var lvlmsg = "debug ";
  if(!level){
    level = 10;
  }
  if (level<=5) {
    lvlmsg = "warning ";
  }
  if (level<=1) {
    lvlmsg = "error ";
  }
  if (__DEBUG_LEVEL__>= level) {
    
    console.log(lvlmsg + ": " + message);
  }
}

//////////////////////////////STARTUP CODE/////////////////////////////////////
//if i'm being called from command line
if(require.main === module) {
  var m=new Manager(9090);
}

