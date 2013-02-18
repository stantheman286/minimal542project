Instructions
============

Install mysql library
---------------------

The code in this repository depends on the mysql node package. to install
locally type


    npm install mysql


or to install globally

    npm -g install mysql

Configure database
------------------

edit dbconfig.example.JSON with appropriate information then rename it
dbconfig.JSON

run
---

to run a dummyDevice

    node dummyDevice.js

to run the manager

    node manager.js

note: as its written now you must start dummyDevice first.

Now that manager is running dash may be launched at

    http://localhost:9090/dash.html

Notable unimplemented components
--------------------------------

The following is a, most likely, incomplete list of unimplemented components

### Device

This is just a sample device. Right now it only responds to getCode and info
requests.  ie the bare minimum to load an app.
HTTP queries to be implemented:
-   ping 
-   acquire - called by manager to associate the device with the manager
-   implementation specific stuff like handling messages from app and storing data

### App

-   note: when subclassing App most methods will have to be overridden.  Only helper methods such as getUIhtml and sendEvent will probably be unchanged.

### Manager

Right now Manager assumes there is a single device at 127.0.0.1 on port 8080
(see line "//TODO: delete this and implement the discovery protocol").  Things
that need to be implemented are

-   Currently getData only returns ALL data and does not process the 'since'
    field
    
-   storeBig action is unimplemented.

-   forward of post data is unimplemented.

### Dash

This is more of an example implementation.  The only thing dash.js really needs
are the data fields:

-   .devices

-   .manager_hostname

-   .manager_port

In terms of a UI nothing has really been speced out yet.


