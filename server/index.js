#!/usr/bin/env node

process.title = "SpaceWars";

var Datastore = require('nedb')
var db = new Datastore({ filename: 'datatore_one', autoload: true });

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
// var MESSAGE_TYPE_SET_COLOUR = 4;
// var MESSAGE_TYPE_UPDATE_PLAYER = 5;
var MESSAGE_TYPE_REMOVE_PLAYER = 6;
var MESSAGE_TYPE_AUTHENTICATION_PASSED = 7;
var MESSAGE_TYPE_AUTHENTICATION_FAILED = 8;
var MESSAGE_TYPE_AUTHENTICATE = 9;
var MESSAGE_TYPE_ERROR = 10;
// var MESSAGE_TYPE_ADD_BULLET = 11;
// var MESSAGE_TYPE_UPDATE_BULLET = 12;
// var MESSAGE_TYPE_REMOVE_BULLET = 13;
// var MESSAGE_TYPE_KILL_PLAYER = 14;
// var MESSAGE_TYPE_UPDATE_KILLS = 15;
// var MESSAGE_TYPE_REVIVE_PLAYER = 16;

/* Setup example users */


// db.insert([{user_name: "user_a", password: "open-the-gate", x: "10", y: "15", name: "Pete"}], function (err, newDocs) {
//   // Two documents were inserted in the database
//   // newDocs is an array with these documents, augmented with their _id
// });

players = [];
ships   = [];
planets = [];

io.serveClient(false);
io.listen(8000);
util.log("Server listening on 8000");
var serverStart = new Date().getTime();


initPlayerActivityMonitor(players, io);

io.on('connection', function on_connection(client) {
	util.log("CONNECT: " + client.id);

    client.on('message', function handle_message(msg) {
		var data = BISON.decode(msg);
		if (data.type) {
			switch (data.type) {
				case MESSAGE_TYPE_PING:
					var player = getPlayerBySocketID(client.id);

					if (!player) {
						util.log(util.format("ERROR: Unable to find player to ping: ", client.id));
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
					// io.send(formatMessage(MESSAGE_TYPE_UPDATE_PING, {i: client.id, p: ping}));
					
					// ERROR: Broadcasting Players

					// Log ping to server after every 10 seconds
					if ((newTimestamp-serverStart) % 10000 <= 3000) {
						util.log(util.format("PING [%s - %s]: %s", client.id, player.name, ping));
					};
					
					// Request a new ping
					sendPing(client);
					break;
				case MESSAGE_TYPE_AUTHENTICATE:
					db.find({ $and: [{user_name: data.u }, {password: data.p}] }, function auth_user(err, res) {
						if (res.length === 1) {
							client.send(formatMessage(MESSAGE_TYPE_AUTHENTICATION_PASSED, {i: client.id, x: res[0].x, y: res[0].y, n: res[0].name} ));
							util.log(util.format("AUTH SUCCESS: ", data.u, client.id));
						} else {
							client.send(formatMessage(MESSAGE_TYPE_AUTHENTICATION_FAILED));
							util.log(util.format("AUTH FAIL: ", data.u, client.id));
						};
					});
					// util.log(d)
				case MESSAGE_TYPE_NEW_PLAYER:
					// Setup new player.
					var player = new Player(client.id, data.n);
					players.push(player);

					// Broadcast new player to all clients, excluding the client.
					broadcast_excluded(client.id, formatMessage(MESSAGE_TYPE_NEW_PLAYER, {i: player.id, n: player.name}));

					// Tell the new player about existing players
					for(var i in players) {
						// Make sure NOT to tell the client about it's self.
						if(players[i].id == client.id)
							continue;
						client.send(formatMessage(MESSAGE_TYPE_NEW_PLAYER, {i: players[i].id, n: players[i].name}));
					}

					sendPing(client);
					util.log(util.format("NEW_PLAYER: ", player.name, player.id));
					break;
			};
		} else {
			util.log("Invalid Message protocol");
		};
    });

	client.on("disconnect", function() {
		var removePlayer = getPlayerBySocketID(this.id);

		if (!removePlayer) {
			util.log("Player not found: ", this.id);
			return;
		};
		
		util.log(util.format("Player has disconnected: ", removePlayer.name, this.id));
		players.splice(players.indexOf(removePlayer), 1);
		// Broadcast removed player to connected socket clients
		io.send(formatMessage(MESSAGE_TYPE_REMOVE_PLAYER, {i: this.id}));

	});
});

function initPlayerActivityMonitor(players, socket) {
	setInterval(function() {		
		for(var i in players) {
			var p = players[i];
			if(p == null)
				continue;

			if(p.age > 3){
				util.log(util.format("CLOSE [TIME OUT]: ", p.name, p.id));

				for(var id in io.sockets.sockets){
					if(p.id == io.sockets.sockets[id].id) {
						io.sockets.sockets[id].disconnect();
					}
				}

				continue;
			}
			p.age += 1;
		}

		// var p = "PLAYERS: ";
		// for(var i in players){
		// 	p += players[i].id + " "
		// }
		util.log(util.format("Player Count: ", players.length))

	}, 5000);
};

/* 
 * Helper Functions 
 */
function sendPing(client) {
	setTimeout(function ping_client() {
		var timestamp = new Date().getTime();
		client.send(formatMessage(MESSAGE_TYPE_PING, {t: timestamp.toString()}));
	}, 3000);
};


function getPlayerBySocketID(id) {
    for(var p in players){
        if(players[p].id == id)
            return players[p];
    };
    return null;
}

function broadcast_excluded(exclude, msg){
	for(var i in io.sockets.sockets){
		if(exclude != io.sockets.sockets[i].id) {
			io.sockets.sockets[i].send(msg);
			// util.log(io.sockets.sockets[i])
		}
	}
}

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