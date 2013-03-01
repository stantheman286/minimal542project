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
AbstractApp.prototype.setInterval = function(interval){
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
    if (http.readyState==4 ) {
      if (http.status == 200) {
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
  return document.getElementById("id" + this.myuuid + originalID);
};

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Sub Class /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
var timer;

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
  "use strict";
  //
  //Starts app and loads gui.
  //

  //set some attributes for the app div
  this.div.style.backgroundColor = "#666666";
  
  // Define variables
  var this_app = this;
  var this_uuid = this.myuuid;
  var auto;
  var sample_rate;
  var refresh_rate;

  this.getUIhtml(function(e,h){
    this_app.div.innerHTML = h;
    this_app.getAllElements();

    // Initial app refresh
    this_app.update();

    // Auto-capture
    this_app.auto_set.addEventListener('click',function(){
  
      // Obtain the auto-capture settings from app 
      if (this_app.auto_on.checked) {
        auto = 'on';
      } else {
        auto = 'off';
      }
      
      sample_rate = this_app.sample_rate.value;

      // Set default rate if out of range 
      if (sample_rate < '1' || sample_rate > '9') {
        sample_rate = '1';
      }
      
      // Tell device to take a picture
      this_app.sendEvent('forward', {cmd: 'auto_capture', uuid: this_uuid, auto: auto, sample_rate: this_app.sample_rate.value}, function(e, r) {
        if (e) {
          console.log('App error (Auto-capture): ' + e);
        } else {}
      });

    });

    // Take a picture and update when 'Take Picture' clicked
    this_app.take_picture_button.addEventListener('click',function(){

      // Tell device to take a picture
      this_app.sendEvent('forward', {cmd:'getPicture', uuid:this_uuid}, function(e, r) {
        if (e) {
          console.log('App error (Take picture): ' + e);
        } else {
          this_app.update();
        }
      });

    });

    // Update when 'Refresh' clicked
    this_app.refresh_button.addEventListener('click', function() {
      this_app.update();
    });

    // Auto-refresh app every 10 seconds
    timer = setInterval(function(){
      this_app.update();
    },10000);

     // Change interval when 'Set' clicked
    this_app.refresh_set_button.addEventListener('click', function() {
    
      // Clear any existing timers
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }

      refresh_rate = this_app.refresh_rate.value;

      // Set default rate if out of range 
      if (refresh_rate < '1' || refresh_rate > '10') {
        refresh_rate = '1';
      }

      timer = setInterval(function() {
        this_app.update();
      }, refresh_rate*1000);  // ms
    });

  });

};

MyApp.prototype.update = function(){
  "use strict";

  var this_app = this;
  var this_uuid = this.myuuid;
  
  // Set epoch to past 10 minutes to reduce data intake
  var d = new Date();
  var since = d.getTime() - (10*60*1000);

  // Get the info for the latest image and then post it to the app
  this_app.sendEvent('listBig', {since: since, uuid: this_uuid}, function(e, r) {
    if (e) {
      console.log('App error (Update): ' + e);
    } else {
      var info = JSON.parse(r);

      // Display up to the last 6 images and guesses in app
      for(var i = 0; i < 6; i++) {
        if (info[i]) {
          this_app.picture[i].src = '/?action=retrieveBig&id=' + info[info.length-(i+1)].id; // Oldest first order, start from end
          this_app.guess[i].innerHTML= (JSON.parse(info[info.length-(i+1)].meta)).guess;
        }
      }
    }
  });
};

////////////////////////////////// Some "Private" Methods //////////////////////
MyApp.prototype.getAllElements = function(){
  "use strict";
  
  // Auto-capture
  this.auto_on = this.getElement("auto_on");
  this.auto_off = this.getElement("auto_off");
  this.sample_rate = this.getElement("sample_rate");
  this.auto_set = this.getElement("auto_set");

  // Auto-refresh
  this.refresh_rate = this.getElement("refresh_rate");
  this.refresh_set_button = this.getElement("refresh_set_button");
  
  // Take picture
  this.take_picture_button = this.getElement("take_picture_button");
  this.refresh_button = this.getElement("refresh_button");

  // Picture and guess modules
  this.picture = new Array();
  this.guess = new Array();
  for (var i = 0; i < 6; i++) {
    this.picture[i] = this.getElement("picture" + i);
    this.guess[i] = this.getElement("guess" + i);
  }
};

//spec says app needs to be named App
var App = MyApp;
