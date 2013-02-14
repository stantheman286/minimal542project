Instructions
============
Install mysql
-------------
The code in this repository depends on the mysql node package.  to install locally type

    npm install mysql

or to install globally

    npm -g install mysql

Configure database
------------------
edit dbconfig.example.JSON with appropriate information then rename it dbconfig.JSON
    
run
---
to run a dummyDevice 

    node dummyDevice.js

to run the manager

    node manager.js

note: as its written now you must start dummyDevice first.