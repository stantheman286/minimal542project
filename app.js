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

  this.getUIhtml(function(e,h){
    this_app.div.innerHTML = h;
    this_app.getAllElements();

    // Start LCD and clear displays
    this_app.sendEvent('forward', {cmd:'startup', uuid:this_uuid}, function(e, r) {
      if (e) {
        console.log('App error (Take picture): ' + e);
      }
    });

    // Initial app refresh
    this_app.update();

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

  });

};

MyApp.prototype.update = function(){
  "use strict";

  var this_app = this;
  var this_uuid = this.myuuid;
  
  // Set epoch to past 60 minutes to reduce data intake
  var d = new Date();
  var since = d.getTime() - (60*60*1000);

  // Get the info for the latest image and then post it to the app
  this_app.sendEvent('listBig', {since: since, uuid: this_uuid}, function(e, r) {
    if (e) {
      console.log('App error (Update): ' + e);
    } else {
      var info = JSON.parse(r);

      // Display up to the last 4 images and guesses in app
      for(var i = 0; i < 4; i++) {
        if (info[i]) {
          this_app.picture[i].src = '/?action=retrieveBig&id=' + info[info.length-(i+1)].id; // Oldest first order, start from end
          if (i == 0) this_app.guess[i].innerHTML= 'I think this is ' + (JSON.parse(info[info.length-(i+1)].meta)).guess + '.';
          else this_app.guess[i].innerHTML= (JSON.parse(info[info.length-(i+1)].meta)).guess;
        }
      }
    }
  });
};

////////////////////////////////// Some "Private" Methods //////////////////////
MyApp.prototype.getAllElements = function(){
  "use strict";
  
  // Take picture
  this.take_picture_button = this.getElement("take_picture_button");
  this.refresh_button = this.getElement("refresh_button");

  // Picture and guess modules
  this.picture = new Array();
  this.guess = new Array();
  for (var i = 0; i < 4; i++) {
    this.picture[i] = this.getElement("picture" + i);
    this.guess[i] = this.getElement("guess" + i);
  }
};

//spec says app needs to be named App
var App = MyApp;
