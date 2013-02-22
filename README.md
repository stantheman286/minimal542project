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

Now that manager is running dash may be launched at

    http://localhost:9090/dash.html

Notable unimplemented components
--------------------------------

The following is a, most likely, incomplete list of unimplemented components

### Device

This is just a sample device. It does very little


### App

-   note: when subclassing App most methods will have to be overridden.  see AbstractApp comments.

### Manager

To be implemented:

-   storeBig action is unimplemented.

### Dash

Minimal implementation.  Very low on gui features.

In terms of a UI nothing has really been speced out yet.


