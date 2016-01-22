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
            x: (plot.x + game.position.x / game.scale) - (game.canvas.width/2),
            y: (plot.y + game.position.y / game.scale) - (game.canvas.height/2)
        };
    },
    // Is the item outside visible porition of screen
    outsideDisplay: function(position, size) {
        return (position.x < -size ||
                position.x > game.canvas.width + size) &&
                (position.y < -size ||
                position.y > game.canvas.height + size);
    },



    // Returns distance between two plots
    calculateDistance: function(plot1, plot2) {
        return Math.sqrt(Math.pow(plot2.x - plot1.x, 2)+Math.pow(plot2.y - plot1.y, 2));
    },
    calculateAngle: function(plot1, plot2) {
        var theta = Math.atan2(plot2.y - plot1.y, plot2.x - plot1.x);
        if (theta < 0)
            theta += 2 * Math.PI;
        return theta * 180/Math.PI;
    },
    lineIntersectsCircle(ahead :Vector3D, ahead2 :Vector3D, obstacle :Circle) :Boolean {
        // the property "center" of the obstacle is a Vector3D.
        return distance(obstacle.center, ahead) <= obstacle.radius || distance(obstacle.center, ahead2) <= obstacle.radius;
    }
}


function c(source) {
    return helper.clone(source);
}