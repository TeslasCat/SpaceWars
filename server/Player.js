var Player = function(id, name, authToken){
	this.id = id;
	this.name = name;
	this.age = 0;
	this.ping = 0;
	this.authToken = authToken;

	return this;
}

module.exports = Player;