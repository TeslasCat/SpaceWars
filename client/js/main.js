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
            conn.sendMsg(msgType.AUTH, { u: username, p: password}, function(data) {
                $('#login').remove();

                // Setup user
                game.user = new User(data.t);
                game.user.update();

                // Load in landscape
                game.updateSpace();
            }, function() {
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
