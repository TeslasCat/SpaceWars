var Player = function(id, name){
	this.id = id;
	this.name = name;
	this.ships = [];
	this.planets = [];

	return this;
}

module.exports = Player;