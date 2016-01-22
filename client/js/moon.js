var Moon = function(name, planet, radius, altitude, velocity) {
    this.altitude = altitude || 10;
    this.name = name;
    this.planet = planet;
    this.radius = radius || 40;
    this.velocity = velocity || 1;
    this.angle = 1;

    return this;
};

Moon.prototype.move = function(duration) {
    this.angle = (this.angle + (0.001 * this.velocity)) % 360;
};

Moon.prototype.draw = function() {
    var context = game.context;

    context.save();

    context.lineWidth = 1;
    context.fillStyle="#1E1E1E";
    context.strokeStyle = 'rgba(150, 200, 255, 0.3)';

    context.beginPath();

    var screenLocation = game.getScreenLocation(this.planet.location),
        radius = (this.radius / 1000) * game.scale;

    context.translate(screenLocation[0], screenLocation[1]);
    context.rotate(this.angle);

    context.arc(this.altitude * game.scale, this.altitude * game.scale, radius, 0, Math.PI * 2, true);

    context.closePath();
    context.fill();
    context.stroke();

    context.restore();
};