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
    ERROR : -1,
}

var conn = {

    /**
     * Init Connection to Server.
     */ 
    socket : io("/"),

    /**
     * Sequential message ID
     */
    messageID : 0,

    /**
     * Callbacks store for messages that have yet to recieve a reply
     */
    callbacks : [],

    /**
     * Format Messages using BISON encoding.
     */
    formatMsg: function(type, args) {
        var msg = {type: type};

        for (var arg in args) {
            // Add in message ID
            msg["id"] = conn.messageID;

            console.log(msg["id"]);

            // Increment message ID for next message
            conn.messageID++;

            // Don't overwrite the message type
            if (arg != "type" && arg != "id") {
                msg[arg] = args[arg];
            }
        };

        return BISON.encode(msg);
    },

    sendMsg: function(type, data, callback, errorCallback) {
        if (conn.socket.connected) {
            // Add callbacks
            conn.queueCallbacks(conn.messageID, callback, errorCallback);

            // Send message
            conn.socket.send(conn.formatMsg(type, data));
        } else {
            // Do error callback by default if not connected
            if (errorCallback) {
                errorCallback();
            }
        }
    },

    queueCallbacks: function(messageID, callback, errorCallback) {
        var tmpCallbacks = {};

        // TODO: check success callback is a callable function
        if (callback && typeof callback === 'function') {
            tmpCallbacks.success = callback;
        }

        // TODO: check error callback is a callable function
        if (errorCallback && typeof errorCallback === 'function') {
            tmpCallbacks.error = errorCallback;
        }

        // Check that at least one callback has been added
        if (tmpCallbacks.length) {
            conn.callbacks[messageID] = tmpCallbacks;
        }
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

    if(game.the_player) {
        /* TODO: If connection to server is lost or server is restarted, re-auth with current user or delete this instance and load again. */
        console.log(game.the_player);
    }

    conn.socket.on("message", function(msg) {
        var data = BISON.decode(msg);

        /* DEBUG */
        // console.log(msg, data);


        // Call callback if response contains the original message ID
        if (data.id && conn.callbacks[data.id] && conn.callbacks[data.id].success) {
            conn.callbacks[data.id].success(data);
        }

        // Call default functions
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
                    // console.log(player.ships)
                    
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
            }
        }
    });
});

conn.socket.on('disconect', function() {
    console.log("Lost connection to server.");
});
