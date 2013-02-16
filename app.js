function GenericApp(divobject,uuid,parent){
  // A generic app.  does very little.  start should probably be
  // completely overwritten if inheriting from this.
  // divobject: the div tag into which the App can put UI elements.
  // uuid: The UUID of the device associated with this app
  // parent: the dashboard that launched it
  this.myuuid = uuid;
  if (!divobject) {
    throw "First argument must be a valid html object";
  }
  this.div = divobject;
  this.dash = parent;
}

GenericApp.prototype.start = function(){
  //
  //Starts app and loads gui.
  //builds gui proceedurally
  //

  //set some attributes for the app div
  this.div.style.cssText = "background-color:#BFB";
  
  var this_app = this;
  this.getUIhtml(function(e,h){
    this_app.div.innerHTML = h;
    this_app.getAllElements();
    this_app.send_button.addEventListener('click',function(){
      var q = {};
      q.xxxxxxx = "y&"+this_app.query_field.value; //lazy
      this_app.sendEvent(this_app.event_field.value,
                         q,function(err,resp){
        //TODO: handle event response
        this_app.dash.dbg(resp);
      });
    });
  });
}
GenericApp.prototype.sendEvent = function(type,args,cb){
  // NOTE: THIS IS NOT PART OF THE FORMAL SPEC BECAUSE DASH DOES NOT NEED TO  
  //       KNOW ABOUT IT.  HOWEVER IT IS STRONGLY RECOMENDED THAT THIS BE 
  //       IMPLEMENTED TO KEEP YOUR CODE CLEAN.  THINK OF THIS AS A PRIVATE 
  //       METHOD.
  // Send an event to the manager, which then sends it to the device.
  // type: string that the device understands.
  // args: arguements to be added to url query string
  //      may either be an object formatted as 
  //      {f1: val1, f2: val2 ...}
  //      that will get parsed into ?f1=val1&f2=val2 ...
  //      or a string formatted as a query eg "?f1=val1&f2=val2" 
  //
  // cb: callback function
  //     function(err,resp_str)
  //     err: an error message and status code as string
  //     resp_str: the manager's response as a string.
  
  //TODO: fill in 
  
  args.action = type;
  //build up url
  var path = '/?';
  var once = true;
  for (f in args) {
    path += f + "=" + args[f] +"&";
  }
  path = path.substring(0,path.length-1); //remove last &
  var http = new XMLHttpRequest();
  http.open("GET",path,false);
  http.onreadystatechange=function(){
    if (http.readyState==4 ) {
      if (http.status == 200) {
        cb('', http.responseText);
      } else{
        cb('Error: '+http.status,http.responseText);
      }
    }
  }
  http.send();
  
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
GenericApp.prototype.getAllElements = function(){
  this.event_field = this.getElement("event_field");
  this.query_field = this.getElement("query_field");
  this.send_button = this.getElement("send_button");
}

GenericApp.prototype.getUIhtml = function(cb) {
  //
  //Ask manager for html and make tag names unique.
  //  cb: call back function function (error,uniquifiedHTML){...}
  //      uniquifiedHTML: the uniquified html fro app's ui.
  //      e: error.  '' for no error.  see sendEvent.
  //
  var this_uuid = this.myuuid;
  
  this.sendEvent('forward',{cmd:'getHTML',uuid:this.myuuid},function(e,r){
    var uhtml = r.replace(/(<[^>]+id\=\")/ig,"$1"+"id"+this_uuid);
    cb(e,uhtml);
  })
  
  //return html;
}
GenericApp.prototype.getElement = function(originalID) {
  //
  //similar to getElementById but fixes the ids to comply with whatever
  //  originalID: the tag ID as written in the original html code.
  //
  return document.getElementById("id" + this.myuuid + originalID);
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
