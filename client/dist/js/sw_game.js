/** 
* Variables
*/
var SERVER_ADDRESS = "http://localhost";
var SERVER_PORT    = 8000;
// localStorage.debug = '*';

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
// var MESSAGE_TYPE_ERROR = 10;
// var MESSAGE_TYPE_ADD_BULLET = 11;
// var MESSAGE_TYPE_UPDATE_BULLET = 12;
// var MESSAGE_TYPE_REMOVE_BULLET = 13;
// var MESSAGE_TYPE_KILL_PLAYER = 14;
// var MESSAGE_TYPE_UPDATE_KILLS = 15;
// var MESSAGE_TYPE_REVIVE_PLAYER = 16;

players = [];
player = null;

var socket = io(SERVER_ADDRESS + ":" + SERVER_PORT);

/* once made connection, create a new player, send it to the server */
socket.on('connect', function () {
	$('#btn_offline').addClass('hide');
	$('#btn_online').addClass('show');

	// if (player == null) {
		player = new Player(0, Math.floor(Math.random()*1001), Math.floor(Math.random()*1001), "")
		socket.send(formatMessage(MESSAGE_TYPE_NEW_PLAYER, {x: player.x, y: player.y, n: player.name}));
	// };

	socket.on("message", function(msg) {
		var data = BISON.decode(msg);
		// $('<p> Received Type: ' + data.type + '</p>').prependTo('div#statusbar');
		if (data.type) {
			switch (data.type) {
				case MESSAGE_TYPE_PING:
					// $('<p>Received a Ping: ' + data.t + '</p>').appendTo('div#statusbar');
					if (data.t) {
						socket.send(msg);
					}
					break;
				case MESSAGE_TYPE_UPDATE_PING:
					// $('<p>Update ping client: '+data.i+' ping: '+data.p+'</p>').appendTo('div#statusbar');
					break;
				case MESSAGE_TYPE_NEW_PLAYER:
					var player = new Player(data.i, data.x, data.y, data.n);
					players.push(player);
					// $('<li>' + player.name + player.x + player.y + '</li>').appendTo('ul#users_online'); 
					updatePlayerList();
					break;
				case MESSAGE_TYPE_REMOVE_PLAYER:
					players.splice(players.indexOf(getPlayerById(data.i)), 1);
					updatePlayerList();
					// $('<p>Player Disconnected: ' + data.i + '</p>').appendTo('div#statusbar');
					break;
			}
		}
	});
});

socket.on('disconnect', function(server) {
	$('#btn_offline').addClass('show');
	$('#btn_online').addClass('hide');
});

function updatePlayerList(){
	$("ul#users_online").empty();
	for(var i in players) {
		if(players[i].id == socket.id){
			$("<li><b>YOU: {0} ({1},{2})</b></li>".format([players[i].name, players[i].x, players[i].y])).appendTo('ul#users_online'); 
		}else{
			$("<li>{0} ({1},{2})</li>".format([players[i].name, players[i].x, players[i].y])).appendTo('ul#users_online'); 
		}
	}
}

function formatMessage(type, args) {
	var msg = {type: type};

	for (var arg in args) {
		// Don't overwrite the message type
		if (arg != "type")
			msg[arg] = args[arg];
	};

	return BISON.encode(msg);
};

/**
 * Get player by id
 *
 * @param {Number} id Id of player
 * @returns Player object with specified id
 * @type Player
 */
function getPlayerById(id) {
	var playersLength = players.length;
	
	for (var i = 0; i < playersLength; i++) {
		var player = players[i];
		
		if (player.id == id)
			return player;
	};
};



/* 
 * Helper function to allow easy format of strings 
 * http://www.codeproject.com/Tips/201899/String-Format-in-JavaScript
 */

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