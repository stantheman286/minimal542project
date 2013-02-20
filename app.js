function AbstractApp(divobject,uuid,parent){
  //
  // An abstract app.  While not technically an abstract class it does very
  // little.  At least the following should be overridden:
  //    start()
  //    update()
  // The following methods may be left alone if only basic functionality
  // is needed
  //    setInterval()
  //    stop()
  //    
  //
  //
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

AbstractApp.prototype.start = function(){
  //
  //Starts app and loads gui.
  //

  console.log("App.start() is unimplemented!");
}
AbstractApp.prototype.update = function() {
  //
  //update whatever needs to be updated in this app
  //
  
  console.log("App.update() is unimplemented!"); 
}
AbstractApp.prototype.stop = function() {
  //
  //Stops all timers, close connections etc 
  //
  
  //nothing to be done for Abstract app.
  clearInterval(this.update_interval_id);
}
AbstractApp.prototype.setInterval = function(interval){
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

//////////////////////////////// "Protected" Methods ///////////////////////////
//Nothing below here is in the specification
AbstractApp.prototype.sendEvent = function(type,args,cb){
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
AbstractApp.prototype.getUIhtml = function(cb) {
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
}
AbstractApp.prototype.getElement = function(originalID) {
  //
  //similar to getElementById but fixes the ids to comply with whatever
  //  originalID: the tag ID as written in the original html code.
  //
  return document.getElementById("id" + this.myuuid + originalID);
}

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Sub Class /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function MyApp(divobj,uuid,parent){
  this.myuuid = uuid;
  if (!divobj) {
    throw "First argument must be a valid html object";
  }
  this.div = divobj;
  this.dash = parent;
}
MyApp.prototype = Object.create(AbstractApp.prototype);

//overwrite start and update
MyApp.prototype.start = function() {
  //
  //Starts app and loads gui.
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
        this_app.dash.dbg(resp);
      });
    });   
  });
};
// This app has nothing to do on update
MyApp.prototype.update = function(){};

////////////////////////////////// Some "Private" Methods //////////////////////
MyApp.prototype.getAllElements = function(){
  this.event_field = this.getElement("event_field");
  this.query_field = this.getElement("query_field");
  this.send_button = this.getElement("send_button");
}

//spec says app needs to be named App
var App = MyApp;
