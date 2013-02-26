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
  this.div.style.backgroundColor = "#99CCCC";
  
  var this_app = this;
  var this_uuid = this.myuuid;
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

    // Load latest image into app
//    this_app.sendEvent('retrieve',{since: 'latest', uuid:this_uuid},function(e,r){
//      this_app.picture.innerHTML = r;
//    });

    // Get the info for the latest image and then post it to the app
    this_app.sendEvent('listBig',{since: 'latest', uuid: this_uuid}, function(e, r) {
      var info = JSON.parse(r);
      this_app.picture2.src = 'http://localhost:9090/?action=retrieveBig&id=' + info[0].id; // Latest only, [0] entry
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
  this.picture = this.getElement("picture");
  this.picture2 = this.getElement("picture2");
};

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
var Base64 = {

// private property
_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for encoding
encode : function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {

        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output +
        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

    }

    return output;
},

// public method for decoding
decode : function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

        enc1 = this._keyStr.indexOf(input.charAt(i++));
        enc2 = this._keyStr.indexOf(input.charAt(i++));
        enc3 = this._keyStr.indexOf(input.charAt(i++));
        enc4 = this._keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

    }

    output = Base64._utf8_decode(output);

    return output;

},

// private method for UTF-8 encoding
_utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

        var c = string.charCodeAt(n);

        if (c < 128) {
            utftext += String.fromCharCode(c);
        }
        else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }

    }

    return utftext;
},

// private method for UTF-8 decoding
_utf8_decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }

    }

    return string;
}

}

//spec says app needs to be named App
var App = MyApp;
