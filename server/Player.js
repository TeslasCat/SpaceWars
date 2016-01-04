var Player = function(id, x, y, colour,  name) {
	this.id = id;
	this.x = x;
	this.y = y;
	this.name = name;
	this.age = 0; 
	this.ping = 0;
	this.colour = colour;
}

exports.init = function(id, x, y, colour, name) {
	return new Player(id, x, y, colour, name);
}