var Player = function(id, name){
	this.id = id;
	this.name = name;
	this.ships = [];
	this.planets = [];
	this.authToken = null;

	return this;
}

module.exports = Player;