var mysql = require('mysql');
var HEL  = require('./httpEventListener.js').httpEventListener;

//parameters
var table_name = 'manager';

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
    this.dbconn.query('CREATE TABLE '+tbl_name+' (\
                       id INT NOT NULL AUTO_INCREMENT,\
                       epoch BIGINT NOT NULL,\
                       uuid CHAR(36) NOT NULL,\
                       data VARCHAR(1024),\
                       PRIMARY KEY (id)\
                      );',function(e,r){
      setTimeout(callback(e),0);
    });
  };
}

m=new Manager(9090);

