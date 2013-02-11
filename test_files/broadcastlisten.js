var dgram = require('dgram');


var udpsock = dgram.createSocket('udp4', function (message, remote){
  console.log('got: '+message);
  console.log('from:' + JSON.stringify(remote));
});

udpsock.bind(1600);
udpsock.addMembership('224.168.2.9');
