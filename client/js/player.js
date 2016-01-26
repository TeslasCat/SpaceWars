var Player = function(id, name, ships, authToken){
	this.id = id;
	this.name = name;
	this.ships = ships;
	this.ping = 0;
	this.planets = [];
	this.authToken = authToken;

	return this;
}