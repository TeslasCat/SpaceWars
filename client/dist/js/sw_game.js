/** 
* Variables
*/
var SERVER_ADDRESS = "http://localhost";
var SERVER_PORT    = 8000;

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
player = null;
ping = "my-ping";

var socket = io(SERVER_ADDRESS + ":" + SERVER_PORT);

socket.on('connect', function (server) {

	if (player == null) {
		player = new Player(10, 15)
		socket.send(formatMessage(MESSAGE_TYPE_NEW_PLAYER, {x: player.x, y: player.y}));

	};

	socket.on("message", function(msg) {
		var data = BISON.decode(msg);

		if (data.type) {
			switch (data.type) {
				case MESSAGE_TYPE_PING:
					$('<p>Received a Ping: '+data.p+'</p>').appendTo('div#statusbar');
					break;
				case MESSAGE_TYPE_UPDATE_PING:
					$('<p>Update ping client: '+date.i+' ping: '+data.p+'</p>').appendTo('div#statusbar');
					break;
				case MESSAGE_TYPE_NEW_PLAYER:
					var player = new Player(data.x, data.y);
					player.id = data.i;
					player.name = data.n;
					player.active = true;
					players.push(player);
					$('<li>' + player.name + '</li>').appendTo('ul#users_online'); 
					console.log("New Player:", player);
					break;
				case MESSAGE_TYPE_REMOVE_PLAYER:
					players.splice(players.indexOf(getPlayerById(data.i)), 1);
					break;
			}
		}
	});
});


function formatMessage(type, args) {
	var msg = {type: type};

	for (var arg in args) {
		// Don't overwrite the message type
		if (arg != "type")
			msg[arg] = args[arg];
	};

	//return JSON.stringify(msg);
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