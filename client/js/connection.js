"use strict";
/**
 * Message protocols
 */
var msgType = {
    PING : 1,
    UPDATE_PING : 2,
    UPDATE_USER : 3,
    UPDATE_PLAYER : 4,
    REMOVE_PLAYER : 5,
    UPDATE_SPACE : 6,
    AUTH : 8,
    MOVE_SHIP : 9, 
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
    messageID : 1,

    /**
     * Callbacks store for messages that have yet to recieve a reply
     */
    callbacks : [],

    /**
     * Format Messages using BISON encoding.
     */
    formatMsg: function(type, args) {
        var msg = {type: type};

        // Add in message ID
        msg["id"] = conn.messageID;

        // Increment message ID for next message
        conn.messageID++;

        for (var arg in args) {
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

        if (callback && typeof callback === 'function') {
            tmpCallbacks.success = callback;
        }

        if (errorCallback && typeof errorCallback === 'function') {
            tmpCallbacks.error = errorCallback;
        }

        // Check that at least one callback has been added
        if (tmpCallbacks.success || tmpCallbacks.error) {
            conn.callbacks[messageID] = tmpCallbacks;
        }
    },

    getPlayerBySocketID: function(id) {
        for(var p in game.players){
            if(game.players[p].id == id)
                return game.players[p];
        };
        console.log("ERROR: Unable to find Player: %s", id )

        return null;
    }
}

function updateShipLoc(shipID, plot){
    conn.sendMsg(msgType.MOVE_SHIP, {i: shipID, p: plot});
};

/* once made connection, create a new player, send it to the server */
conn.socket.on('connect', function() {

    // console.log("SENT: Auth")
    // if(!game.the_player){
        /* TODO: AUTH The User */
        // conn.socket.send(conn.formatMsg(msgType.AUTHENTICATE, { u: "user_a", p: "open-the-gate"} ));
    // }else {
    //     /* TODO: If connection to server is lost or server is restarted, re-auth with current user or delete this instance and load again. */
    //     console.log("Replacing old connection. %s -> %s", game.the_player.id, conn.socket.id);
    //     // game.the_player = null;
    //     conn.socket.send(conn.formatMsg(msgType.ERROR, { t: "TODO: Client replacing conn."} ));
    //     conn.socket.send(conn.formatMsg(msgType.AUTHENTICATE, { u: "user_a", p: "open-the-gate"} ));
    //     // conn.socket.send(conn.formatMsg(msgType.AUTHENTICATE, { u: "user_a", p: "open-the-gate"} ));
    // }

    conn.socket.on("message", function(msg) {
        var data = BISON.decode(msg);

        /* DEBUG */
        // console.log(msg, data);

        // Codee; 
        // Fasle 0
        //  0.1 - Invalid Login Details
        //  0.2 - Banned
        //  0.3 - Rate Limited 
        // // True 1
            // 1.1 - GO GO Go 

        // Call callback if response contains the original message ID
        if (data.id && conn.callbacks[data.id] && conn.callbacks[data.id].success) {
            conn.callbacks[data.id].success(data);
        }

        // console.log(conn.callbacks[data.id])

        // Call default functions
        if (data.type) {
            switch (data.type) {
                case msgType.PING:
                    if (data.t) {
                        conn.socket.send(msg);
                        // console.log("SENT: Ping")
                    }
                    break;
                // case msgType.UPDATE_PING:
                //     var p = conn.getPlayerBySocketID(data.i)
                //     if(p){
                //         p.ping = data.p;
                //     }
                //     break;
                case msgType.UPDATE_USER:
                    var p = new Player(conn.socket.id, data.n);

                    if(data.i == conn.socket.id){
                        game.the_player = p;
                        console.log("Loaded the_player data.");
                        break;
                    }

                    // console.log(data.s)
                    for(var i in data.s) {
                        var s = new Ship(data.s[i].name, data.s[i].plot, data.s[i].speed, data.s[i].id);
                        game.ships.push(s);
                    }

                    game.players.push(p);

                    // TODO: Fix this up.
                    game.ui.showInfo(p);
                    break;
                case msgType.REMOVE_PLAYER:
                    var p = conn.getPlayerBySocketID(data.i);
                    if(!p){
                        break;
                    }

                    console.log("TODO: remove Ships.")
                    console.log("Player has disconnected: %s %s", p.name, p.id);

                    game.players.splice(game.players.indexOf(p), 1);
                    break;
                case msgType.MOVE_SHIP:
                    // i: p.id, s: p.ships[i].id, l: plot
                    for(var i in game.ships){
                        if(ships[i].id == data.i){
                            console.log("%s moves to [%s|%s]", game.ships[i].name, data.l.x, data.l.y);
                            game.ship.setWaypoint(data.l);
                        }
                    }
                    break;
            }
        }
    });
});

conn.socket.on('disconect', function() {
    console.log("Lost connection to server.");

    var p = conn.getPlayerBySocketID(data.i);
    console.log("TODO: remove Shups.")
    console.log("Player has disconnected: %s %s", p.name, p.id);
    game.players.splice(game.players.indexOf(p), 1);
});
