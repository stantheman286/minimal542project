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

    // Generate style information

    // IDs (make anonymous)
    var styles = '#id' + this_uuid + 'container { background-color: #C2D1E3; height: 380px }\n';
    styles += '#id' + this_uuid + 'overall_align { position: relative; width: 280px; height: 380px }\n';
    styles += '#id' + this_uuid + 'tab_container { position: absolute; top: 0px; left: -167px; right: 0px }\n';
    styles += '#id' + this_uuid + 'picture_guess_container { position: absolute; bottom: 10px; top: 40px; text-align: center; background-color: #5B84B4 }\n';
    styles += '#id' + this_uuid + 'guess_table { padding: 2px; spacing: 5px; width: 280px }\n';
    styles += '#id' + this_uuid + 'picture0 { vertical-align: middle; width:80% }\n';
    styles += '#id' + this_uuid + 'guess0 { font-family: verdana; font-size: 16px; color:#FFFFFF; font-weight: bold }\n';
    styles += '#id' + this_uuid + 'prev_guess { font-family: verdana; font-size: 12px; color:#FFFFFF; font-weight: bold; height: 32px }\n';
    
    // Classes (not anonymous)
    styles += '.spacer_small { height: 5px }\n';
    styles += '.spacer_big { height: 10px }\n';
    styles += '.prev_pic_container { text-align: center }\n';
    styles += '.prev_pic { vertical-align: middle; width: 50% }\n';
    styles += '.guess { text-align: center; font-family: verdana; font-size: 10px; color: #FFFFFF }\n';
    styles += '.buttons { background-color: #38577C; font-family: verdana; font-size: 10px; color: #FFFFFF; font-weight: bold }\n';

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

  // Tabs
  this.capture_tab = this.getElement("capture_tab");
  this.gaming_tab = this.getElement("gaming_tab");

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

//spec says app needs to be named App
var App = MyApp;
