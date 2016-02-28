#!/usr/bin/env node
"use strict";

var enviroment = 'dev';

try {
	require("../config/"+enviroment+".server.config");
} catch (e) {
	console.log("Config error: config/"+enviroment+".server.config not found");
	process.exit(1);
}

process.title = "SpaceWars";

var util = require("util");

var names = require('./random-name');
var helper = require("../lib/helper");
global.helper = helper;

var ui = require ('./ui'),
	ui = new ui();
global.ui = ui;
var Player = require("../lib/player");
var BISON = require("./bison");
var Ship = require("../lib/ship");
var Planet = require("../lib/planet");

var redis = require("redis");
var db = redis.createClient(global.config.redis);
global.db = db;

var Game = require("./game"),
	game = new Game();


var http = require("./HTTPserver");
http = new http(global.config);

var io = require('socket.io')(http.server);

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

var serverStart = helper.now();

db.on("error", function (err) {
    ui.log(err);
}).on("connect", function (err) {
    ui.log("Reddis connected");
});


var server = {

	init: function(){

		/* Main event handling */
		io.on('connection', function onConnection(client) {
		    client.on('message', function handleMessage(msg) {
				var data = BISON.decode(msg);
				if (data.type) {
					switch (data.type) {
						case msgType.REGISTER:
							ui.log("Recv: Register");
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
						case msgType.PING:
							ui.log("Recv: PING")
							// server.pingPlayer(client, data);
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
				db.del("connections", client.id);
			});
		});

		/* Server management stuff here */
		setInterval(function() {
			db.hgetall("connections", function(err, res){
				var playersOnline = [];
				for(var con in res){
					// server.getPlayerBySocketID(con);
					playersOnline.push({name: con, ping: res[con]})
				}
				ui.updatePlayerList(playersOnline);
			});

		}, 1000); /* 1s */

		// TODO: Redis level user age. Get all connections which are greater than x 
		
		/* Player activity monitoring */
		// setInterval(function() {
		// 		ui.log(util.format("CLOSE [TIME OUT]: " + expiredSocket ));

		// 		for(var i in io.sockets.sockets){
		// 			if(expiredSocket == io.sockets.sockets[i].id) {
		// 				io.sockets.sockets[i].disconnect();
		// 			}
		// 		}
			
		// }, 5000); /* 5s */

		// BUG: Can return the IPv6 address, will URI is wrong.
		ui.setFooter('SpaceWars listening at http://' + http.server.address().address + ':' + http.server.address().port);

		/* Example Data */
		// Only add sample data if required
		db.keys("user:*", function(err, keys) {
			if (keys.length) return;

			// Generate users
			server.register("Zim", "Pete", "amail@gmail.com", "windows")
			server.register("Xim", "Luke", "something@gmail.com", "cat");
			server.register("Marven", "James", "specific@gmail.com", "dog");
			server.register("Steve", "John", "apples@gmail.com", "something");
			server.register("user_b", "Zorg", "zorg@empire.com", "open-the-gate");

			// Generate ships
			game.createObject('ship', {owner: 5, name: "Dark_Kitten_Matter", size: 1, speed: 1000, plot: {x: 0, y: 0}, viewDistance: 10, shape: [[-0.5, 1], [0, -1], [0.5, 1]]}, function(s) { if (s) global.ui.log('Ship created'); else global.ui.log('Ship already exists')});
			game.createObject('ship', {owner: 5, name: "Intrepid_Puss", size: 1, speed: 1000, plot: {x: -10, y: -30}, viewDistance: 10, shape: [[-0.5, 1], [0, -1], [0.5, 1]]}, function(s) { if (s) global.ui.log('Ship created'); else global.ui.log('Ship already exists')});
			game.createObject('ship', {owner: 2, name: "FR00001", size: 1, speed: 1000, plot: {x: 10, y: 20}, viewDistance: 10, shape: [[-0.5, 1], [0, -1], [0.5, 1]]}, function(s) { if (s) global.ui.log('Ship created'); else global.ui.log('Ship already exists')});
			game.createObject('ship', {owner: 2, name: "FR00002", size: 1, speed: 1000, plot: {x: 30, y: 90}, viewDistance: 10, shape: [[-0.5, 1], [0, -1], [0.5, 1]]}, function(s) { if (s) global.ui.log('Ship created'); else global.ui.log('Ship already exists')});

	  	    // Generate random planets
		    var tmpPlanet;
		    for (var i = 0; i < 100; i++) {

		        var distance = 1,
		            tmpPlanet,
		            n = 0;
		        while (distance < 500) {
		            n++
		            if (n > 10) break;
		            tmpPlanet = new Planet(null, 'Planet' + i, { x: 2000 - helper.rand(0, 4000), y: 1000 - helper.rand(0, 2000)}, helper.rand(5, 30));

		            // Find closest planets
		            // var closest = helper.getClosestPlanet(tmpPlanet.getPlot(), tmpPlanet.radius);
		            // if (closest) {
		            //     distance = closest.distance;
		            // } else {
		            //     distance = 1000;
		            // }
		        }

		        game.createObject('planet', {name: tmpPlanet.name, radius: tmpPlanet.radius, plot: tmpPlanet.plot}, function(s) { if (s) global.ui.log('Planet created'); else global.ui.log('Planet already exists')});
		    }
		});
		/* Example Data */
	},

	/**
	 * PLAYER REGISTRATION
	 */
	register: function(username, name, email, password){
		// Check username exists.
		db.hexists("users", username, function(err, res){ 
			if(res) {
				ui.log("Account already exists [" + username + "]");
				return false
			}

			db.incr("next_user_id", function(err, ID){
				var authToken = require('crypto').randomBytes(256).toString('hex');
				db.hmset("user:"+ID, "username", username, "name", name, "email", email, "password", password, "authToken", authToken);
				db.hset("users", username, ID);
				db.hset("auths", authToken, ID);
				ui.log("REGISTER: " + username);
			});
		});
	},

	/**
	 * AUTH PLAYER 
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
					db.hset("connections", socket.id, ID);
					socket.send(server.formatMsg(msgType.AUTH, {id: messageID, code: 1.1, t:  res.authToken }));
					ui.log(util.format("AUTH SUCCESS: %s [%s]", res.username, res.email));

					// Store user details in socket
					socket.user = res;
					socket.user.id = ID;
				}else{
					socket.send(server.formatMsg(msgType.AUTH, {id: messageID, code: 0.1 }));
					ui.log("Unable to Auth.");
				}
			});
		});
	},

	/**
	 * UPDATE USER
	 */
	updateUser: function(socks, messageID, authToken){
		db.hget("auths", authToken, function(err, ID){
			db.hgetall("user:"+ID, function(err, user) {
				var ships = game.getShips(ID);
				socks.send(server.formatMsg(msgType.UPDATE_USER, {id: messageID, user: {id: ID, n: user.name}, s: ships}));
			});
		});
	},

	/**
	 * UPDATE SPACE
	 */
	updateSpace: function(socks, data) {
		socks.send(server.formatMsg(msgType.UPDATE_SPACE, {id: data.id, s: game.getShips(), p: game.getPlanets()}));
	},

	/**
	 * UPDATE SHIP LOCATION
	 */
	updateShipLoc: function(socket, messageID, shipID, waypoint) {
		// Lookup ship
		var ship = game.getShip(shipID);

		// Check ship exists
		if (!ship) {
			socket.send(server.formatMsg(msgType.UPDATE_SHIP, {code: 0.3, id: messageID}));
			ui.log("ERROR: ship doesn't exist.");
			return;
		}

		// Check user owns ship
		if (ship.owner != socket.user.id) {
			socket.send(server.formatMsg(msgType.UPDATE_SHIP, {code: 0.2, id: messageID, s: {id: shipID, plot: {x: ship.x, y: ship.y}}}));
			ui.log("ERROR: ship not owned by user.");
			return;
		}

		waypoint = ship.setWaypoint(waypoint, true);

		server.broadcast_all(server.formatMsg(msgType.UPDATE_SHIP, {id: messageID, s: {id: shipID, plot: {x: ship.plot.x, y: ship.plot.y}, w: waypoint} }));
		ui.log("Moving ship.");
	},

	/**
	 *  PING Players
	 */
	// pingPlayer: function(socket, data) {
	// 	var player = server.getPlayerBySocketID(socket.id);

	// 	if (!player) {
	// 		ui.log(util.format("ERROR: Unable to find player to ping: ", socket.id));
	// 		return false;
	// 	};
		
	// 	var newTimestamp = helper.now();
	// 	var ping = newTimestamp-data.t;
	// 	player.age = 0;
	// 	player.ping = ping;
		
	// 	// Send ping back to player
	// 	socket.send(server.formatMsg(msgType.PING, {id: data.id, i: player.id, n: player.name, p: ping}));
		
	// 	// Broadcast ping to other players
	// 	// server.broadcast_excluded(socket.id, server.formatMsg(msgType.UPDATE_PING, {i: socket.id, p: ping}));

	// 	// Request a new ping
	// 	server.sendPing(socket);
	// 	return true;
	// },

	// sendPing: function(client) {
	// 	setTimeout(function ping_client() {
	// 		var timestamp = helper.now();
	// 		client.send(server.formatMsg(msgType.PING, { t: timestamp.toString()}));
	// 	}, 3000);
	// },

	getPlayerBySocketID: function(socketID) {
	    ui.log(util.format("ERROR: Unable to find Player by Socket: %s", socketID ))
	    return null;
	},

	// getPlayerByAuthToken: function(authToken) {
	//     for(var p in players){
	//         if(players[p].authToken == authToken)
	//             return players[p];
	//     };
	//     ui.log(util.format("ERROR: Unable to find Player by token: %s", authToken ))
	//     return null;
	// },

	// broadcast_excluded: function(exclude, msg){
	// 	for(var i in io.sockets.sockets){
	// 		if(exclude != io.sockets.sockets[i].id) {
	// 			io.sockets.sockets[i].send(msg);
	// 		}
	// 	}
	// },

	broadcast_all: function(msg){
		for(var i in io.sockets.sockets){
			io.sockets.sockets[i].send(msg);
		}
	},

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