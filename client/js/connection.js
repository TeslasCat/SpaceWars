var connection = {
    socket : io("http://localhost:8000"),

    /**
     * Message protocols
     */
    MESSAGE_TYPE_PING : 1,
    MESSAGE_TYPE_UPDATE_PING : 2,
    MESSAGE_TYPE_NEW_PLAYER : 3,
    MESSAGE_TYPE_SET_COLOUR : 4,
    MESSAGE_TYPE_UPDATE_PLAYER : 5,
    MESSAGE_TYPE_REMOVE_PLAYER : 6,
}

/* once made connection, create a new player, send it to the server */
connection.socket.on('connect', function() {
    connection.socket.on("message", function(msg) {
        var data = BISON.decode(msg);
        console.log(msg, data);
        console.log('Received Type: ' + data.type);
        if (data.type) {
            switch (data.type) {
                case MESSAGE_TYPE_PING:
                    console.log('Received a Ping: ' + data.t);
                    if (data.t) {
                        socket.send(msg);
                    }
                    break;
                case MESSAGE_TYPE_UPDATE_PING:
                    console.log('Update ping client: '+data.i+' ping: '+data.p);
                    break;
                case MESSAGE_TYPE_NEW_PLAYER:
                    var player = new Player(data.i, data.x, data.y, data.n);
                    players.push(player);
                    console.log(player.name + player.x + player.y);
                    updatePlayerList();
                    break;
                case MESSAGE_TYPE_REMOVE_PLAYER:
                    var player = getPlayerById(data.i);
                    if(player != null){
                        players.splice(players.indexOf(player), 1);
                    }
                    updatePlayerList();
                    console.log("Player Disconnected: {0} {1}".format(["Name", data.i]));
                    break;
            }
        }
    });
});