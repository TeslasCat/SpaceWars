var Player = function(id, dbid, name, authToken){
	this.id = id;
	this.dbid = dbid; 
	this.name = name;
	this.age = 0;
	this.ping = 0;
	this.authToken = authToken;

	return this;
}

module.exports = Player;