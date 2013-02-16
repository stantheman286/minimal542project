function GenericApp(divobject,uuid,parrent){
  // A generic app.  does very little.  start should probably be
  // completely overwritten if inheriting from this.
  // divobject: the div tag into which the App can put UI elements.
  // uuid: The UUID of the device associated with this app
  // parent: the dashboard that launched it
  this.myuuid = uuid;
  if (divobject===undefined) {
    throw "First argument must be a valid html object";
  }
  this.div = divobject;
}

GenericApp.prototype.start = function(){
  //
  //builds gui proceedurally
  //
  var field1 = document.createElement("div");
  var field2 = document.createElement("div");
  var type_input = document.createElement("input");
  var data_input = document.createElement("input");
  var abutton = document.createElement("button");
  var result_div = document.createElement("div");
  this.div.style.cssText = "background-color:#BFB";
  this.div.innerHTML = "";
  field1.innerHTML = "Event type: ";
  field1.appendChild(type_input);
  field2.innerHTML = "Data:";
  field2.appendChild(data_input);

  abutton.innerHTML = "Send";
 
  var that=this;
  abutton.addEventListener('click',function() {
    that.sendEvent(type_input.value,data_input.value);
  });
  
  this.div.appendChild(field1);
  this.div.appendChild(field2);
  this.div.appendChild(abutton);
  this.div.appendChild(result_div);
  //debug code
  this.sendEvent('list',{foo:'bar'},function(e,r){
    console.log("e" +e);
    console.log("r" +r);
  })
  
}
GenericApp.prototype.sendEvent = function(type,args,cb){
  // NOTE: THIS IS NOT PART OF THE FORMAL SPEC BECAUSE DASH DOES NOT NEED TO  
  //       KNOW ABOUT IT.  HOWEVER IT IS STRONGLY RECOMENDED THAT THIS BE 
  //       IMPLEMENTED TO KEEP YOUR CODE CLEAN.  THINK OF THIS AS A PRIVATE 
  //       METHOD.
  // Send an event to the manager, which then sends it to the device.
  // type: string that the device understands.
  // args: arguements to be added to url query string formatted as 
  //      {f1: val1, f2: val2 ...}
  //      that get parsed into ?f1=val1&f2=val2 ...
  //
  // cb: callback function
  //     function(err,resp_str)
  //     err: '' if no error otherwise a maybe helful string about the error
  //     resp_str: the manager's response as a string.
  
  //TODO: fill in 
  console.log("Event type: " + type + "\nData: " + args);
  
  //add action to args list
  args.action = type;
  //build up url
  /*
  var options = {
    hostname: parent.manager_hostname,
    port: parent.manager_port,
    path: url.format({query: args,pathname: '/'}),
    method: 'GET',
  };
  var res_body = '';
  http.request(options, function(res) {
    if (res.statusCode == 200) {
      console.dir(res);
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        //console.log('getting chunk');
        res_body += chunk;
      });
      res.on('end',function(){
        cb('',res_body);
      });
    } else {
      cb('error' + res.statusCode,'');
    }
  }).end();  */
  //TODO: replace the above with AJAX http.open call
  
}
GenericApp.prototype.update = function() {
  //
  //update whatever needs to be updated in this app
  //
  
  //nothing to do for generic app.
}
GenericApp.prototype.stop = function() {
  //
  //Stops all timers, close connections etc 
  //
  
  //nothing to be done for generic app.
  clearInterval(this.update_interval_id);
}
GenericApp.prototype.setInterval = function(interval){
  //
  // Sets the update intervnal in ms for the app.
  // interval: the interval in ms.  if interval = 0, never autoupdates.
  // 
  var that = this;
  if (interval>0) {
    this.update_interval_id = setInterval(function(){
      that.update();
    },interval);
  }
  
}

GenericApp.prototype.getUIhtml = function() {
  //
  //Ask manager for html and make tag names unique.
  //return the uniqueified HTML
  
  return html;
}
GenericApp.prototype.getElement = function() {
  //
  //similar to getElementById but fixes the ids to comply with whatever
  //
}
////////////////////////////////////SUB CLASS///////////////////////////////////

function DummyApp(divobj,parrent) {
  GenericApp.call(this,divobj,parrent);
}
DummyApp.prototype = Object.create(GenericApp.prototype);
DummyApp.prototype.constructor = DummyApp;
DummyApp.prototype.start = function() {
  var getDataButton = document.createElement("button");
    
  GenericApp.prototype.start.call(this);
  this.colors = ['#FBB','#BFB','#BBF'];
  this.colorIndex = 1;
  getDataButton.innerHTML = "getData";
  var that = this;
  getDataButton.addEventListener('click', function(){
    
  });
  this.div.appendChild(getDataButton);
}

var App = GenericApp;
