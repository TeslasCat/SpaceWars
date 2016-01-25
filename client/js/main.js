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
    var ship = new Ship('FR00001', {x: 0, y: 0});
    // ship.setWaypoint({x: 0, y: 0});
    game.ships.push(ship);

    // game.position = ship.getPlot();
    // game.tracking = ship;
    game.scale = 8;

    // Add a new planet
    game.planets = [];
    var /**/ tmpPlanet,
        /**/ tmpMoon,
        /**/ planetNames = ['ALPHA', 'GAMMA', 'BETA'];


    tmpPlanet = new Planet('Avoid', { x: 15, y: 50}, 5);
    game.planets.push(tmpPlanet);

    tmpPlanet = new Planet('Hello', { x: 100, y: 100}, 5);
    game.planets.push(tmpPlanet);


    $('#login .button').on('click', function(e) {
        e.preventDefault();
        $('#login').addClass('hidden');
        setTimeout(function() {
            $('#login').remove();
            game.start();
        }, 1000);
    });


    // setTimeout(function() {
    //     game.start();
    // }, 1000);
});

function updateTimer() {
    $('.time').text(helper.getTime());

    setTimeout(updateTimer, 1000);
}
updateTimer();
