#!/usr/bin/env node

process.title = "SpaceWars";

var Datastore = require('nedb')
var db = new Datastore({ filename: 'data/datatore_one', autoload: true });

var io = require('socket.io')();
var util = require("util");
var UI = require ('./ui.js');

ui = new UI();

var names = require('./random-name');

/* Some of our Stuff */
var Player = require("./Player");
var BISON = require("./bison");
var Ship = require("./ship");

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
// db.insert([{user_name: "user_a", password: "open-the-gate", name: "Pete", ships: [
// 	{name: "The_Flying_Cat", plot: {x: 10, y: 15}, speed: 1230}, 
// 	{name: "Dark_Kitten_Matter" , plot: {x: 20, y: 35}, speed: 10}]}], function (err, newDocs) {
//   // Two documents were inserted in the database
//   // newDocs is an array with these documents, augmented with their _id
// });

players = [];
ships   = [];
planets = [];

io.serveClient(false);
io.listen(8000);
ui.setFooter("Server listening on 8000");
var serverStart = new Date().getTime();

var server = {

	/**
	 *
	 */
	pingPlayer: function(socket, data) {
		var player = server.getPlayerBySocketID(socket.id);

		if (!player) {
			ui.log(util.format("ERROR: Unable to find player to ping: ", socket.id));
			return false;
		};
		
		var newTimestamp = new Date().getTime();
		var ping = newTimestamp-data.t;
		player.age = 0;
		player.ping = ping;
		
		// Send ping back to player
		socket.send(server.formatMessage(MESSAGE_TYPE_PING, {i: player.id, n: player.name, p: ping}));
		
		// Broadcast ping to other players
		server.broadcast_excluded(socket.id, server.formatMessage(MESSAGE_TYPE_UPDATE_PING, {i: socket.id, p: ping}));

		// Request a new ping
		server.sendPing(socket);
		return true;
	},

	/**
	 *
	 */
	sendPing: function(client) {
		setTimeout(function ping_client() {
			var timestamp = new Date().getTime();
			client.send(server.formatMessage(MESSAGE_TYPE_PING, {t: timestamp.toString()}));
		}, 3000);
	},

	/**
	 *
	 */
	authPlayer: function(socket, data) {
		db.find({ $and: [{user_name: data.u }, {password: data.p}] }, function auth_user(err, res) {
			if (res.length === 1) {
				require('crypto').randomBytes(48, function(ex, buf) {
					var newPlayerData = {i: socket.id, n: names.first() + " " + names.last(), s: res[0].ships, t: buf.toString('hex')}
					socket.send(server.formatMessage(MESSAGE_TYPE_AUTHENTICATION_PASSED, newPlayerData ));
					ui.log(util.format("AUTH SUCCESS: ", data.u, socket.id));

					server.newPlayer(socket, newPlayerData);
				});

			} else {
				socket.send(server.formatMessage(MESSAGE_TYPE_AUTHENTICATION_FAILED));
				ui.log(util.format("AUTH FAIL: ", data.u, socket.id));
			};
		});
	},

	/**
	 *
	 */
	newPlayer: function(socket, data) {
		var player = new Player(socket.id, data.n, data.s, data.t);
		players.push(player);

		// Broadcast new player to all clients, excluding the client.
		server.broadcast_excluded(socket.id, server.formatMessage(MESSAGE_TYPE_NEW_PLAYER, {i: player.id, n: player.name, s: player.ships}));

		// Tell the new player about existing players
		for(var i in players) {
			// Make sure NOT to tell the client about it's self.
			if(players[i].id == socket.id)
				continue;
			socket.send(server.formatMessage(MESSAGE_TYPE_NEW_PLAYER, {i: players[i].id, n: players[i].name, s: players[i].ships}));
		}

		server.sendPing(socket);
		ui.log(util.format("NEW_PLAYER: ", player.name, player.id));
	},

	/**
	 *
	 */
	initPlayerActivityMonitor: function(players, socket) {
		setInterval(function() {
			ui.updatePlayerList(players);
			for(var i in players) {
				var p = players[i];
				if(p == null)
					continue;

				if(p.age > 3){
					ui.log(util.format("CLOSE [TIME OUT]: ", p.name, p.id));

					for(var id in io.sockets.sockets){
						if(p.id == io.sockets.sockets[id].id) {
							io.sockets.sockets[id].disconnect();
						}
					}

					continue;
				}
				p.age += 1;
			}
		}, 5000);
	},

	/**
	 * Returns the player object which matches the the socket connection ID.
	 *
	 * @param {String} id Socket ID
	 * @returns Player object
	 * @type Player
	 */
	getPlayerBySocketID: function(id) {
	    for(var p in players){
	        if(players[p].id == id)
	            return players[p];
	    };
	    return null;
	},

	/**
	 * Sends message to all connections excluding listed.
	 *
	 * @param {String} exclude Socket ID to exclude.
	 * @param {String} msg Formatted message encoded with BiSON to send to all conenctions.
	 * @returns Void
	 */
	broadcast_excluded: function(exclude, msg){
		for(var i in io.sockets.sockets){
			if(exclude != io.sockets.sockets[i].id) {
				io.sockets.sockets[i].send(msg);
			}
		}
	},

	/**
	 * Format message using game protocols.
	 *
	 * @param {String} type Type of message
	 * @param {Object} args Content of message
	 * @returns Formatted message encoded with BiSON. Eg. {type: "update", message: "Hello World"}
	 * @type String
	 */
	formatMessage: function(type, args) {
		var msg = {type: type};

		for (var arg in args) {
			// Don't overwrite the message type
			if (arg != "type")
				msg[arg] = args[arg];
		};
		
		return BISON.encode(msg);
	}
};

server.initPlayerActivityMonitor(players, io);

io.on('connection', function onConnection(client) {
	ui.log("CONNECT: " + client.id);

    client.on('message', function handleMessage(msg) {
		var data = BISON.decode(msg);
		if (data.type) {
			switch (data.type) {
				case MESSAGE_TYPE_PING:
					server.pingPlayer(client, data);
					break;
				case MESSAGE_TYPE_AUTHENTICATE:
					server.authPlayer(client, data);
					break;
			};
		} else {
			ui.log("Invalid Message protocol");
		};
    });

	client.on("disconnect", function onDisconnect() {
		var removePlayer = server.getPlayerBySocketID(this.id);

		if (!removePlayer) {
			ui.log("Player not found: ", this.id);
			return;
		};
		
		ui.log(util.format("Player has disconnected: ", removePlayer.name, this.id));
		players.splice(players.indexOf(removePlayer), 1);
		// Broadcast removed player to connected socket clients
		io.send(server.formatMessage(MESSAGE_TYPE_REMOVE_PLAYER, {i: this.id}));
	});
});