#!/usr/bin/env node

process.title = "SpaceWars";

var express = require('express');
var http = require('http');
var app = express();
var socketIO = require('socket.io');
// var config = require('config');
var colors = require('colors');


/* Handle Explosions  */
// process.on('SIGINT', shutdown());
// process.on('exit', shutdown());
// process.on('uncaughtException', function(err) {
//   console.log('Caught exception: ' + err);
// });
// process.on('SIGTERM', shutdown());

// function shutdown() {
// 	console.log("Die");
// 	if(server){
// 		server.close();
// 	}
// }


var server = app.listen(8000, "127.0.0.1", function() {
	console.log("Server Running.".green);
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
var io = socketIO.listen(server);



/* setup connection specific details */
var connections = 0;

io.on('connection', function (socket) {
    connections++;
    
    console.log('Client Connected: '.green, socket);
  	socket.emit('connected', { conns: connections });

    socket.on('disconnect', function () {
    	console.log('Client Disconnected: '.green);
        connections--;
    });
});

