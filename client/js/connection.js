var conn = {
    /**
     * Message protocols
     */
    MESSAGE_TYPE_PING : 1,
    MESSAGE_TYPE_UPDATE_PING : 2,
    MESSAGE_TYPE_NEW_PLAYER : 3,
    // MESSAGE_TYPE_SET_COLOUR : 4,
    MESSAGE_TYPE_UPDATE_PLAYER : 5,
    MESSAGE_TYPE_REMOVE_PLAYER : 6,
    MESSAGE_TYPE_AUTHENTICATION_PASSED : 7,
    MESSAGE_TYPE_AUTHENTICATION_FAILED : 8,
    MESSAGE_TYPE_AUTHENTICATE : 9,

    /**
     * Init Connection to Server.
     */ 
    socket : io("/"),

    /**
     * Format Messages using BISON encoding.
     */
    formatMessage: function(type, args) {
        var msg = {type: type};

        for (var arg in args) {
            // Don't overwrite the message type
            if (arg != "type")
                msg[arg] = args[arg];
        };

        return BISON.encode(msg);
    },

    getPlayerBySocketID: function(id) {
        for(var p in game.players){
            if(game.players[p].id == id)
                return game.players[p];
        };

        return null;
    }
}

/* once made connection, create a new player, send it to the server */
conn.socket.on('connect', function() {

    if(!game.the_player){
        /* TODO: AUTH The User */
        conn.socket.send(conn.formatMessage(conn.MESSAGE_TYPE_AUTHENTICATE, { u: "user_a", p: "open-the-gate"} ));
    }else {
        /* TODO: If connection to server is lost or server is restarted, re-auth with current user or delete this instance and load again. */
        console.log(game.the_player);
    }

    conn.socket.on("message", function(msg) {
        var data = BISON.decode(msg);

        /* DEBUG */
        // console.log(msg, data);
        
        if (data.type) {
            switch (data.type) {
                case conn.MESSAGE_TYPE_PING:
                    if (data.t) {
                        conn.socket.send(msg);
                    }
                    break;
                case conn.MESSAGE_TYPE_UPDATE_PING:
                    var p = conn.getPlayerBySocketID(data.i)
                    if(p){
                        p.ping = data.p;
                    }
                    break;
                case conn.MESSAGE_TYPE_NEW_PLAYER:
                    if(data.i == conn.socket.id){
                        console.log("Skipped adding myself to the players list.");
                        break;
                    }

                    var player = new Player(data.i, data.n, data.s);
                    // TODO: Add player's ships to game, make the distinction between player's ships.
                    // console.log(player.ships)
                    
                    game.players.push(player);

                    // TODO: Fix this up.
                    game.ui.showInfo(player);
                    break;
                case conn.MESSAGE_TYPE_REMOVE_PLAYER:
                    var p = conn.getPlayerBySocketID(data.i);
                    if(!p){
                        console.log("Player not found. Unable to handle remove.");
                        break;
                    }

                    console.log("Player has disconnected: %s %s", p.name, p.id);
                    game.players.splice(game.players.indexOf(p), 1);
                    break;
                case conn.MESSAGE_TYPE_AUTHENTICATION_PASSED:
                    game.the_player = new Player(conn.socket.id, data.n, data.s, data.t);

                    console.log("You're authed as: %s", data.n);
                    
                    for(var i in data.s){
                        var ship = new Ship(data.s[i].name, data.s[i].plot);
                        game.ships.push(ship);
                    }
                    break;
                case conn.MESSAGE_TYPE_AUTHENTICATION_FAILED:
                    console.log("Failed to Auth player. Check username and password.");
                    break;
            }
        }
    });
});

conn.socket.on('disconect', function() {
    console.log("Lost connection to server.");
});
