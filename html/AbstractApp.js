/*jshint browser:true devel:true*/
function AbstractApp(divobject,uuid,parent){
  "use strict";
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
  "use strict";
  //
  //Starts app and loads gui.
  //

  console.log("App.start() is unimplemented!");
};
AbstractApp.prototype.update = function() {
  "use strict";
  //
  //update whatever needs to be updated in this app
  //
  
  console.log("App.update() is unimplemented!"); 
};
AbstractApp.prototype.stop = function() {
  "use strict";
  //
  //Stops all timers, close connections etc 
  //
  
  //nothing to be done for Abstract app.
  clearInterval(this.update_interval_id);
};
AbstractApp.prototype.setUpdateInterval = function(interval){
  "use strict";
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
  
};

//////////////////////////////// "Protected" Methods ///////////////////////////
//Nothing below here is in the specification
AbstractApp.prototype.sendEvent = function(type,args,cb){
  "use strict";
  // Send an event to the manager
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
  
  args.action = type;
  //build up url
  var path = '/?';
  var f = null;
  for (f in args) {
    path += f + "=" + args[f] +"&";
  }
  path = path.substring(0,path.length-1); //remove last &
  var http = new XMLHttpRequest();
  http.open("GET",path,false);
  http.onreadystatechange=function(){
    if (parseInt(http.readyState,10) === 4 ) {
      if (parseInt(http.status,10) === 200) {
        cb('', http.responseText);
      } else{
        cb('Error: '+http.status,http.responseText);
      }
    }
  };
  http.send();
  
};
AbstractApp.prototype.getUIhtml = function(cb) {
  "use strict";
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
  });
};
AbstractApp.prototype.getElement = function(originalID) {
  "use strict";
  //
  //similar to getElementById but fixes the ids to comply with whatever
  //  originalID: the tag ID as written in the original html code.
  //
  return document.getElementById(this.getElementIDstr(originalID));
};
AbstractApp.prototype.getElementIDstr = function(originalID){
  //
  //returns the actual element ID from the originalID
  //  originalID: the tag ID as written in the original html code.
  //
  // This may be useful when using other libraries like javascript
  // e.g.
  // if you have app.html with the following
  // <div id="mydiv"> ...</div>
  // then you might write the following in app.js
  // var mydiv = jQuery("#"+this.getElementIDstr("mydiv"));
  //
  
  return "id" + this.myuuid + originalID;
};

window.AbstractApp = AbstractApp;