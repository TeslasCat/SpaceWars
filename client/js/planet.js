var Planet = function(name, location, radius, velocity) {
    this.radius = radius || 10;
    this.name = name;
    this.velocity = velocity || [0, 0];
    this.location = location || [0, 0];
    this.moons = [];

    return this;
};

Planet.prototype.move = function(duration) {
    // this.location[0] = this.location[0] + (this.velocity[0] * duration);
    // this.location[1] = this.location[1] + (this.velocity[1] * duration);
};

Planet.prototype.draw = function() {
    var screenLocation = game.getScreenLocation(this.location),
        radius = (this.radius / 1000) * game.scale;
    // Do we need to draw this planet?
    if ((screenLocation[0] < -radius ||
        screenLocation[0] > game.canvas.width + radius) &&
        (screenLocation[1] < -radius ||
        screenLocation[1] > game.canvas.height + radius)
       ) {
        return;
    }


    var context = game.context;

    context.lineWidth = 1;
    context.fillStyle="#1E1E1E";
    context.strokeStyle = 'rgba(150, 200, 255, 0.3)';
    context.beginPath();
    context.arc(screenLocation[0], screenLocation[1], radius, 0, Math.PI * 2, true);
    context.fill();
    context.stroke();

    var labelWidth = context.measureText(this.name).width;
    if (labelWidth < radius * 0.9 || game.scale > 75) {
        context.fillStyle = 'rgba(150, 200, 255, 0.3)';
        context.fillText(this.name, screenLocation[0] - (labelWidth/2), screenLocation[1]);
    }

    for(var n = 0; n < this.moons.length; n++) {
        this.moons[n].move();
        this.moons[n].draw();
    }
};