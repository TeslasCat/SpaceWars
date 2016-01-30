/**
 * Message protocols
 */
var msgType = {
    PING : 1,
    UPDATE_PING : 2,
    NEW_PLAYER : 3,
    UPDATE_PLAYER : 4,
    REMOVE_PLAYER : 5,
    AUTHENTICATION_PASSED : 6,
    AUTHENTICATION_FAILED : 7,
    AUTHENTICATE : 8,
    MOVE_SHIP : 9, 
    ERROR : -1,
}

var conn = {

    /**
     * Init Connection to Server.
     */ 
    socket : io("/"),

    /**
     * Format Messages using BISON encoding.
     */
    formatMsg: function(type, args) {
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
        console.log(util.format("ERROR: Unable to find Player: %s", id ))

        return null;
    }
}

function updateShipLoc(shipID, plot){
    conn.socket.send(conn.formatMsg(msgType.MOVE_SHIP, {s: shipID, p: plot} ));
};

/* once made connection, create a new player, send it to the server */
conn.socket.on('connect', function() {

    if(!game.the_player){
        /* TODO: AUTH The User */
        conn.socket.send(conn.formatMsg(msgType.AUTHENTICATE, { u: "user_a", p: "open-the-gate"} ));
    }else {
        /* TODO: If connection to server is lost or server is restarted, re-auth with current user or delete this instance and load again. */
        console.log("Replacing old connection. %s -> %s", game.the_player.id, conn.socket.id);
        // game.the_player = null;
        conn.socket.send(conn.formatMsg(msgType.ERROR, { t: "TODO: Client replacing conn."} ));
        // conn.socket.send(conn.formatMsg(msgType.AUTHENTICATE, { u: "user_a", p: "open-the-gate"} ));
    }

    conn.socket.on("message", function(msg) {
        var data = BISON.decode(msg);

        /* DEBUG */
        // console.log(msg, data);
        
        if (data.type) {
            switch (data.type) {
                case msgType.PING:
                    if (data.t) {
                        conn.socket.send(msg);
                    }
                    break;
                case msgType.UPDATE_PING:
                    var p = conn.getPlayerBySocketID(data.i)
                    if(p){
                        p.ping = data.p;
                    }
                    break;
                case msgType.NEW_PLAYER:
                    if(data.i == conn.socket.id){
                        console.log("Skipped adding myself to the players list.");
                        break;
                    }

                    var player = new Player(data.i, data.n, data.s);
                    // TODO: Add player's ships to game, make the distinction between player's ships.
                    
                    game.players.push(player);

                    // TODO: Fix this up.
                    game.ui.showInfo(player);
                    break;
                case msgType.REMOVE_PLAYER:
                    var p = conn.getPlayerBySocketID(data.i);
                    if(!p){
                        console.log("Player not found. Unable to handle remove.");
                        break;
                    }

                    console.log("Player has disconnected: %s %s", p.name, p.id);
                    game.players.splice(game.players.indexOf(p), 1);
                    break;
                case msgType.AUTHENTICATION_PASSED:
                    game.the_player = new Player(conn.socket.id, data.n, data.s, data.t);

                    for(var i in data.s){
                        var ship = new Ship(data.s[i].name, data.s[i].plot, data.s[i].speed, data.s[i].id);
                        game.ships.push(ship);
                    }

                    console.log("You're authed as: %s", data.n);
                    break;
                case msgType.AUTHENTICATION_FAILED:
                    console.log("Failed to Auth player. Check username and password.");
                    break;
                case msgType.MOVE_SHIP:
                    // i: p.id, s: p.ships[i].id, l: plot
                    for(var i in ships){
                        if(ships[i].id == data.s){
                            // TODO: Work out ETA 
                            console.log("%s moves to [%s|%s]", ships[i].name, data.l.x, data.l.y);
                            // TODO: Execute move command.
                            ship.setWaypoint(data.l);
                        }
                    }
                    break;
            }
        }
    });
});

conn.socket.on('disconect', function() {
    console.log("Lost connection to server.");
});
