

window.onload = function(){
  var main_elem = document.getElementById('apps');
  var dbg_elem = document.getElementById('debug');
  
  //get list of devices
  var http = new XMLHttpRequest();
  dbg_elem.innerHTML = "dash.js running";
  var applist = http.open("GET","/?action=list" ,false);
  
  
}