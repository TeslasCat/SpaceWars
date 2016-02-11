var Planet = function(name, plot, radius) {
    this.radius = radius || 5;
    this.name = name;
    this.plot = plot || {x: 0, y: 0};
    this.moons = [];
    this.hover = false;

    return this;
};

Planet.prototype.getPlot = function() {
    return c(this.plot);
}

Planet.prototype.draw = function() {
    var planetPosition = helper.getScreenPosition(this.getPlot()),
        radius = this.radius * game.scale;

    // Do we need to draw this planet?
    if (helper.outsideDisplay(planetPosition, this.radius)) {
        return;
    }


    var context = game.context;

    context.lineWidth = 1;
    context.fillStyle="#1E1E1E";
    context.strokeStyle = 'rgba(150, 200, 255, 0.3)';
    if (this.hover) {
        context.strokeStyle = 'rgba(255, 200, 255, 0.3)';
    }
    context.beginPath();
    context.arc(planetPosition.x, planetPosition.y, radius, 0, Math.PI * 2, true);
    context.fill();
    context.stroke();

    var labelWidth = context.measureText(this.name).width;
    if (labelWidth < radius * 0.9 || game.scale > 75) {
        context.fillStyle = 'rgba(150, 200, 255, 0.3)';
        context.fillText(this.name, planetPosition.x - (labelWidth/2), planetPosition.y);
    }

    for(var n = 0; n < this.moons.length; n++) {
        this.moons[n].move();
        this.moons[n].draw();
    }
};