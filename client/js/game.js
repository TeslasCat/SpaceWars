var game = {
    ui: new UI(),
    epoch: Date.parse("January 30, 2016 14:20"),
    context: null,
    scale: 1,
    position: {x: 0, y: 0},
    panningSpeed: 500,
    introLength: 750,

    start: function() {
        if (this.gameStart) return;

        registerMouseListeners();
        registerCommands();
        $('body').addClass('playing');
        // TODO: send UPDATE_USER. and UPDATE_SPACE.
        this.gameStart = (new Date()).getTime();
        this.draw(this.gameStart);
    },
    updateSpace: function() {
        conn.sendMsg(msgType.UPDATE_SPACE, {}, function(data) {
            // TODO: Update existing objects (ships), or create new objects (ships).
            
            // Add ships to game
            for (var n = 0; n < data.s.length; n++) {
                var s = data.s[n];

                var ship = helper.getShipByID(s.id);
                if (ship) {
                    ship.setPlot(p.plot);
                    if (s.waypoint) {
                        ship.setWaypoint(s.waypoint);
                    }
                } else {
                    ship = new Ship(s.id, s.owner, s.name, s.plot);
                    if (s.waypoint) {
                        ship.setWaypoint(s.waypoint, true);
                    }
                    game.ships.push(ship);
                }
            }


            // Add planets to game
            for (var n = 0; n < data.p.length; n++) {
                var p = data.p[n];

                // Skip any planets that are already loaded
                var planet = helper.getPlanetByID(p.id);

                if (!planet) {
                    planet = new Planet(p.id, p.name, p.plot, p.radius);
                    game.planets.push(planet);
                }
            }
        });
    },
    draw: function(lastDraw) {
        var self = this,
            now = (new Date()).getTime(),
            gameDuration = now - this.gameStart,
            duration = (now - lastDraw) / 1000,
            lastDraw = now;
        game.context.clearRect(0, 0, game.canvas.width, game.canvas.height);
        game.context.setLineDash([]);

        // Update game view
        game.update(duration);

        this.drawGrid(gameDuration);

        if (gameDuration > this.introLength * 1.1) {
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
        }

        requestAnimFrame(function() {
            self.draw(lastDraw);
        });
    },
    drawGrid: function(duration) {
        if (duration > this.introLength) {
            lines = 1;
        } else {
            lines = duration / this.introLength;
        }

        var bgSize = 10 * game.scale;
        var center = helper.getScreenPosition({x: 0, y: 0});

        // Draw center lines
        game.context.fillStyle = 'rgba(125, 0, 0, 0.3)';
        if (center.x >= 0 && center.x <= gameCanvas.width) {
            game.context.fillRect(center.x, 0, 1, game.canvas.height * lines);
        }
        if (center.y >= 0 && center.y <= gameCanvas.height) {
            game.context.fillRect(0, center.y, game.canvas.width * lines, 1);
        }

        // Draw vertical lines
        game.context.fillStyle = 'rgba(100, 100, 100, 0.1)';

        var offset = Math.floor(center.x % bgSize),
            i = Math.ceil(game.canvas.width * lines / bgSize) + 1;
        while (i--) {
            game.context.fillRect(offset + (i * bgSize), 0, 1, game.canvas.height * lines);
        }

        // Draw horizontal lines
        offset = Math.floor(center.y % bgSize);
        i = Math.ceil(game.canvas.height / bgSize) + 1;
        while (i--) {
            game.context.fillRect(0, offset + (i * bgSize), game.canvas.width * lines, 1);
        }
    },


    getPosition: function() {
        return c(this.position);
    },
    setPosition: function(position) {
        position.x = -position.x;
        position.y = -position.y;
        this.targetPosition = {};
        this.targetPosition.position = position;
        this.targetPosition.origin = this.getPosition();
        this.targetPosition.distance = helper.calculateDistance(this.targetPosition.position, this.targetPosition.origin);
        this.targetPosition.vector = {
                                    x: (this.targetPosition.position.x - this.targetPosition.origin.x) / this.targetPosition.distance,
                                    y: (this.targetPosition.position.y - this.targetPosition.origin.y) / this.targetPosition.distance
                               };

        // If it's close just jump
        if (this.targetPosition.distance < this.panningSpeed * 1/60) {
            this.position = this.targetPosition.position;
            this.removeTargetPosition();
        }
    },
    removeTargetPosition: function() {
        delete game.tracking;
        delete this.targetPosition;
    },
    update: function(duration) {
        if (!this.targetPosition) return;

        this.position.x += this.targetPosition.vector.x * this.panningSpeed * duration;
        this.position.y += this.targetPosition.vector.y * this.panningSpeed * duration;

        // Have we reached our destination
        if (helper.calculateDistance(this.targetPosition.origin, this.position) >= this.targetPosition.distance) {
            this.removeTargetPosition();
        }
    }
}