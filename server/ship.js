"use strict";

var Ship = function(id, owner, name, plot, speed) {
    this.id = id;
    this.owner = owner;
    this.name = name;
    this.size = 1 / 1000;
    this.speed = speed / 3600 || 1000 / 3600; // Defaults to 1000kmph
    this.plot = plot || {x: 0, y: 0};
    this.viewDistance = 10;
    // TODO: Ship owner, to check if player has permissions to issue commands to ship

    this.shape = [[-0.5, 1], [0, -1], [0.5, 1]];

    this.display = {
        trajectory: true
    }

    return this;
};

Ship.prototype.toString = function() {
    return "SHIP: " + this.name + " [" + this.plot.x + "/" + this.plot.y + "]";
}

module.exports = Ship;