"use strict";

if (typeof require !== "undefined") {
    var SpaceObject = require("../lib/spaceObject");
}

// TODO: Constructor ID.
var Ship = function(id, owner, name, plot, speed) {
    SpaceObject.call(this, id, owner, plot);

    this.type = "ship";

    this.name = name;
    this.size = 1 / 1000;

    this.speed = speed || 1000 / 3600; // Defaults to 1000kmph
    this.viewDistance = 10;

    this.type = 'ship';

    this.shape = [[-0.5, 1], [0, -1], [0.5, 1]];

    this.display = {
        trajectory: true
    }

    this.lastUpdated = helper.now();

    return this;
}
Ship.prototype = new SpaceObject();

Ship.prototype.save = function() {
    // Don't save on client
}

Ship.prototype.scaleShape = function(size) {
    var shapeCount = this.shape.length,
        shape = [];

    for (var i = 0; i < shapeCount; i++) {
        shape.push([this.shape[i][0] * size, this.shape[i][1] * size]);
    }

    return shape;
}

Ship.prototype.getPlot = function() {
    return c(this.plot);
}
Ship.prototype.setPlot = function(plot) {
    this.plot = {x: parseInt(plot.x), y: parseInt(plot.y)}; // Make sure values are integers
}
Ship.prototype.setID = function(id) {
    this.id = id;
};

Ship.prototype.setWaypoint = function(target, server) {
    if (target.vector) {
        this.waypoint = target;
        return this.waypoint;
    }

    // Make sure ship is in the correct position
    this.move();

    this.waypoint = {};

    if (target.x) {
        this.waypoint.plot = target
    } else {
        this.waypoint.target = target;
        this.waypoint.plot = target.getPlot();
    }
    this.waypoint.origin = this.getPlot();
    this.waypoint.distance = helper.calculateDistance(this.waypoint.plot, this.waypoint.origin);
    this.waypoint.vector = {
                                x: (this.waypoint.plot.x - this.waypoint.origin.x) / this.waypoint.distance,
                                y: (this.waypoint.plot.y - this.waypoint.origin.y) / this.waypoint.distance
                           };

    // Adjust for orbit
    if (target.radius) {
        this.waypoint.plot.x -= this.waypoint.vector.x * (target.radius + 2.5);
        this.waypoint.plot.y -= this.waypoint.vector.y * (target.radius + 2.5);
    }
    this.waypoint.distance = helper.calculateDistance(this.waypoint.plot, this.waypoint.origin);

    this.heading = helper.calculateAngle(this.waypoint.origin, this.waypoint.plot);

    // Tell server if they didn't tell us
    if (!server) {
        conn.sendMsg(msgType.UPDATE_SHIP, { s: { id: this.id, w: this.waypoint.plot } });
    }

    this.save();
    return this.waypoint;
};

Ship.prototype.removeWaypoint = function() {
    delete this.waypoint;
    this.save();
};

Ship.prototype.avoidPlanets = function() {
    // console.log(this.plot.x, this.waypoint.vector.x);
    var ahead = {x : this.plot.x + (this.waypoint.vector.x * this.viewDistance) , y: this.plot.y + (this.waypoint.vector.y * this.viewDistance)},
        ahead2 = {x : this.plot.x + (this.waypoint.vector.x * this.viewDistance * 0.5) , y: this.plot.y + (this.waypoint.vector.y * this.viewDistance * 0.5)};

    // console.log(helper.lineIntersectsCircle(ahead, ahead2, { plot: {x: 15, y: 50}, radius: 5000}));
}

Ship.prototype.move = function(duration) {
    if (!this.waypoint) return;

    var now = helper.now();

    var duration = (now - this.lastUpdated) / 1000;

    this.lastUpdated = now;

    this.avoidPlanets();
    this.plot.x += this.waypoint.vector.x * this.speed * duration;
    this.plot.y += this.waypoint.vector.y * this.speed * duration;

    // Have we reached our destination
    if (helper.calculateDistance(this.waypoint.origin, this.plot) >= this.waypoint.distance) {
        this.removeWaypoint();
    }

    this.save();
};

Ship.prototype.draw = function() {
    var shipPosition = helper.getScreenPosition(this.getPlot()),
        size = this.size * game.scale;

    // Translate position to center of ship
    shipPosition.x -= size / 2;
    shipPosition.y -= size / 2;

    // Do we need to draw this ship?
    if (helper.outsideDisplay(shipPosition, size)) {
        return;
    }

    var context = game.context;
    // context.setTransform(1, 0, 0, 1, 0, 0);

    if (this.waypoint && this.display.trajectory) {
        var waypointPosition = helper.getScreenPosition(this.waypoint.plot);
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(150, 255, 150, 0.3)';
        context.beginPath();
        context.moveTo(shipPosition.x, shipPosition.y);
        context.lineTo(waypointPosition.x, waypointPosition.y);
        context.fill();
        context.stroke();
    }


    context.lineWidth = 1;
    context.fillStyle="#1E1E1E";
    context.strokeStyle = 'rgba(150, 255, 200, 0.3)';

    var shape = this.scaleShape(size);
    helper.drawShape(shape, this.getPlot(), this.heading);

    context.fill();
    context.stroke();

    var labelWidth = context.measureText(this.name).width;
    if (labelWidth < size * 0.9 || game.scale > 5) {
        context.fillStyle = 'rgba(150, 255, 200, 0.3)';
        context.fillText(this.name, shipPosition.x + (size/2) - (labelWidth/2), shipPosition.y - this.size*2*game.scale - 2);
    }
};

if (typeof exports !== 'undefined') module.exports = Ship;