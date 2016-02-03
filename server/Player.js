"use strict";

var Player = function(id, socket, name, userName){
	this.id = id;
	this.socket = socket; 
	this.name = name;
	this.userName = userName;
	this.age = 0;
	this.ping = 0;
	this.authToken = null;

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
module.exports = Player;