var mysql = require('mysql');
var fs    = require('fs');

var connection = mysql.createConnection({
  host     : 'vergil.u.washington.edu',
  port     : '48236',
  user     : 'guest',
  password : 'matty_pi',
  database: 'ee542',
  debug: false
});

connection.connect();

var data = fs.readFileSync('test.jpg');

// Clean out table first
//connection.query('DELETE FROM manager WHERE uuid=12345;');

// Write image into database as BLOB
//connection.query('INSERT INTO manager (uuid,bigData) VALUES (12345,' + connection.escape(data) + ');', function(err,r){
//  if (err) throw err;
//});

// Read BLOB from database and save as new image
connection.query('SELECT bigdata FROM managerBig WHERE epoch=\'1361859915078001\';', function(err,r){
  fs.writeFileSync('test2.jpg', r[0].bigdata, function(err) {
//  console.log(r[0].bigData);
//  fs.writeFileSync('test2.jpg', new Buffer( r[0].bigData ).toString('base64'), 'base64', function(err) {
    if (err) throw err;
  });
});

connection.end();

