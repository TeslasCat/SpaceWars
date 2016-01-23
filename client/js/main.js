$(function() {
    window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();

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

    registerMouseListeners();
    registerCommands();

    // Add ships
    game.ships = [];
    var ship = new Ship('FR00001', {x: 15, y: 0});
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

    // for (i = 0; i < 100; i++) {

    //     name = planetNames[helper.rand(0, planetNames.length)] + '-' + i;
    //     tmpLoc = {
    //         x: helper.rand(0, game.canvas.width * 2) - game.canvas.width,
    //         y: helper.rand(0, game.canvas.height * 2) - game.canvas.height
    //     };
    //     tmpRadius = helper.rand(5000, 15000);
    //     tmpPlanet = new Planet(name, tmpLoc, tmpRadius);

    //     mCount = helper.rand(0, 5);
    //     for (j = 0; j < mCount; j++) {
    //         /**/ tmpAltitude = Math.floor(Math.random() * ((tmpRadius/1000)*2)) + (tmpRadius/1000)*1.3;
    //         /**/ tmpSpeed = Math.floor(Math.random() * 4) + 0.3;
    //         /**/ tmpMoon = new Moon(name + '.' + j, tmpPlanet, 250, tmpAltitude, tmpSpeed);
    //         tmpMoon.angle = Math.floor(Math.random() * 360);
    //         tmpPlanet.moons.push(tmpMoon);
    //     }

    //     game.planets.push(tmpPlanet);
    // }


    function drawBG() {
        var bgSize = 10 * game.scale;
        var center = helper.getScreenPosition({x: 0, y: 0});

        game.context.fillStyle = 'hsla(0, 0%, 50%, 0.05)';

        // Do vertical lines
        var i = Math.round(game.canvas.width / bgSize / 2);
        while (i--) {
            game.context.fillRect(center.x + (i * bgSize), 0, 1, game.canvas.height);
            game.context.fillRect(center.x - (i * bgSize), 0, 1, game.canvas.height);
        }

        i = Math.round(game.canvas.height / bgSize / 2);
        // Do horizontal lines
        while (i--) {
            game.context.fillRect(0, center.y + (i * bgSize), game.canvas.width, 1);
            game.context.fillRect(0, center.y - (i * bgSize), game.canvas.width, 1);
        }

        // Do center lines
        game.context.fillStyle = 'hsla(0, 0%, 50%, 0.07)';
        game.context.fillRect(center.x, 0, 1, game.canvas.height);
        game.context.fillRect(0, center.y, game.canvas.width, 1);
    }

    function drawGame(lastDraw) {
        var duration = ((new Date()).getTime() - lastDraw) / 1000,
            lastDraw = (new Date()).getTime();
        game.context.clearRect(0, 0, game.canvas.width, game.canvas.height);
        game.context.setLineDash([]);

        // Update game view
        game.update(duration);

        drawBG();

        // Are we tracking something?
        if (game.tracking) {
            game.setPosition(game.tracking.getPlot());
        }

        for(i = game.planets.length - 1; i >= 0; i--) {
            game.planets[i].draw();
        }

        for(i = game.ships.length - 1; i >= 0; i--) {
            game.ships[i].move(duration);
            game.ships[i].draw();
        }

        requestAnimFrame(function() {
            drawGame(lastDraw);
        });
    }

    lastDraw = (new Date()).getTime();
    drawGame(lastDraw);
});

var epoch = Date.parse("January 30, 2016 14:20");
function updateTimer() {
    $('.time').text(helper.getTime());

    setTimeout(updateTimer, 1000);
}
updateTimer();
