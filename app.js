function GenericApp(divobject){
    if (divobject===undefined) {
        throw "First argument Must be a valid html object";
    }
    this.div = divobject;
}

GenericApp.prototype.init = function(){
    var field1 = document.createElement("div");
    var field2 = document.createElement("div");
    var type_input = document.createElement("input");
    var data_input = document.createElement("input");
    var abutton = document.createElement("button");
    this.div.style.cssText = "background-color:#BFB";
    this.div.innerHTML = "";
    field1.innerHTML = "Event type: ";
    field1.appendChild(type_input);
    field2.innerHTML = "Data:";
    field2.appendChild(data_input);
    abutton.innerHTML = "Send";
	
    var that=this;
    abutton.addEventListener('click',function() {
        that.sendEvent(type_input.value,data_input.value);
    });
    
    this.div.appendChild(field1);
    this.div.appendChild(field2);
    this.div.appendChild(abutton);
}
GenericApp.prototype.sendEvent = function(type,data){
    //replace with actual request code
    alert("Event type: " + type + "\nData: " + data)
}

function ColorChangeApp(divobj) {
    GenericApp.call(this,divobj);
}
ColorChangeApp.prototype = Object.create(GenericApp.prototype);
ColorChangeApp.prototype.constructor = ColorChangeApp;
ColorChangeApp.prototype.init = function() {
    var changeColorButton = document.createElement("button");
	
    GenericApp.prototype.init.call(this);
    this.colors = ['#FBB','#BFB','#BBF'];
    this.colorIndex = 1;
    changeColorButton.innerHTML = "Change Color";
    var that = this;
    changeColorButton.addEventListener('click', function(){
        that.colorIndex = (that.colorIndex+1)%(that.colors.length);
        that.div.style.cssText = "background-color: "
            + that.colors[that.colorIndex];
    });
    this.div.appendChild(changeColorButton);
}


function loadevent(){
    //app1, app2 etc should be generated here not in the html
    //but this is just an app example not a control panel example
    var app1 = new GenericApp(document.getElementById('app1'));
    app1.init();
    var app2 = new ColorChangeApp(document.getElementById('app2'));
    app2.init();
}

window.onload=loadevent;