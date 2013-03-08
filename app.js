/*jshint browser:true devel:true*/
/*global AbstractApp */

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Sub Class /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Global variables
var timer;
var image_store = new String();
var idx = -1;

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

    // Generate style information

    // IDs (make anonymous)
    var styles = '#id' + this_uuid + 'container { background-color: #C2D1E3; height: 380px }\n';
    styles += '#id' + this_uuid + 'overall_align { position: relative; width: 280px; height: 380px }\n';
    styles += '#id' + this_uuid + 'tab_container { position: absolute; top: 0px; left: -103px; right: 0px }\n';
    styles += '#id' + this_uuid + 'picture_guess_container { position: absolute; bottom: 10px; top: 40px; text-align: center; background-color: #5B84B4 }\n';
    styles += '#id' + this_uuid + 'guess_gaming_table { padding: 2px; spacing: 5px; width: 280px }\n';
    styles += '#id' + this_uuid + 'prev_guess { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold; height: 32px }\n';
    styles += '#id' + this_uuid + 'choice_question { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold; }\n';
    
    // Classes (not anonymous)
    styles += '.spacer_small { height: 5px }\n';
    styles += '.spacer_big { height: 10px }\n';
    styles += '.prev_pic_container { text-align: center }\n';
    styles += '.choice_container { text-align: left; font-family: verdana; font-size: 14px; color: #FFFFFF; font-weight: bold }\n';
    styles += '.prev_pic { vertical-align: middle; width: 50% }\n';
    styles += '.guess { text-align: center; font-family: verdana; font-size: 10px; color: #FFFFFF }\n';
    styles += '.buttons { background-color: #38577C; font-family: verdana; font-size: 10px; color: #FFFFFF; font-weight: bold }\n';
    styles += '.big_pic { vertical-align: middle; width:80% }\n';
    styles += '.big_guess { font-family: verdana; font-size: 16px; color:#FFFFFF; font-weight: bold }\n';
    styles += '.small_guess { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold }\n';

    // Tab-related
    styles += 'ul#id' + this_uuid + 'tabs { list-style-type: none; }\n';
    styles += 'ul#id' + this_uuid + 'tabs li { display: inline }\n';
    styles += 'ul#id' + this_uuid + 'tabs li a { padding: 7px; background-color: #C2D1E3; font-family: verdana; font-size: 14px; color: #38577C; font-weight: bold; text-decoration: none; }\n';
    styles += 'ul#id' + this_uuid + 'tabs li a:hover { background-color: #000066; color: #FFFFFF }\n';
    styles += 'ul#id' + this_uuid + 'tabs li a.selected { background-color: #5B84B4; font-family: verdana; font-size: 14px; color: #FFFFFF; font-weight: bold; }\n';
    styles += 'div.tabContent { }\n';
    styles += 'div.tabContent.hide { display: none; }\n';

    // Set style tag in HTML
    this_app.appendStyle(styles);

    // Set up correct tab references
    this_app.capture_tab.href = '#id' + this_uuid + 'capture';
    this_app.gaming_tab.href = '#id' + this_uuid + 'gaming';
    this_app.about_tab.href = '#id' + this_uuid + 'about';

    // Initialize the tabs
    this_app.initTabs();

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

    // Get a new picture if user clicks the skip button
    this_app.submit_answer_button.addEventListener('click', function() {
      // TODO: delete old image, add new verified image
      idx++;  // Go to next image
      this_app.getRandomUnverifiedPic();
    });

    // Get a new picture if user clicks the skip button
    this_app.skip_button.addEventListener('click', function() {
      idx++;  // Skip to next image
      this_app.getRandomUnverifiedPic();
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
      for(var i = 0; i < 4; i++) {  // TODO flip this loop around?
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
  // Generate 5 entries; 4 for capture mode, 1 for gaming mode
  for (var i = 0; i < 5; i++) {
    this.picture[i] = this.getElement("picture" + i);
    this.guess[i] = this.getElement("guess" + i);
  }

  // Tabs
  this.capture_tab = this.getElement("capture_tab");
  this.gaming_tab = this.getElement("gaming_tab");
  this.about_tab = this.getElement("about_tab");

  // Gaming
  this.skip_button = this.getElement("skip_button");
  this.submit_answer_button = this.getElement("submit_answer_button");

};

MyApp.prototype.initTabs = function() {

  var this_app = this;
  var this_uuid = this.myuuid;

  // Grab the tab links and content divs from the page
  var tabListItems = this_app.getElement("tabs").childNodes;
  var tabLinks = new Array();
  var contentDivs = new Array();

  for ( var i = 0; i < tabListItems.length; i++ ) {
    if ( tabListItems[i].nodeName == "LI" ) {
      var tabLink = this_app.getFirstChildWithTagName( tabListItems[i], 'A' );
      var id = this_app.getHash( tabLink.getAttribute('href') );
      tabLinks[id] = tabLink;
      contentDivs[id] = document.getElementById(id);  // Don't use helper function
    }
  }

  // Assign onclick events to the tab links, and
  // highlight the first tab
  var i = 0;

  for ( var id in tabLinks ) {

    // Show the correct tab when clicked
    tabLinks[id].onclick = function() { 
   
      var selectedId = this_app.getHash( this.getAttribute('href') );

      // TODO clean up
      if (selectedId === 'id' + this_uuid + 'gaming') {
        this_app.getRandomUnverifiedPic();
      }

      // Highlight the selected tab, and dim all others.
      // Also show the selected content div, and hide all others.
      for ( var id in contentDivs ) {
        if ( id == selectedId ) {
          tabLinks[id].className = 'selected';
          contentDivs[id].className = 'tabContent';
        } else {
          tabLinks[id].className = '';
          contentDivs[id].className = 'tabContent hide';
        }
      }

      // Stop the browser following the link
      return false;

    };

    tabLinks[id].onfocus = function() { this.blur() };
    if ( i == 0 ) {
      tabLinks[id].className = 'selected';
    }
    i++;
  }

  // Hide all content divs except the first
  var i = 0;

  for ( var id in contentDivs ) {
    if ( i != 0 ) {
      contentDivs[id].className = 'tabContent hide';
    }
    i++;
  }
}

MyApp.prototype.getFirstChildWithTagName = function(element, tagName) {
  for ( var i = 0; i < element.childNodes.length; i++ ) {
    if ( element.childNodes[i].nodeName == tagName ) return element.childNodes[i];
  }
}

MyApp.prototype.getHash = function(url) {
  var hashPos = url.lastIndexOf ( '#' );
  return url.substring( hashPos + 1 );
}

MyApp.prototype.appendStyle = function(styles) {
  var css = document.createElement('style');
  css.type = 'text/css';

  if (css.styleSheet) css.styleSheet.cssText = styles;
  else css.appendChild(document.createTextNode(styles));

  document.getElementsByTagName("head")[0].appendChild(css);
}

MyApp.prototype.getRandomUnverifiedPic = function() {

  var this_app = this;
  var this_uuid = this.myuuid;
  
  // Set epoch to past 60 minutes to reduce data intake
  var d = new Date();
  var since = d.getTime() - (60*60*1000);

  // Set flag to show haven't found a picture yet
  var done = new Boolean();
  done = false;

  // Go through a chunk of images at a time until find a match or run out
//  while (!done) {

  // TODO: randomize?
 
  console.log('image_store.length: ' + image_store.length);
  console.log('idx: ' + idx);

  // No image chunk stored or out of images, get a new chunk
  if (image_store.length === 0) {
    
    // Grab a chunk of images
    this_app.sendEvent('listBig', {since: since, uuid: this_uuid}, function(e, r) {
      if (e) {
        console.log('App error (start): ' + e);
      } else {
        // Store an image chunk and set the index
        image_store = JSON.parse(r);
        idx = 0;
      }
    });    
  
  } 
  
  // Images left, go through them
  // TODO: once run out of image chunk, get more (and not same ones over and over)
  if (idx < image_store.length) {
  
    // Run through all the images in the chunk (oldest first)
    for(; idx < (image_store.length - 4); idx++) { // Skip the latest 4 to prevent deleting images from capture screen

      // Image is valid and unverified, post it, set flag and exit
      if (image_store[idx] && (JSON.parse(image_store[idx].meta)).verified === 'no') {
        this_app.picture[4].src = '/?action=retrieveBig&id=' + image_store[idx].id;
        this_app.guess[4].innerHTML= 'I think this is ' + (JSON.parse(image_store[idx].meta)).guess + '.';
        console.log(idx);
        console.log(image_store[idx].id);
        console.log((JSON.parse(image_store[idx].meta)).guess);
        done = true;
        
        // TODO only increment idx when make a submit or skip
        break;
      }
    }
  }

// Don't try another retrieve, will just grab same data + more again
//
//    // No more images, display sorry image 
//    if (done === false && info.length === 0) {
//    
//    // No match, load another chunk
//    } else if (done === false) {
//      since = since - (60*60*1000); // Back off another hour
//    }

    if (done === false) {
     
      // Clear out image chunk and reset index to begin guessing again
      image_store = new String();
      idx = -1;

      // Load static sorry image, clear out guess
      this_app.picture[4].src = 'http://www.mattstaniszewski.net/images/sorry.jpg';
      this_app.guess[4].innerHTML= 'Out of images :-(';
    }

//  }
}

//spec says app needs to be named App
var App = MyApp;
