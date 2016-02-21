"use strict";

var SpaceObject = function(id, owner, plot) {
    this.id = id;
    this.owner = owner;

    this.plot = plot || {x: 0, y: 0};
    this.plot = {x: parseInt(this.plot.x), y: parseInt(this.plot.y)}; // Make sure values are integers

    this.type = 'object';
}

SpaceObject.prototype.toString = function() {
    return "{0} #{1} [{2}/{3}]".format(this.type.toUpperCase(), this.id, this.plot.x, this.plot.y);
}

SpaceObject.prototype.getPlot = function() {
    return c(this.plot);
}

SpaceObject.prototype.setPlot = function(plot) {
    this.plot = {x: parseInt(plot.x), y: parseInt(plot.y)}; // Make sure values are integers
}

if (typeof exports !== 'undefined') module.exports = SpaceObject;