var dgram = require('dgram');

var udpsock = dgram.createSocket('udp4');
udpsock.bind();
udpsock.setMulticastTTL(10);

var message = new Buffer("hello from js");
udpsock.send(message,0,message.length,1600,'224.168.2.9',function(err,bytes){
  udpsock.close();
});