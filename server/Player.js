var Player = function(id, name, ships, authToken){
	this.id = id;
	this.name = name;
	this.age = 0;
	this.ping = 0;
	this.ships = ships;
	this.planets = [];
	this.authToken = authToken;

	return this;
}

module.exports = Player;