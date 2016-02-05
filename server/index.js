#!/usr/bin/env node
"use strict";

process.title = "SpaceWars";

var io = require('socket.io')();
var util = require("util");
var names = require('./random-name');
var ui = require ('./ui.js');
var Player = require("./Player");
var BISON = require("./bison");
var Ship = require("./ship");

var redis = require("redis");
var db = redis.createClient({port: 6370});

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

var ui = new ui();
var players = [];
var planets = [];
var ships = [];

io.serveClient(false);
io.listen(8000);
ui.setFooter("Server listening on 8000");
var serverStart = new Date().getTime();

var server = {

	init: function(){
		// next_user_id
		// users - username ID
		// auths - authToken ID
		// user:n - socket, username, name, email, password, authToken
		server.register("socket00", "Zim", "Pete", "amail@gmail.com", "windows")
		server.register("socket01", "Xim", "Luke", "soemthing@gmail.com", "cat");
		server.register("socket02", "Marven", "James", "specifc@gmail.com", "dog");
		server.register("socket03", "Steve", "John", "apples@gmail.com", "something");

    	// next_ship_id
    	// ships - name ID
    	// shipsOwner - owner ID 
		// ship:n - owner, name, size, speed, plot, viewDistane, shape
		server.newShip(1, "Dark_Kitten_Matter", 1, 1000, {x: 0, y: 0}, 10, [[-0.5, 1], [0, -1], [0.5, 1]]);
	},

	/**
	 *
	 */
	newShip: function(owner, name, size, speed, plot, viewDistane, shape){
		db.exists("ships", name, function(err, res){ 
			if(res) {
				ui.log("Ship already exists.");
				return false
			}
			db.incr("next_ship_id", function(err, ID){
				// Serialise plot and shape data before placing in DB.
				db.hmset("ship:"+ID, "owner", owner, "name", name, "size", size, "speed", speed, "plot", plot, "viewDistane", viewDistane, "shape", shape);
				db.hset("shipsOwner", owner, ID);
				db.hset("ships", name, ID);
				ui.log("NEWSHIP: " + name + " " + ID);
			});
		});
	},

	/**
	 *
	 */
	register: function(socket, username, name, email, password){
		// Check username exists.
		db.exists("users", username, function(err, res){ 
			if(res) {
				ui.log("Account already exists.");
				return false
			}

			db.incr("next_user_id", function(err, ID){
				var authToken = require('crypto').randomBytes(256).toString('hex');
				db.hmset("user:"+ID, "socket", socket, "username", username, "name", name, "email", email, "password", password, "authToken", authToken);
				db.hset("users", username, ID);
				db.hset("auths", authToken, ID);
				ui.log("REGISTER: " + username);
			});
		});
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
		db.hmget("users", userName, function(err, ID){
			if(ID <= 0 || err){
				socket.send(server.formatMsg(msgType.AUTH, {id: messageID, code: 0.1 }));
				ui.log("Unable to Auth.");
				return
			}

			db.hgetall("user:"+ID, function(err, res){
				if(!err && res.password == password){
					db.hmset("user:"+ID, "socket", socket.id);
					socket.send(server.formatMsg(msgType.AUTH, {id: messageID, code: 1.1, t:  res.authToken }));
					ui.log(util.format("AUTH SUCCESS: %s [%s]", res.username, res.email));
				}else{
					socket.send(server.formatMsg(msgType.AUTH, {id: messageID, code: 0.1 }));
					ui.log("Unable to Auth.");
				}
			});
		});
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

				if(p.socket == null){
					continue;
				}

				/* If player does not respond in 60s */
				if(p.age > 12){
					ui.log(util.format("CLOSE [TIME OUT]: ", p.name, p.socket));

					for(var i in socks.sockets.sockets){
						if(p.socket == socks.sockets.sockets[i].id) {
							socks.sockets.sockets[i].disconnect();
						}
					}

					continue;
				}
				p.age += 1;
			}
		}, 5000); /* 5s */
	},

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

	updateUser: function(socks, messageID, authToken){
		var p = server.getPlayerByAuthToken(authToken);

		var userShips = ships.filter(function(ship){
			if(ship.owner == p.id){
				return true;
			}
		});

		socks.send(server.formatMsg(msgType.UPDATE_USER, {id: messageID, user: {id: p.id, n: p.name}, s: userShips}));

	},

	updateSpace: function(socks, data){
		// TODO: Remove non-relevant data from the ships to streamline resources.
		socks.send(server.formatMsg(msgType.UPDATE_SPACE, {id: data.id, s: ships}));
	},

	getShipsByPlayer: function(authToken) {
		var p = server.getPlayerByAuthToken(authToken);
		var rtn = [];
		for(var i in ships){
			if(ships[i].owner = p.id){
				rtn.push(ships[i]);
			}
		}
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

	isOnline: function(player){
		if(player.socket)
			return true
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
			ui.updatePlayerList(players.filter(function(p){if(p.socket)return true;}));
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
	        if(players[p].socket == id)
	            return players[p];
	    };
	    ui.log(util.format("ERROR: Unable to find Player by Socket: %s", id ))
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

server.init();
server.initPlayerActivityMonitor(players, io);
server.initServerMonitor(players, io);

io.on('connection', function onConnection(client) {
	ui.log("CONNECT: " + client.id);

    client.on('message', function handleMessage(msg) {
		var data = BISON.decode(msg);
		if (data.type) {

			// replace rubbish ping with this for now.
			var p = server.getPlayerBySocketID(client.id);
			if(p){
				p.age = 0;
			}

			switch (data.type) {
				case msgType.PING:
					ui.log("Recv: PING")
					// server.pingPlayer(client, data);
					break;
				case msgType.REGISTER:
					server.register(client, data.userName, data.name, data.email, data.password);
					break;
				case msgType.AUTH:
					ui.log("Recv: AUTH");
					server.authPlayer(client, data.id, data.u, data.p);
					break;
				case msgType.UPDATE_USER:
					ui.log("Recv: Update User");
					server.updateUser(client, data.id, data.t)
					break;
				case msgType.UPDATE_SPACE:
					ui.log("Recv: Update Space");
					server.updateSpace(client, data);
					break;
				case msgType.UPDATE_SHIP:
					ui.log("Recv: Update ship");
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
		var removePlayer = server.getPlayerBySocketID(client.id);

		if (removePlayer) {
			removePlayer.socket = null;
			ui.log(util.format("Player has disconnected: ", removePlayer.name, this.id));
		};
		
	});
});