#!/usr/bin/env node

process.title = "SpaceWars";

var Datastore = require('nedb')
var playersDB = new Datastore({ filename: 'data/players', autoload: true });
var shipsDB = new Datastore({ filename: 'data/ships', autoload: true });

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
    UPDATE_SHIP : 9, 
	ERROR : -1,
}

/* TODO: Setup auto ID */
// playersDB.insert(
// 	[
// 		{id: "1", user_name: "user_a", password: "open-the-gate", name: "Pete"},
// 		{id: "2", user_name: "user_b", password: "open-the-gate", name: "Luke"}
// 	], function (err, newDocs) {
// });

// shipsDB.insert(
// 	[	
// 		{id: "1", owner: "2", name: "FR00001", plot: {x: 0, y: 0}, speed: 1000},
// 		{id: "2", owner: "1", name: "The_Flying_Cat", plot: {x: 10, y: 15}, speed: 1230}, 
// 		{id: "3", owner: "1", name: "Dark_Kitten_Matter" , plot: {x: 20, y: 35}, speed: 10}
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

	init: function(){
		ui.log("Loading Players");
		playersDB.find({}, function (err, res) {
			if (res.length != 0) {
				for(var i in res){
					players.push(new Player(res[i].id, null, null, res[i].name, res[i].user_name));
				}
			} else {
				ui.log("ERROR: Unable to load players.");
				return false;
			};
		});

		ui.log("Loading Ships");
		shipsDB.find({}, function (err, res) {
			if (res.length != 0) {
				for(var i in res){
					ships.push(new Ship(res[i].id, res[i].owner, res[i].name, res[i].plot, res[i].speed));
				}
			} else {
				ui.log("ERROR: Unable to load ships.");
				return false;
			};
		});
		return true;
	},

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
		socket.send(server.formatMsg(msgType.PING, {id: data.id, i: player.id, n: player.name, p: ping}));
		
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
	authPlayer: function(socket, messageID, userName, password) {
		playersDB.find({ $and: [{user_name: userName }, {password: password}] }, function auth_user(err, res) {
			if (!err && res.length === 1) {
					// TODO: Maybe move this into the player class. player.getAuthToken(); ?
					var authToken = server.generateToken();
					var p = server.getPlayerByUserName(userName);
					if(!p){
						return;
					}
					p.authToken = authToken;
					p.socket = socket.id;

					socket.send(server.formatMsg(msgType.AUTH, {id: messageID, code: 1.1, t:  authToken }));
					ui.log(util.format("AUTH SUCCESS: %s [%s]", userName, socket.id));
			} else {
				socket.send(server.formatMsg(msgType.AUTH, {id: messageID, code: 0.1 }))
				ui.log(util.format("AUTH FAIL: ", data.id, data.u, socket.id));
			};
		});
	},



	generateToken: function(){
		var rtn = null;
		require('crypto').randomBytes(48, function(ex, buf){ rtn = buf.toString('hex')});
		return rtn;
	},

	/**
	 *
	 */
	newPlayer: function(socket, data) {
		// var player = new Player(data.id, socket.id, data.t, data.n);
		// players.push(player);
		
		// for(var i in data.s){
		// 	ships.push(data.s[i]);
		// }
		// server.sendPing(socket);
		ui.log("newPlayer: Dont call me");
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

				if(p.socket == null)
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

	updateShipLoc: function(socket, messageID, shipID, waypoint){
		// TODO: Confirm move is legal.
		for(var i in ships){
			if(ships[i].id == shipID){
				ui.log("TODO: Call ship.setWaypoint.");
				server.broadcast_all(server.formatMsg(msgType.UPDATE_SHIP, {id: messageID, s: {id: shipID, w: waypoint} }));
				return;
			}
		}

		// If we reach these statements then something has gone wrong.
		socket.send(formatMsg(msgType.UPDATE_SHIP, {code: 0.2, id: messageID}));
		ui.log("ERROR: updateShiploc unable to find shipID in memory.");
	},

	updateUser: function(socks, data){
		var p = server.getPlayerByAuthToken(data.t);
		var playerShips = server.getShipsByPlayer(data.t);


		socks.send(server.formatMsg(msgType.UPDATE_USER, {id: data.id, user: {id: data.dbid, n: p.name}, s: playerShips}));

	},

	updateSpace: function(socks, data){
		// TODO: Remove non-relevant data from the ships to streamline resources.
		socks.send(server.formatMsg(msgType.UPDATE_SPACE, {id: data.id, s: ships}));
	},

	getShipsByPlayer: function(authToken) {
		var p = server.getPlayerByAuthToken(authToken);
		var rtn = [];
		for(var i in ships){
			if(ships[i].owner = p.dbid){
				rtn.push(ships[i]);
			}
		}
		ui.log("shitps by player: "+ rtn)
		return rtn;
	},

	getPlayerByUserName: function(userName) {
		for(var i in players){
			if(players[i].userName == userName){
				return players[i];
			}
		}
		ui.log("ERROR: Unable to find player by UserName.");
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

	getPlayerByAuthToken: function(authToken) {
	    for(var p in players){
	        if(players[p].authToken == authToken)
	            return players[p];
	    };
	    ui.log(util.format("ERROR: Unable to find Player by token: %s", authToken ))
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

	broadcast_all: function(msg){
		for(var i in io.sockets.sockets){
			io.sockets.sockets[i].send(msg);
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

if(server.init()){
	ui.log("Data loaded into memory.");
}
server.initPlayerActivityMonitor(players, io);
server.initServerMonitor(players, io);

io.on('connection', function onConnection(client) {
	ui.log("CONNECT: " + client.id);

    client.on('message', function handleMessage(msg) {
		var data = BISON.decode(msg);
		if (data.type) {
			switch (data.type) {
				case msgType.PING:
					// server.pingPlayer(client, data);
					break;
				case msgType.AUTH:
					ui.log("Auth Player");
					server.authPlayer(client, data.id, data.u, data.p);
					break;
				case msgType.UPDATE_USER:
					ui.log("Update User");
					server.updateUser(client, data)
					break;
				case msgType.UPDATE_SPACE:
					ui.log("Update Space");
					server.updateSpace(client, data);
					break;
				case msgType.UPDATE_SHIP:
					ui.log("Update ship");
					server.updateShipLoc(client, data.id, data.s.id, data.s.w);
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