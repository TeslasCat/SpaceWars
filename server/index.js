#!/usr/bin/env node

process.title = "SpaceWars";

var Datastore = require('nedb')
var db = new Datastore({ filename: 'data/players', autoload: true });

var io = require('socket.io')();
var util = require("util");

var names = require('./random-name');

/* Some of our Stuff */
var UI = require ('./ui.js');
var Player = require("./Player");
var BISON = require("./bison");
var Ship = require("./ship");

"use strict";

/**
 * Message protocols
 */
var msgType = {
    PING : 1,
    UPDATE_PING : 2,
    UPDATE_USER : 3,
    UPDATE_PLAYER : 4,
    REMOVE_PLAYER : 5,
    UPDATE_SPACE : 6,
    AUTH : 8,
    MOVE_SHIP : 9, 
	ERROR : -1,
}

/* Setup example users */
// db.insert([{user_name: "user_a", password: "open-the-gate", name: "Pete", ships: [
// 	{id: "2", name: "The_Flying_Cat", plot: {x: 10, y: 15}, speed: 1230}, 
// 	{id: "3", name: "Dark_Kitten_Matter" , plot: {x: 20, y: 35}, speed: 10}]}
// 	], function (err, newDocs) {
// });

// db.insert([{user_name: "user_b", password: "open-the-gate", name: "Luke", ships: [
// 	{id: "1", name: "FR00001", plot: {x: 0, y: 0}, speed: 1000}]}
// 	], function (err, newDocs) {
// });


ui = new UI();
players = [];
planets = [];
ships = [];

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
		socket.send(server.formatMsg(msgType.TYPE_PING, {id: data.id, i: player.id, n: player.name, p: ping}));
		
		// Broadcast ping to other players
		// server.broadcast_excluded(socket.id, server.formatMsg(msgType.UPDATE_PING, {i: socket.id, p: ping}));

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
			client.send(server.formatMsg(msgType.PING, { t: timestamp.toString()}));
		}, 3000);
	},

	/**
	 *
	 */
	authPlayer: function(socket, data) {
		db.find({ $and: [{user_name: data.u }, {password: data.p}] }, function auth_user(err, res) {
			if (res.length === 1) {
				require('crypto').randomBytes(48, function(ex, buf) {
					var newPlayerData = {i: socket.id, n: res[0].name, s: res[0].ships, t: buf.toString('hex')}

					socket.send(server.formatMsg(msgType.AUTH, {id: data.id, code: 1.1, t: newPlayerData.t }));
					ui.log(util.format("AUTH SUCCESS: ", data.id, data.u, socket.id));

					server.newPlayer(socket, newPlayerData);
				});

			} else {
				socket.send(server.formatMsg(msgType.AUTH, {id: data.id, code: 0.1 }))
				ui.log(util.format("AUTH FAIL: ", data.id, data.u, socket.id));
			};
		});
	},

	/**
	 *
	 */
	newPlayer: function(socket, data) {
		var player = new Player(socket.id, data.n, data.t);
		players.push(player);

		socket.send(server.formatMsg(msgType.UPDATE_USER, {id: data.id, i: player.id, n: player.name, s: data.s}));
		
		for(var i in data.s){
			ships.push(data.s[i]);
		}

		// Tell the new player about existing players
		for(var i in players) {
			// Make sure NOT to tell the client about it's self.
			if(players[i].id == socket.id)
				continue;
			socket.send(server.formatMsg(msgType.UPDATE_USER, {id: data.id, i: players[i].id, n: players[i].name, s: data.s}));
		}

		server.sendPing(socket);
		ui.log(util.format("UPDATE_USER: ", data.id, player.name, player.id));
	},

	/**
	 * Starts the Server Monitoring functions.
	 *
	 * @param {Object} players Array of connected players.
	 * @param {Object} socks Socket IO connection object.
	 * @returns Nothing.
	 * @type Void.
	 */
	initPlayerActivityMonitor: function(players, socks) {
		setInterval(function() {
			for(var i in players) {
				var p = players[i];
				if(p == null)
					continue;

				/* If player does not respond in 30s */
				if(p.age > 6){
					ui.log(util.format("CLOSE [TIME OUT]: ", p.name, p.id));

					for(var id in socks.sockets.sockets){
						if(p.id == socks.sockets.sockets[id].id) {
							socks.sockets.sockets[id].disconnect();
						}
					}

					continue;
				}
				p.age += 1;
			}
		}, 5000); /* 5s */
	},

	/**
	 *
	 */
	// initObjectActivity: function(objects, socks) {
	// 	setInterval(function() {
	// 		// ui.log(JSON.stringify(objects))
	// 	}, 1000); /* 1s */
	// },

	updateShipLoc: function(playerID, shipID, plot){
		// TODO: Confirm move is legal.
		ui.log("Player: " +playerID)
		ui.log("Ship: " + shipID)
		ui.log("Plot: " +plot.x + " " + plot.y)

		for(var i in ships){
			if(ships[i].id == shipID){
				ui.log(util.format("Ship moves %s to [%s|%s]", ships[i].name, plot.x, plot.y));
				server.broadcast_excluded(playerID, server.formatMsg(msgType.MOVE_SHIP, { s: ships[i].id, l: plot }));
			}
		}
	},

	/**
	 * Starts the Server Monitoring functions.
	 *
	 * @param {Object} players Array of connected players.
	 * @param {Object} socks Socket IO connection object.
	 * @returns Nothing.
	 * @type Void.
	 */
	initServerMonitor: function(players, socks) {
		setInterval(function() {
			ui.updatePlayerList(players);
		}, 1000); /* 1s */
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
	    ui.log(util.format("ERROR: Unable to find Player: %s", id ))
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
	formatMsg: function(type, args) {
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
// server.initObjectActivity(objects, io);
server.initServerMonitor(players, io);

io.on('connection', function onConnection(client) {
	ui.log("CONNECT: " + client.id);

    client.on('message', function handleMessage(msg) {
		var data = BISON.decode(msg);
		if (data.type) {
			switch (data.type) {
				case msgType.PING:
					server.pingPlayer(client, data);
					break;
				case msgType.AUTH:
					server.authPlayer(client, data);
					break;
				case msgType.MOVE_SHIP:
					server.updateShipLoc(client.id, data.i, data.p);
					break;
				case msgType.ERROR: 
					ui.log(data.t);
					break;
			};
		} else {
			client.send(server.formatMsg(msgType.ERROR));
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
		io.send(server.formatMsg(msgType.REMOVE_PLAYER, {i: this.id}));
	});
});