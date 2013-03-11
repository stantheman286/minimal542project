/*jshint browser:true devel:true*/
/*global AbstractApp */

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Sub Class /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Global variables
window.timer;
window.image_store = new String();
window.idx = -1;
window.num_verified_entries = 0;

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
  
  var http_get = new XMLHttpRequest();
  var http_post = new XMLHttpRequest();
     

  this.getUIhtml(function(e,h){
    this_app.div.innerHTML = h;
    this_app.getAllElements();

    // Generate style information

    // IDs (make anonymous)
    console.log(this_app.uniquify('#', 'container'));

    var styles = this_app.uniquify('#', 'container') + ' { background-color: #C2D1E3; height: 380px }\n';
    styles += this_app.uniquify('#', 'overall_align') + ' { position: relative; width: 280px; height: 380px }\n';
    styles += this_app.uniquify('#', 'tab_container') + ' { position: absolute; top: 0px; left: -103px; right: 0px }\n';
    styles += this_app.uniquify('#', 'picture_guess_container') + ' { position: absolute; bottom: 10px; top: 40px; text-align: center; background-color: #5B84B4 }\n';
    styles += this_app.uniquify('#', 'guess_gaming_table') + ' { padding: 2px; spacing: 5px; width: 280px }\n';
    styles += this_app.uniquify('#', 'prev_guess') + ' { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold; height: 32px }\n';
    styles += this_app.uniquify('#', 'choice_question') + ' { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold; }\n';
    styles += this_app.uniquify('#', 'choice_container') + ' { text-align: left; font-family: verdana; font-size: 14px; color: #FFFFFF; font-weight: bold }\n';
    
    // Classes (not anonymous)
    styles += '.spacer_small { height: 5px }\n';
    styles += '.spacer_big { height: 10px }\n';
    styles += '.prev_pic_container { text-align: center }\n';
    styles += '.prev_pic { vertical-align: middle; width: 50% }\n';
    styles += '.guess { width: 33%; text-align: center; font-family: verdana; font-size: 10px; color: #FFFFFF }\n';
    styles += '.buttons { background-color: #38577C; font-family: verdana; font-size: 10px; color: #FFFFFF; font-weight: bold }\n';
    styles += '.big_pic { vertical-align: middle; width:80% }\n';
    styles += '.big_guess { font-family: verdana; font-size: 16px; color:#FFFFFF; font-weight: bold }\n';
    styles += '.small_guess { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold }\n';
    styles += '.prev_container { width: 280px }\n';

    // Tab-related
    styles += this_app.uniquify('ul#', 'tabs') + ' { list-style-type: none; }\n';
    styles += this_app.uniquify('ul#', 'tabs li') + ' { display: inline }\n';
    styles += this_app.uniquify('ul#', 'tabs li a') + ' { padding: 7px; background-color: #C2D1E3; font-family: verdana; font-size: 14px; color: #38577C; font-weight: bold; text-decoration: none; }\n';
    styles += this_app.uniquify('ul#', 'tabs li a:hover') + ' { background-color: #000066; color: #FFFFFF }\n';
    styles += this_app.uniquify('ul#', 'tabs li a.selected') + ' { background-color: #5B84B4; font-family: verdana; font-size: 14px; color: #FFFFFF; font-weight: bold; }\n';

    styles += 'div.tabContent { }\n';
    styles += 'div.tabContent.hide { display: none; }\n';
    styles += 'div.choices { }\n';
    styles += 'div.choices.hide { display: none; }\n';

    // Set style tag in HTML
    this_app.appendStyle(styles);

    // Set up correct tab references
    this_app.capture_tab.href = this_app.uniquify('#', 'capture');
    this_app.gaming_tab.href = this_app.uniquify('#', 'gaming');
    this_app.about_tab.href = this_app.uniquify('#', 'about');

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

    // Update verified image and get a new one if user clicks submit button 
    this_app.submit_answer_button.addEventListener('click', function() {
   
      // Only send requests if valid index (not sorry image)
      if (window.idx > -1) {

        // Send GET request for image to update its meta data
        http_get.open("GET","/?action=retrieveBig&id=" + window.image_store[window.idx].id ,true);
        http_get.responseType = 'arraybuffer';
        http_get.onreadystatechange=(function(i,image_store){
          return function(){
            if (http_get.readyState==4 && http_get.status==200) {

              // Get the image data
              var uInt8Array = new Uint8Array(this.response); // this.response == uInt8Array.buffer

              // Delete the old image 
              this_app.sendEvent('deleteBig', {id: image_store[i].id}, function(e, r) {
                if (e) {
                  console.log('Delete error: ' + e);
                } else {
                  // Store the correct guess and mark the image as verified
                  if (this_app.trash_radio.checked) {
                    image_store[i].meta = JSON.stringify({ guess: 'TRASH', verified: 'yes' });
                  } else if (this_app.recycling_radio.checked) {
                    image_store[i].meta = JSON.stringify({ guess: 'RECYCLING', verified: 'yes' });
                  } else {
                    image_store[i].meta = JSON.stringify({ guess: 'COMPOST', verified: 'yes' });
                  }
  
                  // POST data with updated meta information back to server
                  http_post.open("POST","/?action=storeBig&uuid=" + this_uuid + '&meta=' + image_store[i].meta ,true);
                  http_post.onload = function() {};
                  http_post.send(uInt8Array);
                }
              });
            }
          };
        })(window.idx, window.image_store);
        http_get.send();

        // Increment the verified image count, used for skipping over verified entries
        window.num_verified_entries++;
        
        // Go to next image and refresh screen
        this_app.getRandomUnverifiedPic(window.idx+1);

      } else {
        console.log('Sorry message should be displayed now');
      }

    });

    // Get a new picture if user clicks the skip button
    this_app.skip_button.addEventListener('click', function() {
      this_app.getRandomUnverifiedPic(window.idx+1);
    });

    // Auto-refresh app every 10 seconds
    window.timer = setInterval(function(){
      this_app.update();
    },10000);

  });

};

MyApp.prototype.update = function(){
  "use strict";

  var this_app = this;
  var this_uuid = this.myuuid;
  var disp_count;

  // Set epoch to past 60 minutes to reduce data intake
  var d = new Date();
  var since = d.getTime() - (60*60*1000);

  // Get the info for the latest image and then post it to the app
  this_app.sendEvent('listBig', {since: since, uuid: this_uuid}, function(e, r) {
    if (e) {
      console.log('App error (Update): ' + e);
    } else {
      var info = JSON.parse(r);

      // Reset displayed image count
      disp_count = 0;

      // Display up to the last 4 new (unverified) images and guesses in app
      for(var i = 0; i < info.length; i++) {
        if ((info[info.length-(i+1)]) && ((JSON.parse(info[info.length-(i+1)].meta)).verified === 'no')) {
          
          this_app.picture[disp_count].src = '/?action=retrieveBig&id=' + info[info.length-(i+1)].id; // Oldest first order, start from end
          if (disp_count === 0) this_app.guess[disp_count].innerHTML= 'I think this is ' + (JSON.parse(info[info.length-(i+1)].meta)).guess + '.';
          else this_app.guess[disp_count].innerHTML= (JSON.parse(info[info.length-(i+1)].meta)).guess;
          
          // Only increment for each one displayed
          if(++disp_count === 4) {
            break;
          }
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
  this.choice_question = this.getElement("choice_question");
  this.choice_container = this.getElement("choice_container");
  this.trash_radio = this.getElement("trash_radio");
  this.recycling_radio = this.getElement("recycling_radio");
  this.compost_radio = this.getElement("compost_radio");

};

// Creates the unique HTML tag names based on UUID
MyApp.prototype.uniquify = function(preID, originalID) {
  return preID + 'id' + this.myuuid + originalID;
};

MyApp.prototype.getRandomUnverifiedPic = function(idx) {
  "use strict";

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
  // No image chunk stored or out of images, get a new chunk
  if (window.image_store.length === 0) {
    
    // Grab a chunk of images
    this_app.sendEvent('listBig', {since: since, uuid: this_uuid}, function(e, r) {
      if (e) {
        console.log('App error (start): ' + e);
      } else {
        // Store an image chunk and set the index
        window.image_store = JSON.parse(r);
        idx = 0;
        
        // Ressurect old verified list (in case app restarted)
        if(window.num_verified_entries === 0) {
          for (var i = 0; i < window.image_store.length; i++) {
            if ((JSON.parse(window.image_store[i].meta)).verified === 'yes') {
              window.num_verified_entries++;
            }
          }
        }
      }
    });   
  }

  // Images left, go through them
  // TODO: once run out of image chunk, get more (and not same ones over and over)
  if (idx < (window.image_store.length - 4 - window.num_verified_entries)) {
    
    // Run through all the images in the chunk (oldest first)
    for(; idx < (window.image_store.length - 4 - window.num_verified_entries); idx++) { // Skip the latest 4 to prevent deleting images from capture screen

      // Image is valid and unverified, post it, set flag and exit
      if (window.image_store[idx] && (JSON.parse(window.image_store[idx].meta)).verified === 'no') {
        this_app.picture[4].src = '/?action=retrieveBig&id=' + window.image_store[idx].id;
        this_app.guess[4].innerHTML= 'I think this is ' + (JSON.parse(window.image_store[idx].meta)).guess + '.';

        // Show the prompt and choices
        this_app.choice_question.className = 'choices';
        this_app.choice_container.className = 'choices';
        // Set flag
        done = true;

        // Only set the global index if find a match
        window.idx = idx;

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
      window.image_store = new String();
      window.idx = -1;

      // Load static sorry image, clear out guess
      this_app.picture[4].src = 'http://www.mattstaniszewski.net/images/sorry.jpg';
      this_app.guess[4].innerHTML= 'Out of images :-(';
        
      // Hide the prompt and choices
      this_app.choice_question.className = 'choices hide';
      this_app.choice_container.className = 'choices hide';
    }

//  }
}

MyApp.prototype.initTabs = function() {
  "use strict";

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

      // Refresh gaming screen anytime the tab is clicked
      if (selectedId === this_app.uniquify('', 'gaming')) {
        this_app.getRandomUnverifiedPic(window.idx);
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
  "use strict";
  for ( var i = 0; i < element.childNodes.length; i++ ) {
    if ( element.childNodes[i].nodeName == tagName ) return element.childNodes[i];
  }
}

MyApp.prototype.getHash = function(url) {
  "use strict";
  var hashPos = url.lastIndexOf ( '#' );
  return url.substring( hashPos + 1 );
}

MyApp.prototype.appendStyle = function(styles) {
  "use strict";
  var css = document.createElement('style');
  css.type = 'text/css';

  if (css.styleSheet) css.styleSheet.cssText = styles;
  else css.appendChild(document.createTextNode(styles));

  document.getElementsByTagName("head")[0].appendChild(css);
}

//spec says app needs to be named App
var App = MyApp;
