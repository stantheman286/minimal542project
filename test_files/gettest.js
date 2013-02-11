var http = require('http');

var options = {
  hostname: '127.0.0.1',
  port: 9090,
  path: '/?action=getCode&uuid=45db4d90-724b-11e2-bcfd-0800200c9a66',
//  path: '/?action=retrieve&uuid=abcd',
  method: 'GET'
};

var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

req.end();