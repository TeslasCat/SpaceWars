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
var ui = require ('./ui.js'),
	ui = new ui();
var Player = require("../lib/player");
var BISON = require("./bison");
var Ship = require("../lib/ship");

var redis = require("redis");
var db = redis.createClient(global.config.redis);

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

var serverStart = new Date().getTime();

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
			// ui.updatePlayerList([{name: "Beeep", ping: 3}]);

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

		ui.setFooter('SpaceWars listening at http://' + http.server.address().address + ':' + http.server.address().port);

		/* Example Data */
		server.register("Zim", "Pete", "amail@gmail.com", "windows")
		server.register("Xim", "Luke", "something@gmail.com", "cat");
		server.register("Marven", "James", "specific@gmail.com", "dog");
		server.register("Steve", "John", "apples@gmail.com", "something");
		server.register("user_b", "Zorg", "zorg@empire.com", "open-the-gate");

		server.newShip(5, "Dark_Kitten_Matter", 1, 1000, {x: 0, y: 0}, 10, [[-0.5, 1], [0, -1], [0.5, 1]]);
		server.newShip(5, "Intrepid_Puss", 1, 1000, {x: 10, y: 20}, 10, [[-0.5, 1], [0, -1], [0.5, 1]]);
		server.newShip(2, "FR00001", 1, 1000, {x: 10, y: 20}, 10, [[-0.5, 1], [0, -1], [0.5, 1]]);
		server.newShip(2, "FR00002", 1, 1000, {x: 10, y: 20}, 10, [[-0.5, 1], [0, -1], [0.5, 1]]);
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
			db.hgetall("user:"+ID, function(err, user){
				server.getUserShips(ID, function(ships) {
					socks.send(server.formatMsg(msgType.UPDATE_USER, {id: messageID, user: {id: ID, n: user.name}, s: ships}));
				});
			});
		});
	},

	getUserShips: function(userID, callback) {
		var rtn = []
		db.smembers("user:"+userID+":ships", function(err, userShips){
			server.getUserShipsLookup(0, userShips, [], (function (callback) {
				return function(ships) { callback(ships) };
			})(callback));
		});
		return rtn;
	},

	getUserShipsLookup: function(n, userShips, ships, callback) {
		var shipID = userShips[n];
		db.hgetall("ship:"+shipID, function(err, ship){
			if (ship) {
				var s = new Ship(shipID, ship.owner, ship.name, {x: ship.x, y: ship.y}, ship.speed)
   				ships.push(s);
   			}

   			n++;
			if (n < userShips.length) {
				server.getUserShipsLookup(n, userShips, ships, callback);
			} else {
				callback(ships);
			}
   		});
	},

	/**
	 * UPDATE SPACE
	 */
	updateSpace: function(socks, data) {
		// TODO: Remove non-relevant data from the ships to streamline resources.
		db.get("next_ship_id", function(err, totalShips) {
			server.getShips(1, [], totalShips, (function (socks, data) {
				return function(ships) {
					ui.log("USPACE:"+ships)
					socks.send(server.formatMsg(msgType.UPDATE_SPACE, {id: data.id, s: ships}));
				}
			})(socks, data));
		});
	},

	getShips: function(id, ships, maxID, callback) {
		db.hgetall("ship:"+id, function(err, ship) {
			if (ship) {
				var s = new Ship(id, ship.owner, ship.name, {x: ship.x, y: ship.y}, ship.speed)
				ships.push(s);
			}

			// Get next ship from ID or callback with ships
			id++;
			if (id <= maxID) {
				server.getShips(id, ships, maxID, callback);
			} else {
				callback(ships);
			}
		});
	},

	/**
	 * UPDATE SHIP LOCATION
	 */
	updateShipLoc: function(socket, messageID, shipID, waypoint){
		// Check if user owns ship
		db.smembers("user:"+socket.user.id+":ships", function(err, userShips) {
			db.hgetall("ship:"+shipID, function(err, ship) {
				var owner = false;
				for(var i in userShips){
					if (userShips[i] == shipID) {
						owner = true;
						break;
					}
				}
				if (owner && ship) {
					ui.log(ship.x);
					ui.log(ship.y);
					server.broadcast_all(server.formatMsg(msgType.UPDATE_SHIP, {id: messageID, s: {id: shipID, plot: {x: ship.x, y: ship.y}, w: waypoint} }));
					ui.log("Moving ship.");
				} else if (ship) {
					ui.log(ship.x);
					ui.log(ship.y);
					socket.send(server.formatMsg(msgType.UPDATE_SHIP, {code: 0.2, id: messageID, s: {id: shipID, plot: {x: ship.x, y: ship.y}}}));
					ui.log("ERROR: ship not owned by user.");
				} else {
					socket.send(server.formatMsg(msgType.UPDATE_SHIP, {code: 0.3, id: messageID}));
					ui.log("ERROR: ship doesn't exist.");
				}
			});
		});
	},

	/**
	 *  PING Players
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

	sendPing: function(client) {
		setTimeout(function ping_client() {
			var timestamp = new Date().getTime();
			client.send(server.formatMsg(msgType.PING, { t: timestamp.toString()}));
		}, 3000);
	},




	/* 
	 * HELPER FUNCTIONS
	 */
	newShip: function(owner, name, size, speed, plot, viewDistane, shape){
		db.hexists("ships", name, function(err, res){ 
			if(res == 1) {
				ui.log("Ship already exists [" + name + "]");
				return false
			}
			db.incr("next_ship_id", function(err, ID){
				// TODO: Serialise plot and shape data before placing in DB.
				db.hmset("ship:"+ID, "owner", owner, "name", name, "size", size, "speed", speed, 
					"x", plot.x, "y", plot.y, "viewDistane", viewDistane, "shape", shape);
				db.sadd("user:" + owner + ":ships", ID);
				db.hset("ships", name, ID);
				ui.log("NEWSHIP: " + name + " " + ID);
			});
		});
	},

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