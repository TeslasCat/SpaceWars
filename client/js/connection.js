var conn = {
    /**
     * Message protocols
     */
    MESSAGE_TYPE_PING : 1,
    MESSAGE_TYPE_UPDATE_PING : 2,
    MESSAGE_TYPE_NEW_PLAYER : 3,
    MESSAGE_TYPE_SET_COLOUR : 4,
    MESSAGE_TYPE_UPDATE_PLAYER : 5,
    MESSAGE_TYPE_REMOVE_PLAYER : 6,

    /**
     * Init Connection to Server.
     */ 
    socket : io("http://localhost:8000"),

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
    conn.socket.send(conn.formatMessage(conn.MESSAGE_TYPE_NEW_PLAYER, { n: "Me"} ));

    conn.socket.on("message", function(msg) {
        var data = BISON.decode(msg);
        console.log(msg, data);
        // console.log('Received Type: ' + data.type);
        if (data.type) {
            switch (data.type) {
                case conn.MESSAGE_TYPE_PING:
                    // console.log('Received a Ping: ' + data.p);
                    if (data.t) {
                        conn.socket.send(msg);
                    }
                    break;
                case conn.MESSAGE_TYPE_UPDATE_PING:
                    console.log('Update ping client: '+data.i+' ping: '+data.p);
                    break;
                case conn.MESSAGE_TYPE_NEW_PLAYER:
                    var player = new Player(data.i, data.n);
                    game.players.push(player);
                    break;
                case conn.MESSAGE_TYPE_REMOVE_PLAYER:
                    var p = conn.getPlayerBySocketID(data.i);
                    if(!p){
                        console.log("Player not found. Unable to handle remove.");
                        break;
                    }

                    console.log("Player has disconnected: ", p.name, p.id);
                    game.players.splice(game.players.indexOf(p), 1);
                    break;
            }
        }
    });
});

conn.socket.on('disconect', function() {
    console.log("Lost connection to server.");
});
