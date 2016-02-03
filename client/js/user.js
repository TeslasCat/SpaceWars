var User = function(token) {
	this.token = token;

    this.update = function() {
    	var self = this;

        if (!this.token) {
            // TODO: Is this meant to work?
            console.err('Trying to update user when not authed');
        }

        conn.sendMsg(msgType.UPDATE_USER, { t: this.token}, function(data) {
            // game.the_player = new Player(conn.socket.id, data.n, data.s, data.t);
            this.name = data.user.n;

            console.log("You're authed as: %s", this.name);

            // TODO: See game.js:22 - Update existing objects (ships), or create new objects (ships).
            // for(var i in data.s) {
            //     var ship = new Ship(data.s[i].name, data.s[i].plot);
            //     game.ships.push(ship);
            // }

            game.start();
        });
    }
};