var Ship = function(name, plot, speed) {
    this.name = name;
    this.size = 1000;
    this.speed = speed || 5000;
    this.plot = plot || {x: 0, y: 0};
    this.viewDistance = 100;

    this.display = {
        trajectory: true
    }

    return this;
};

Ship.prototype.getPlot = function() {
    return c(this.plot);
}

Ship.prototype.setWaypoint = function(plot) {
    this.waypoint = {plot: plot};
    this.waypoint.origin = this.getPlot();
    this.waypoint.distance = helper.calculateDistance(this.waypoint.plot, this.waypoint.origin);
    this.waypoint.vector = {
                                x: (this.waypoint.plot.x - this.waypoint.origin.x) / this.waypoint.distance,
                                y: (this.waypoint.plot.y - this.waypoint.origin.y) / this.waypoint.distance
                           };

    console.log(this.waypoint.origin, this.waypoint.plot);
    this.heading = helper.calculateAngle(this.waypoint.origin, this.waypoint.plot);
};

Ship.prototype.removeWaypoint = function() {
    delete this.waypoint;
};

Ship.prototype.move = function(duration) {
    if (!this.waypoint) return;

    this.plot.x += this.waypoint.vector.x * (this.speed / 1000 * duration);
    this.plot.y += this.waypoint.vector.y * (this.speed / 1000 * duration);

    // Have we reached our destination
    if (helper.calculateDistance(this.waypoint.origin, this.plot) >= this.waypoint.distance) {
        this.removeWaypoint();
    }
};

Ship.prototype.draw = function() {
    var shipPosition = helper.getScreenPosition(this.getPlot()),
        size = (this.size / 1000) * game.scale;

    // Translate position to center of ship
    shipPosition.x -= size / 2;
    shipPosition.y -= size / 2;

    // Do we need to draw this ship?
    if (helper.outsideDisplay(shipPosition, size)) {
        return;
    }

    var context = game.context;

    if (this.waypoint && this.display.trajectory) {
        var waypointPosition = helper.getScreenPosition(this.waypoint.plot);
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(150, 255, 150, 0.3)';
        context.beginPath();
        context.moveTo(shipPosition.x, shipPosition.y);
        context.lineTo(waypointPosition.x, waypointPosition.y);
        context.stroke();
    }


    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(shipPosition.x, shipPosition.y);

    //context.rotate(90*Math.PI/180);
    context.rotate(this.heading);

    // context.lineWidth = 1;
    // context.strokeStyle = 'rgba(255, 150, 150, 0.3)';
    // context.beginPath();
    // context.moveTo(0,0);
    // context.lineTo(-1000,0);
    // context.stroke();


    context.lineWidth = 1;
    context.strokeStyle = 'rgba(150, 255, 200, 0.3)';
    context.beginPath();
    context.moveTo(0,0);
    context.lineTo(size*2,size/2);
    context.lineTo(0,size);
    context.closePath();
    context.stroke();

    context.restore();

    var labelWidth = context.measureText(this.name).width;
    if (labelWidth < size * 0.9 || game.scale > 5) {
        context.fillStyle = 'rgba(150, 255, 200, 0.3)';
        context.fillText(this.name, shipPosition.x + (size/2) - (labelWidth/2), shipPosition.y - 3*game.scale);
    }

};