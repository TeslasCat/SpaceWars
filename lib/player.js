var Player = function(id, name, userName, socket){
	this.id = id;
	this.name = name;
    this.name = name;
    this.userName = userName;
    this.age = 0;
    this.ping = 0;

    if (socket) {
        this.socket = socket;
    }

	return this;
}

Player.prototype.getAuthToken = function(size) {
    if(!this.authToken){
        this.authToken = require('crypto').randomBytes(256).toString('hex');
    }
    return this.authToken;
}

Player.prototype.toString = function(size) {
    return "PLAYER: ID: " + this.id + " " + this.name + " [" + this.socket + "]";
}

if (typeof exports !== 'undefined') module.exports = Player;