Instructions
============

Install mysql
-------------

The code in this repository depends on the mysql node package. to install
locally type

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
npm install mysql
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

or to install globally

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
npm -g install mysql
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Configure database
------------------

edit dbconfig.example.JSON with appropriate information then rename it
dbconfig.JSON

run
---

to run a dummyDevice

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
node dummyDevice.js
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

to run the manager

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
node manager.js
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

note: as its written now you must start dummyDevice first.

Notable unimplemented components
--------------------------------

The following is a, most likely, incomplete list of unimplemented components

### Device

This is just a sample device. Right now it only responds to getCode and info
requests.  ie the bar minimum to load an app.

### App

-   sendEvent - helper function.  sends event to manager.  Not mandated by spec
    but important.

-   getUIhtml - helper function.  sends request to device (through manager) to
    get innerHTML for app ui.  This is optional since innerHTML may be
    procedurally generated.  if implemented this function must uniqueify the tag
    id's and the device must support a getHTML command.

-   getElement - helper function.

-   note: when subclassing App most methods will have to be rewritten.  The
    above three only need be written once so someone should implement them.

### Manager

Right now Manager assumes there is a single device at 127.0.0.1 on port 8080
(see line "//TODO: delete this and implement the discovery protocol").  Things
that need to be implemented are

-   Discovery protocol (should be simple)

-   Currently getData only returns ALL data and does not process the 'since'
    field

-   

### Dash

This is more of an example implementation.  The only thing dash.js really needs
are the data fields:

-   .devices

-   .manager_hostname

-   .manager_port

In terms of a UI nothing has really been speced out yet.


