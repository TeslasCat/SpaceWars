#!/usr/bin/env node

process.title = "SpaceWars";

var io = require('socket.io')();
var util = require("util");

/* 
var config = require('config');
var colors = require('colors');
*/

var names = require('./random-name');

/* Some of our Stuff */
var Player = require("./Player");
var BISON = require("./bison");

/**
 * Message protocols
 */
var MESSAGE_TYPE_PING = 1;
var MESSAGE_TYPE_UPDATE_PING = 2;
var MESSAGE_TYPE_NEW_PLAYER = 3;
var MESSAGE_TYPE_SET_COLOUR = 4;
var MESSAGE_TYPE_UPDATE_PLAYER = 5;
var MESSAGE_TYPE_REMOVE_PLAYER = 6;
// var MESSAGE_TYPE_AUTHENTICATION_PASSED = 7;
// var MESSAGE_TYPE_AUTHENTICATION_FAILED = 8;
// var MESSAGE_TYPE_AUTHENTICATE = 9;
var MESSAGE_TYPE_ERROR = 10;
// var MESSAGE_TYPE_ADD_BULLET = 11;
// var MESSAGE_TYPE_UPDATE_BULLET = 12;
// var MESSAGE_TYPE_REMOVE_BULLET = 13;
// var MESSAGE_TYPE_KILL_PLAYER = 14;
// var MESSAGE_TYPE_UPDATE_KILLS = 15;
// var MESSAGE_TYPE_REVIVE_PLAYER = 16;

players = [];

io.serveClient(false);
io.listen(8000);
util.log("Server listening on 8000");
var serverStart = new Date().getTime();


initPlayerActivityMonitor(players, io);

io.on('connection', function(client) {
	util.log("CONNECT: ", client.id);

    client.on('message', function(msg) {
		var data = BISON.decode(msg);
		if (data.type) {
			switch (data.type) {
				case MESSAGE_TYPE_PING:
					var player = players[indexOfByPlayerId(client.id)];
					// var player = playerById[client.id];
					
					if (player == null) {
						util.log("ERROR: Unable to find player to ping: ", client.id);
						break;
					};
					
					player.age = 0; // Player is active
					
					var newTimestamp = new Date().getTime();
					// util.log("Round trip: "+(newTimestamp-data.ts)+"ms");
					var ping = newTimestamp-data.t;
					// util.log(ping)
					
					// Send ping back to player
					client.send(formatMessage(MESSAGE_TYPE_PING, {i: player.id, n: player.name, p: ping}));
					
					// Broadcast ping to other players
					io.send(formatMessage(MESSAGE_TYPE_UPDATE_PING, {i: client.id, p: ping}));
					
					// Log ping to server after every 10 seconds
					if ((newTimestamp-serverStart) % 10000 <= 3000) {
						util.log("PING [{1} - {0}]: {2}".format([client.id, player.name, ping]));
					};
					
					// Request a new ping
					sendPing(client);
					break;
				case MESSAGE_TYPE_NEW_PLAYER:
					// Setup new player.
					var player = new Player(client.id, data.x, data.y, names.first());
					players.push(player);

					// Broadcast new player to all clients, including the new one.
					io.send(formatMessage(MESSAGE_TYPE_NEW_PLAYER, {i: player.id, x: player.x, y: player.y, n: player.name}));

					// Tell the new player about existing players
					for(var i in players) {
						// Make sure not to tell the client about it's self.
						if(players[i].id == client.id)
							continue;
						client.send(formatMessage(MESSAGE_TYPE_NEW_PLAYER, {i: players[i].id, x: players[i].x, y: players[i].y, n: players[i].name}));
					}

					sendPing(client);
					util.log("NEW_PLAYER: ", player.name, player.id);
					break;
			};
		} else {
			util.log("Invalid Message protocol");
		};
    });

	client.on("disconnect", function() {
		var removePlayer = playerById(this.id);

		// Player not found
		if (!removePlayer) {
			util.log("Player not found: ", this.id);
			return;
		};

		util.log("Player has disconnected: ", removePlayer.name, this.id);

		// Remove player from players array
		players.splice(players.indexOf(removePlayer), 1);

		// Broadcast removed player to connected socket clients
		io.send(formatMessage(MESSAGE_TYPE_REMOVE_PLAYER, {i: client.id}));
	});
});


function initPlayerActivityMonitor(players, socket) {
	setInterval(function() {		
		for(var i in players) {
			var p = players[i];
			if(p == null)
				continue;

			if(p.age > 3){
				// io.send(formatMessage(MESSAGE_TYPE_REMOVE_PLAYER, {i: p.id}));
				util.log("CLOSE [TIME OUT]: ", p.name, p.id);

				for(var id in io.sockets.sockets){
					if(p.id == io.sockets.sockets[id].id) {
						io.sockets.sockets[id].disconnect();
					}
				}

				// No Need to remove from player list as it will be handled by 'disconnect'.
				// players.splice(indexOfByPlayerId(p.id), 1);
				// players.splice(players.indexOf(playerById[p.id]), 1);
				continue;
			}
			p.age += 1;
			// util.log("Increase player age: ", p.id);
		}
	}, 1000);

	// setInterval(function() {
	// 	players.forEach(function (p, i) {
	// 		util.log("{0} {1} {2}".format([p.name, p.id, p.age]));
	// 	});
	// }, 2000);
};

/* 
 * Helper Functions 
 */
function sendPing(client) {
	setTimeout(function() {
		var timestamp = new Date().getTime();
		client.send(formatMessage(MESSAGE_TYPE_PING, {t: timestamp.toString()}));
		// util.log("PING: ", client.id, timestamp.toString());
	}, 3000);
};

/**
 * Find player by the player name
 *
 * @param {String} name Name of player
 * @returns Player object
 * @type Player
 */
// function playerByName(name) {
// 	for (var i = 0; i < players.length; i++) {
// 		if (players[i].name == name)
// 			return players[i];
// 	};	
// };

/**
 * Find player by the player id
 *
 * @param {Number} id Id of player
 * @returns Player object
 * @type Player
 */
function playerById(id) {

	// players.forEach(function (p, i) {
	// 	util.log(p.id, p.name);
	// 	if(p.id == id){
	// 		return i;
	// 	};
	// });

	for(var i in players){
		if(players[i].id == id){
			return players[i];
		};
	};
	return null;
};

/**
 * Find index of player by the player id
 *
 * @param {Number} id Id of player
 * @returns Index of player
 * @type Number
 */
function indexOfByPlayerId(id) {

	for (var i in players) {
		if(players[i].id == id) {
			return i;
		};
	};

	return null;
};

/**
 * Format message using game protocols
 *
 * @param {String} type Type of message
 * @param {Object} args Content of message
 * @returns Formatted message encoded with BiSON. Eg. {type: "update", message: "Hello World"}
 * @type String
 */
function formatMessage(type, args) {
	var msg = {type: type};

	for (var arg in args) {
		// Don't overwrite the message type
		if (arg != "type")
			msg[arg] = args[arg];
	};
	
	return BISON.encode(msg);
};

String.prototype.format = function (args) {
	var str = this;
	return str.replace(String.prototype.format.regex, function(item) {
		var intVal = parseInt(item.substring(1, item.length - 1));
		var replace;
		if (intVal >= 0) {
			replace = args[intVal];
		} else if (intVal === -1) {
			replace = "{";
		} else if (intVal === -2) {
			replace = "}";
		} else {
			replace = "";
		}
		return replace;
	});
};
String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");