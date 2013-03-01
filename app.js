/*jshint browser:true devel:true*/
/*global AbstractApp */

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Sub Class /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
var timer;

function MyApp(divobj,uuid,dash){
  this.myuuid = uuid;
  if (!divobj) {
    throw "First argument must be a valid html object";
  }
  this.div = divobj;
  this.dash = dash;
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
