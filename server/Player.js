var Player = function(id, name, ships, authToken){
	this.id = id;
	this.name = name;
	this.ships = ships;
	this.planets = [];
	this.authToken = authToken;

	return this;
}

module.exports = Player;