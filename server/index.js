#!/usr/bin/env node

process.title = "SpaceWars";

var app = require('http').createServer();
var io = require('socket.io')(app);
var util = require("util");

/* 
var config = require('config');
var colors = require('colors');
*/

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


function init() {
	players = [];
	app.listen(8000);
	util.log("Server listening on 8000");

	setEventHandlers();
	initPlayerActivityMonitor(players, io);

};

var setEventHandlers = function() {
	io.on('connection', onSocketConnection);
}

function onSocketConnection(client) {

	util.log("CONNECT: ", client.id);
    
    client.on("message", function(msg) { 
		var data = BISON.decode(msg);
		if (data.type) {
			switch (data.type) {
				case MESSAGE_TYPE_PING:
					var player = players[indexOfByPlayerId(client.id)];
					
					if (player == null) {
						break;
					};
					
					player.age = 0; // Player is active
					
					var newTimestamp = new Date().getTime();
					util.log("Round trip: "+(newTimestamp-data.ts)+"ms");
					var ping = newTimestamp-data.t;
					util.log(ping)
					
					// Send ping back to player
					client.emit(formatMessage(MESSAGE_TYPE_PING, {i: player.id, n: player.name, p: ping}));
					
					// Broadcast ping to other players
					client.broadcast.emit(formatMessage(MESSAGE_TYPE_UPDATE_PING, {i: client.id, p: ping}));
					
					// Log ping to server after every 10 seconds
					if ((newTimestamp-serverStart) % 10000 <= 3000) {
						util.log("PING ["+client.id+"]: "+ping);
					};
					
					// Request a new ping
					sendPing(client);
					break;
				case MESSAGE_TYPE_NEW_PLAYER:
					var name = client.id;
					var player = new Player(client.id, 0, 0, name);
					client.emit(formatMessage(MESSAGE_TYPE_NEW_PLAYER, {x: player.x, y: player.y, n: player.name}));
					players.push(player);
					sendPing(client);

					util.log("NEW_PLAYER: ", name);
					break;
			};
		} else {
			util.log("Invalid Message protocol");
		};
    });

	client.on("disconnect", onClientDisconnect);
};

/* Handlers Functions */
function onClientDisconnect(client) {
	util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.id);

	// Player not found
	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);

	// Broadcast removed player to connected socket clients
	io.emit(formatMessage(MESSAGE_TYPE_REMOVE_PLAYER, {i: client.id}));
	
};

function initPlayerActivityMonitor(players, socket) {
	// Should probably stop this function from running if there are no players in the game
	setInterval(function() {
		var playersLength = players.length;
		for (var i = 0; i < playersLength; i++) {
			var player = players[i];
			
			if (player == null) {
				continue;
			}
			
			// sendPing(player);

			// If player has been idle for over 30 seconds
			// if (player.age > 10) {
			if (player.age > 3) {
				socket.emit(formatMessage(MESSAGE_TYPE_REMOVE_PLAYER, {i: player.id}));
				
				util.log("CLOSE [TIME OUT]: "+player.id);
				
				/* TODO: Update this */
				// socket.manager.find(player.id, function(client) {
				// 	client.close(); // Disconnect player for being idle
				// });
				
				players.splice(indexOfByPlayerId(player.id), 1);
				i--;
				continue;
			};
			
			player.age += 1; // Increase player age due to inactivity
		};
	}, 3000);	
};


function sendPing(client) {
	setTimeout(function() {
		var timestamp = new Date().getTime();
		client.send(formatMessage(MESSAGE_TYPE_PING, {t: timestamp.toString()}));
	}, 3000);
};

/**
 * Find player by the player name
 *
 * @param {String} name Name of player
 * @returns Player object
 * @type Player
 */
function playerByName(name) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].name == name)
			return players[i];
	};	
};

/**
 * Find player by the player id
 *
 * @param {Number} id Id of player
 * @returns Player object
 * @type Player
 */
function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};	
};

/**
 * Find index of player by the player id
 *
 * @param {Number} id Id of player
 * @returns Index of player
 * @type Number
 */
function indexOfByPlayerId(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return i;
		};
	};	
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

/* RUN */
init();