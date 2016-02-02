var Player = function(id, socket, authToken, name, userName){
	this.id = id;
	this.socket = socket; 
	this.authToken = authToken;
	this.name = name;
	this.userName = userName;
	this.age = 0;
	this.ping = 0;

	return this;
}

module.exports = Player;