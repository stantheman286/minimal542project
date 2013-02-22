/*jshint browser:true devel:true evil:true*/
window.onload = function(){
  var dash = new Dashboard();
};

function Dashboard(){
  //
  // The dashboard constructor
  //
  
  // These fields must be named exactly as they are (by spec)
  this.devices = null;
  this.manager_hostname = location.hostname;
  this.manager_port = location.port;
  this.user_name = "";
  
  //get all elements
  this.main_elem = document.getElementById('apps');
  this.devlist_elem = document.getElementById('dev_list');
  
  this.update();
}

Dashboard.prototype.dbg = function(msg) {
  //
  // print debug message 
  //
  console.log(msg);
};

//get list of devices
Dashboard.prototype.update = function() {
  //
  // Update the list of devices
  //
  var http = new XMLHttpRequest();
  var this_dash = this;
  http.open("GET","/?action=list" ,false);
  http.onreadystatechange=function() {
    if (http.readyState==4 && http.status == 200) {
      this_dash.devices = JSON.parse(http.responseText);
      this_dash.devlist_elem.innerHTML = '';
      //for each device build a bar in the GUI
      var addAppGenerator = function(u){
        return function(){
          this_dash.addapp(u);
        };
      };
      for (var devuuid in this_dash.devices) {
        var dev_button = document.createElement("button");
        dev_button.type = 'button';
        dev_button.innerHTML = 'launch';
        // "evaluate" uuid right now
        dev_button.onclick = addAppGenerator(devuuid);
        var dev_div = document.createElement("div");
        dev_div.setAttribute('class','app_listitem');
        var dev_descr = this_dash.devices[devuuid].name + ": " +
                        this_dash.devices[devuuid].status;
        
        dev_div.appendChild(dev_button);
        dev_div.appendChild(document.createTextNode(dev_descr));
        this_dash.devlist_elem.appendChild(dev_div);
      }
    }
  };
  http.send();
};
Dashboard.prototype.addapp = function(uuid) {
  //
  // Launches App
  // uuid: the uuid of the device associated with the app
  //
  // TODO: make sure an app window doesn't already exist
  // TODO: keep track of app windows, right now it just fires-and-forgets
  var this_dash = this;
  var http = new XMLHttpRequest();
  var App;
  
  this.dbg ('adding app...');
  
  http.open("GET","/?action=forward&cmd=getCode&uuid="+uuid);
  http.onreadystatechange=function(){
    if (http.readyState==4 && http.status == 200) {
      App = getApp(http.responseText);
      var elements = this_dash.buildAppWindow(this_dash.devices[uuid].name);
      // now hand the div to the app.
      var this_app = new App(elements.app,uuid,this_dash);
      this_app.start();
      //TODO: add close callback to elements.close
      elements.close.addEventListener('click',function(){
        this_app.stop();
        elements.window.parentNode.removeChild(elements.window);
      });
    }
  };
  http.send();
};
Dashboard.prototype.stop = function(uuid) {
  //
  // Calls the apps stop method then tears down the HTML div that contained
  // the app associated with the device with uuid uuid.
  //
  
  // TODO: STOP the app 
  this.dbg('stop called on: ' + this.devices[uuid].name +
           "; stop unimplemented");
};
Dashboard.prototype.login = function() {
  //
  // Does login stuff
  //
  
  //todo implement
  this.dbg('login unimplemented');
};
Dashboard.prototype.logout = function() {
  //
  // Does logout stuff
  //
  
  //todo implement
  this.dbg('logout unimplemented');
};
Dashboard.prototype.loadScript = function(scriptSrc,callback) {
  //
  // Loads a script dynamically.
  // scriptSrc: a string containing the source of the script
  // callback: a callback function called when the script has loaded
  //
  // NOTE: untested
  var oHead = document.getElementsByTagName('head');
  var oScript = document.createElement('script');
  oScript.type = 'text/javascript';
  oScript.src = scriptSrc;
  if (callback) {
    oScript.onload = callback;
  }
  oHead.appendChild(oScript);
};

Dashboard.prototype.buildAppWindow = function(window_title){
  //
  // builds an app window with things like close buttons
  //
  // returns: a div object which is controlled 100% by the app
  var outer_div = document.createElement('div');
  outer_div.setAttribute("class","app_container");
  
  var app_title_div = document.createElement('div');
  app_title_div.setAttribute("class","app_title_bar");
  app_title_div.style.backgroundColor = "#ddd";
  
  var close_btn = document.createElement('div');
  close_btn.setAttribute("class","round_btn");
  close_btn.style.backgroundColor = "#d00";
  close_btn.style.borderRadius = "8px";
  
  var title_txt = document.createTextNode(window_title);
  
  var app_element = document.createElement('div');
  app_element.setAttribute("class","app");
  
  //build structure
  this.main_elem.appendChild(outer_div);
    outer_div.appendChild(app_title_div);
      app_title_div.appendChild(close_btn);
      app_title_div.appendChild(title_txt);
    outer_div.appendChild(app_element);
  
  return {app: app_element, close: close_btn, window: outer_div};
};

function getApp(appCodeText){
  //
  // Evaluates the input code (as string) and returns the object App
  // generated by the code.
  //
  eval(appCodeText);
  return App;
}
