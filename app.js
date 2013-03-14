/*jshint browser:true devel:true*/
/*global AbstractApp */

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Sub Class /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Global variables
window.timer = null;
window.image_store = [];
window.idx = -1;

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
  var img_id;
     

  this.getUIhtml(function(e,h){
    this_app.div.innerHTML = h;
    this_app.getAllElements();

    // Generate style information

    // IDs (make anonymous)
    console.log(this_app.uniquify('#', 'container'));

    var styles = this_app.uniquify('#', 'container') + ' { background-color: #C2D1E3; height: 100% }\n';
    styles += this_app.uniquify('#', 'overall_align') + ' { position: relative; width: 280px; height: 380px }\n';
    styles += this_app.uniquify('#', 'tab_container') + ' { position: absolute; top: 0px; left: -103px; right: 0px }\n';
    styles += this_app.uniquify('#', 'picture_guess_container') + ' { position: absolute; bottom: 10px; top: 40px; text-align: center; background-color: #5B84B4 }\n';
    styles += this_app.uniquify('#', 'guess_gaming_table') + ' { padding: 2px; spacing: 5px; width: 280px }\n';
    styles += this_app.uniquify('#', 'prev_guess') + ' { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold; height: 32px }\n';
    styles += this_app.uniquify('#', 'choice_question') + ' { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold; }\n';
    styles += this_app.uniquify('#', 'choice_container') + ' { text-align: left; font-family: verdana; font-size: 14px; color: #FFFFFF; font-weight: bold }\n';
    styles += this_app.uniquify('#', 'ver_author') + ' { font-family: verdana; font-size: 14px; color: #FFFFFF }\n';
    
    // Classes (not anonymous)
    styles += '.spacer_small { height: 5px }\n';
    styles += '.spacer_big { height: 10px }\n';
    styles += '.prev_pic_container { text-align: center }\n';
    styles += '.prev_pic { vertical-align: middle; width: 50% }\n';
    styles += '.guess { width: 33%; text-align: center; }\n';
    styles += '.buttons { background-color: #38577C; font-family: verdana; font-size: 10px; color: #FFFFFF; font-weight: bold }\n';
    styles += '.big_pic { vertical-align: middle; width:80% }\n';
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
    styles += 'div.big_guess_text { font-family: verdana; font-size: 16px; color:#FFFFFF; font-weight: bold }\n';
    styles += 'div.big_guess_text.verified { font-family: verdana; font-size: 16px; color:#66FF66; font-weight: bold }\n';
    styles += 'div.guess_text { font-family: verdana; font-size: 10px; color: #FFFFFF }\n';
    styles += 'div.guess_text.verified { font-family: verdana; font-size: 10px; color: #66FF66 }\n';

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

              // Sort the updated image data
              this_app.sortResults(image_store, 'img_id', true, function() {

                // Preserve image ID of deleted image to use with updated image
                img_id = (JSON.parse(image_store[i].meta)).img_id;
                
                // Delete the old image 
                this_app.sendEvent('deleteBig', {id: image_store[i].id}, function(e, r) {
                  if (e) {
                    console.log('Delete error: ' + e);
                  } else {

                    
                    // Store the correct guess and mark the image as verified
                    if (this_app.trash_radio.checked) {
                      image_store[i].meta = JSON.stringify({ guess: 'TRASH', verified: 'yes', img_id: img_id });
                    } else if (this_app.recycling_radio.checked) {
                      image_store[i].meta = JSON.stringify({ guess: 'RECYCLING', verified: 'yes', img_id: img_id });
                    } else {
                      image_store[i].meta = JSON.stringify({ guess: 'COMPOST', verified: 'yes', img_id: img_id });
                    }
  
                    // POST data with updated meta information back to server
                    http_post.open("POST","/?action=storeBig&uuid=" + this_uuid + '&meta=' + image_store[i].meta ,true);
                    http_post.onload = function() {};
                    http_post.send(uInt8Array);
                
                  }
                });
              });
            }
          };
        })(window.idx, window.image_store);
        http_get.send();

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
  var capture_store = [];

  // Set epoch to past 60 minutes to reduce data intake
  var d = new Date();
  var since = d.getTime() - (60*60*1000);

  // Store the latest capture images and then post it to the app
  this_app.sendEvent('listBig', {since: since, uuid: this_uuid}, function(e, r) {
    if (e) {
      console.log('App error (Update): ' + e);
    } else {
      capture_store = JSON.parse(r);
      
      // Sort the results based on the latest image first
      this_app.sortResults(capture_store, 'img_id', false, function() {

        // Reset displayed image count
        disp_count = 0;

        // Display up to the last 4 images and guesses in app
        for(var i = 0 ; i < (capture_store.length - 1); i++) { // Ordered from oldest first, start from end
          if (capture_store[i]) {
            
            this_app.picture[disp_count].src = '/?action=retrieveBig&id=' + capture_store[i].id;
            if (disp_count === 0) this_app.guess[disp_count].innerHTML= 'I think this is ' + (JSON.parse(capture_store[i].meta)).guess + '.';
            else this_app.guess[disp_count].innerHTML = (JSON.parse(capture_store[i].meta)).guess;
           
            // Highlight verified guesses
            if((disp_count === 0) && ((JSON.parse(capture_store[i].meta)).verified === 'yes')) {
              this_app.guess[disp_count].className = 'big_guess_text verified';
              this_app.guess[disp_count].innerHTML = 'This is ' + (JSON.parse(capture_store[i].meta)).guess + '.*';
            } else if((JSON.parse(capture_store[i].meta)).verified === 'yes') {
              this_app.guess[disp_count].className = 'guess_text verified';
              this_app.guess[disp_count].innerHTML += '*';
            } else if(disp_count === 0) {
              this_app.guess[disp_count].className = 'big_guess_text';
            } else {
              this_app.guess[disp_count].className = 'guess_text';
            }

            // Only increment for each one displayed
            if(++disp_count === 4) {
              break;
            }
          }
        }
      });
    }
  });
};

////////////////////////////////// Some "Private" Methods //////////////////////

// Gets all the HTML elements from the app webpage
MyApp.prototype.getAllElements = function(){
  "use strict";
  
  // Take picture
  this.take_picture_button = this.getElement("take_picture_button");
  this.refresh_button = this.getElement("refresh_button");

  // Picture and guess modules
  this.picture = [];
  this.guess = [];
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

// Chooses an unverified picture to display for the game
MyApp.prototype.getRandomUnverifiedPic = function(idx) {
  "use strict";

// TODO randomize?

  var this_app = this;
  var this_uuid = this.myuuid;
  
  // Set epoch to past 60 minutes to reduce data intake
  var d = new Date();
  var since = d.getTime() - (60*60*1000);

  // Set flag to show haven't found a picture yet
  var done = false;
  
  // Go through a chunk of images at a time until find a match or run out
//  while (!done) {

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
       
        // Sort the data so that verified entries (oldest image IDs) are at the back
        this_app.sortResults(window.image_store, 'img_id', true, function() {});
      }
    });   
  }

  // Images left, go through them
  // TODO: once run out of image chunk, get more (and not same ones over and over)
  if (idx < window.image_store.length) {
    
    // Run through all the images in the chunk (oldest first)
    for(; idx < window.image_store.length; idx++) {

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
      window.image_store = [];
      window.idx = -1;

      // Load static sorry image, clear out guess
      this_app.picture[4].src = 'http://www.mattstaniszewski.net/images/sorry.jpg';
      this_app.guess[4].innerHTML= 'Out of images :-(';
        
      // Hide the prompt and choices
      this_app.choice_question.className = 'choices hide';
      this_app.choice_container.className = 'choices hide';
    }

//  }
};

// Initializes the tabs at the top of the app
MyApp.prototype.initTabs = function() {
  "use strict";

  var this_app = this;
  var this_uuid = this.myuuid;
  var i;
  var selectedId;

  // Grab the tab links and content divs from the page
  var tabListItems = this_app.getElement("tabs").childNodes;
  var tabLink;
  var tabLinks = [];
  var contentDivs = [];

  for ( i = 0; i < tabListItems.length; i++ ) {
    if ( tabListItems[i].nodeName == "LI" ) {
      tabLink = this_app.getFirstChildWithTagName( tabListItems[i], 'A' );
      id = this_app.getHash( tabLink.getAttribute('href') );
      tabLinks[id] = tabLink;
      contentDivs[id] = document.getElementById(id);  // Don't use helper function
    }
  }

  // Assign onclick events to the tab links, and
  // highlight the first tab
  i = 0;

  for ( var id in tabLinks ) {

    // Show the correct tab when clicked
    tabLinks[id].onclick = function() { 
   
      selectedId = this_app.getHash( this.getAttribute('href') );

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

    tabLinks[id].onfocus = function() { this.blur(); };
    if ( i === 0 ) {
      tabLinks[id].className = 'selected';
    }
    i++;
  }

  // Hide all content divs except the first
  i = 0;

  for ( var id in contentDivs ) {
    if ( i !== 0 ) {
      contentDivs[id].className = 'tabContent hide';
    }
    i++;
  }
};

// Tab helper function to get child nodes of an element
MyApp.prototype.getFirstChildWithTagName = function(element, tagName) {
  "use strict";
  for ( var i = 0; i < element.childNodes.length; i++ ) {
    if ( element.childNodes[i].nodeName == tagName ) return element.childNodes[i];
  }
};

// Tab helper function to get a hash
MyApp.prototype.getHash = function(url) {
  "use strict";
  var hashPos = url.lastIndexOf ( '#' );
  return url.substring( hashPos + 1 );
};

// Adds CSS into app webpage from js
MyApp.prototype.appendStyle = function(styles) {
  "use strict";
  var css = document.createElement('style');
  css.type = 'text/css';

  if (css.styleSheet) css.styleSheet.cssText = styles;
  else css.appendChild(document.createTextNode(styles));

  document.getElementsByTagName("head")[0].appendChild(css);
};

// Sorts image list based on a meta field
MyApp.prototype.sortResults = function (arr, prop, asc, callback) {
  "use strict"
    
  arr = arr.sort(function(a, b) {
      if ((JSON.parse(a.meta))[prop] === (JSON.parse(b.meta))[prop]) return 0;
      else if (((asc) && ((JSON.parse(a.meta))[prop] > (JSON.parse(b.meta))[prop])) || 
               ((!asc) && ((JSON.parse(b.meta))[prop] > (JSON.parse(a.meta))[prop]))) return 1;
      else return -1;
  });
  return callback();
};

//spec says app needs to be named App
var App = MyApp;
