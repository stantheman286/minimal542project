var devices;
var main_elem;
var devlist_elem;
var dbg_elem;

window.onload = function(){
  main_elem = document.getElementById('apps');
  devlist_elem = document.getElementById('dev_list');
  dbg_elem = document.getElementById('debug');
  
  dbg('running...')
  
  updateDevices();
}

function dbg(msg) {
  //
  // print debug message in the debug div
  //
  dbg_elem.innerHTML = msg + '<br>' + dbg_elem.innerHTML;
}

//get list of devices
function updateDevices() {
  //
  // Update the list of devices
  //
  var devices;
  var http = new XMLHttpRequest();
  http.open("GET","/?action=list" ,false);
  http.onreadystatechange=function() {
    if (http.readyState==4 && http.status == 200) {
      devices = JSON.parse(http.responseText);
      devlist_elem.innerHTML = '';
      for (devuuid in devices) {
        var dev_button = document.createElement("button");
        dev_button.type = 'button';
        dev_button.innerHTML = 'launch';
        dev_button.onclick = function(){ addapp(devuuid);};
        var dev_div = document.createElement("div");
        var dev_descr = devices[devuuid].name + ": " + devices[devuuid].status;
        
        dev_div.appendChild(dev_button);
        dev_div.appendChild(document.createTextNode(dev_descr));
        devlist_elem.appendChild(dev_div);
      }
      
    }
  };
  http.send();
}

function addapp(uuid) {
  dbg ('adding app...');
  var http = new XMLHttpRequest();
  http.open("GET","/?action=getCode&uuid="+uuid);
  http.onreadystatechange=function(){
    if (http.readyState==4 && http.status == 200) {
      eval(http.responseText);
      console.dir(App);
      var app_element = document.createElement('div');
      main_elem.appendChild(app_element);
      app_element.setAttribute("class","app_container");
      new App(app_element);
      
    }
  }
  http.send();
  //TODO: fill in stub
}