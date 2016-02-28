"use strict";

// Include global ship object
var Ship = require("../lib/ship");

// Overwrite functions
Ship.prototype.save = function() {
    ui.log('Saving ship');

    db.hmset("ship:"+this.id,
        "owner", this.owner,
        "name", this.name,
        "size", this.size,
        "speed", this.speed, 
        "x", this.plot.x,
        "y", this.plot.y,
        "waypoint", JSON.stringify(this.waypoint),
        "lastUpdated", this.lastUpdated,
        "viewDistane", this.viewDistane,
        "shape", this.shape
    );
}

if (typeof exports !== 'undefined') module.exports = Ship;