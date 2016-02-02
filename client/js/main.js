window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();


$(function() {
    game.canvas = $('#gameCanvas').get(0);
    game.context = game.canvas.getContext('2d');

    // Setup default styles
    game.context.font = "12px Georgia";

    game.canvas.width = $('#game').width();
    game.canvas.height = $('#game').height();

    $(window).on('resize', function() {
        game.canvas.width = $('#game').width();
        game.canvas.height = $('#game').height();
    });

    game.the_player = null;
    game.players = [];

    // Add ships
    game.ships = [];
    // var ship = new Ship('FR00001', {x: 0, y: 0});
    // ship.setWaypoint({x: 0, y: 0});
    // game.ships.push(ship);

    // game.position = ship.getPlot();
    // game.tracking = ship;
    game.scale = 8;

    // Add a new planet
    game.planets = [];


    // Generate random planets
    var tmpPlanet;
    for (var i = 0; i < 100; i++) {

        var distance = 1,
            tmpPlanet,
            n = 0;
        while (distance < 500) {
            n++
            if (n > 10) break;
            tmpPlanet = new Planet('Planet' + i, { x: 2000 - helper.rand(0, 4000), y: 1000 - helper.rand(0, 2000)}, helper.rand(5, 30));

            // Find closest planets
            var closest = helper.getClosestPlanet(tmpPlanet.getPlot(), tmpPlanet.radius);
            if (closest) {
                distance = closest.distance;
            } else {
                distance = 1000;
            }
        }

        game.planets.push(tmpPlanet);
    }


    $('#login input').on('keydown', function(e) {
        var keyCode = e.keyCode || e.which;

        if (keyCode == 13) {
            e.preventDefault();
            login();
        }
    });

    $('#login .button').on('click', function(e) {
        e.preventDefault();
        login();
    });

    function login() {
        $('#login').addClass('hidden');
        setTimeout(function() {
            var username = $('#login input[name=username]').val(),
                password = $('#login input[name=password]').val();
            // Login user
            conn.sendMsg(msgType.AUTHENTICATE, { u: username, p: password}, function() {
                alert('Stuff and stuff');

                $('#login').remove();

                game.the_player = new Player(conn.socket.id, data.n, data.s, data.t);

                console.log("You're authed as: %s", data.n);

                for(var i in data.s){
                    var ship = new Ship(data.s[i].name, data.s[i].plot);
                    game.ships.push(ship);
                }

                game.start();
            }, function() {
                alert('Not connected to server');
                $('#login').addClass('error').removeClass('hidden');
            });
        }, 1000);
    }


    // setTimeout(function() {
    //     game.start();
    // }, 1000);
});

function updateTimer() {
    $('.time').text(helper.getTime());

    setTimeout(updateTimer, 1000);
}
updateTimer();
