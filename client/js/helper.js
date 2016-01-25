var helper = {
    // Generates random number between min, max
    rand: function(min, max, float) {
        var n = Math.random() * (max - min) + min;
        if (float)
            return n;
        return Math.floor(n);
    },

    clone: function(source) {
        if (Object.prototype.toString.call(source) === '[object Array]') {
            var c = [];
            for (var i=0; i<source.length; i++) {
                c[i] = goclone(source[i]);
            }
            return c;
        } else if (typeof(source)=="object") {
            var c = {};
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    c[prop] = helper.clone(source[prop]);
                }
            }
            return c;
        } else {
            return source;
        }
    },

    setCursor: function(cursor) {
        if (cursor) {
            game.canvas.style.cursor = cursor;
        } else {
            game.canvas.style.cursor = 'default';
        }
    },

    formatNumber: function(n, decimals, scale) {
        if (scale) n *= 1000;
        decimals = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals, 
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(decimals)) + "", 
        j = (j = i.length) > 3 ? j % 3 : 0;
       return s + (j ? i.substr(0, j) + ',' : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + ',') + (decimals ? '.' + Math.abs(n - i).toFixed(decimals).slice(2) : "");
    },

    getTime: function(offset) {
        var seconds = (new Date().getTime() - game.epoch) / 1000;

        if (offset) {
            seconds += offset;
        }

        var past = (seconds < 0);
        seconds = Math.abs(seconds);
        var days = Math.floor(seconds / 86400);
        seconds -= days * 86400;
        var hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        var minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        seconds = Math.floor(seconds);

        return (past?'-':'')+days+'.'+hours+'.'+minutes+'.'+seconds;
    },

    calculateETA: function(ship, plot2) {
        var distance = this.calculateDistance(ship.getPlot(), plot2);

        return this.getTime(distance / ship.speed);
    },


    getObject: function(search, type) {
        console.log(search, type);

        if (!type || type == 'ship' || type == 'object') {
            for(var n = game.ships.length - 1; n >= 0; n--) {
                if (game.ships[n].name == search) {
                    return game.ships[n];
                }
            }
        }

        if (!type || type == 'planet' || type == 'object') {
            console.log('hi');
            for(var n = game.planets.length - 1; n >= 0; n--) {
                console.log(game.planets[n].name, search);
                if (game.planets[n].name == search) {
                    return game.planets[n];
                }
            }
        }
    },

    // Convert on game coordinates to screen coordinates
    getScreenPosition: function(plot) {
        return {
            x: ((plot.x + game.position.x) * game.scale) + (game.canvas.width/2),
            y: ((plot.y + game.position.y) * game.scale) + (game.canvas.height/2)
        };
    },
    // Convert on screen coordinates to game coordinates
    getGamePosition: function(plot) {
        return {
            x: (plot.x - game.canvas.width/2) / game.scale - game.position.x ,
            y: (plot.y - game.canvas.height/2) / game.scale - game.position.y
        };
    },
    // Is the item outside visible porition of screen
    outsideDisplay: function(position, size) {
        return (position.x < -size ||
                position.x > game.canvas.width + size) &&
                (position.y < -size ||
                position.y > game.canvas.height + size);
    },
    drawShape: function(shape, position, angle) {
        var shapeLength = shape.length,
            point;

        game.context.beginPath();

        for (var n = 0; n < shapeLength; n++) {
            point = { x: shape[n][0], y: shape[n][1] };
            if (angle) point = this.rotateAroundPoint(point, { x: 0, y: 0}, angle);
            point = this.getScreenPosition({ x: point.x + position.x, y: point.y + position.y });

            if (n == 0) {
                game.context.moveTo(point.x, point.y);
            } else {
                game.context.lineTo(point.x, point.y);
            }
        }

        game.context.closePath();
    },


    // Returns distance between two plots
    calculateDistance: function(plot1, plot2) {
        return Math.sqrt(Math.pow(plot2.x - plot1.x, 2)+Math.pow(plot2.y - plot1.y, 2));
    },
    // Return angle in radians from north
    calculateAngle: function(plot1, plot2) {
        var theta = Math.atan2(plot2.y - plot1.y, plot2.x - plot1.x);
        if (theta < 0)
            theta += 2 * Math.PI;
        return theta + Math.radians(90); // Normalize to north
    },
    lineIntersectsCircle: function(ahead, ahead2, obstacle) {
        return this.calculateDistance(obstacle.plot, ahead) <= obstacle.radius / 1000 || this.calculateDistance(obstacle.plot, ahead2) <= obstacle.radius / 1000;
    },
    rotate: function(plot, angle) {
        plot.x = (plot.x * Math.cos(angle)) - (plot.y * Math.sin(angle));
        plot.y = (plot.x * Math.sin(angle)) + (plot.y * Math.cos(angle));
        return plot;
    },
    rotateAroundPoint: function(plot1, plot2, angle) {
        var x = (plot1.x - plot2.x) * Math.cos(angle) - (plot1.y - plot2.y) * Math.sin(angle) + plot2.x,
        y = (plot1.x - plot2.x) * Math.sin(angle) + (plot1.y - plot2.y) * Math.cos(angle) + plot2.y;

        return {x: x, y: y};
    },
    collision: function(plot, type) {
        var object;

        // Ships
        // for (i = game.ships.length - 1; i >= 0; i--) {
        //     object = game.ships[i];

        //     console.log(helper.calculateDistance(plot, object.plot), object.radius);
        //     if (helper.calculateDistance(plot, object.plot) <= object.radius) {
        //         return object;
        //     }
        // }

        // Planets
        for (i = game.planets.length - 1; i >= 0; i--) {
            object = game.planets[i];

            if (helper.calculateDistance(plot, object.plot) <= object.radius) {
                return object;
            }
        }
    }
}


// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

// Shorthand for clone
function c(source) {
    return helper.clone(source);
}