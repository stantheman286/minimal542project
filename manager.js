var mysql = require('mysql');
var HEL  = require('./httpEventListener.js').httpEventListener;

///////////////////////////////// MINIMAL MANAGER //////////////////////////////
function Manager(listen_port){
  HEL.call(this,'action',listen_port);
  this.port = listen_port;
  this.devices = {};  //a hash table of known devices keyed by uuid
   
  this.dbconn = mysql.createConnection({
    host        : 'vergil.u.washington.edu',
    port        : 3141,
    user        : 'chris',
    database    : 'ee542',
    password    : 'raspberry',
  });
  this.dbconn.connect();
  
  this.addEventHandler('store',this.storeData);
  //add the dummy device for now
  //TODO: delete this and implement the discovery protocol
  this.addDevice('45db4d90-724b-11e2-bcfd-0800200c9a66','127.0.0.1',8080);
}
Manager.prototype = Object.create(HEL.prototype);
Manager.prototype.constructor = Manager;
Manager.prototype.addDevice = function(uuid, ip4addr, http_port) {
  //
  //Add a device to the known devices list.
  //
  var d = new Date();
  this.devices[uuid.toLowerCase()] = { addr      : ip4addr,
                                       port      : http_port,
                                       last_seen : d.getTime()/1000.0,
  };
  
}
Manager.prototype.storeData = function(fields, response) {
  //
  // Event handler for store
  // fields: the query fields and post data
  // response: the http.ServerResponse object.
  //
  
  //TODO: replace with actual code.
  console.log(fields.post_data);
  response.end('thanks!');
}

m=new Manager(9090);

