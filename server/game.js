"use strict";

var Ship = require("../lib/ship");
var Planet = require("../lib/planet");

var Game = function() {
    this.ships = [];
    this.planets = [];

    // Load data
    this.loadAll();
}

Game.prototype.loadAll = function() {
    var self = this;

    // Load all the ships
    global.db.keys("ship:*", function(err, keys) {
        self.getItems(0, keys, function(id, ship) {
            var s = new Ship(id, ship.owner, ship.name, {x: ship.x, y: ship.y}, ship.speed);

            if (ship.lastUpdated) {
                s.lastUpdated = ship.lastUpdated;
            }

            if (ship.waypoint) {
                s.waypoint = JSON.parse(ship.waypoint);
            }

            self.ships.push(s);
        }, function() {
            global.ui.log("Finished loading ships " + self.ships.length);
        });
    });

    // Load all the planets
    global.db.keys("planet:*", function(err, keys) {
        self.getItems(0, keys, function(id, planet) {
            var p = new Planet(id, planet.name, {x: planet.x, y: planet.y}, planet.radius);
            self.planets.push(p);
        }, function() {
            global.ui.log("Finished loading planets " + self.planets.length);
        });
    });
}


Game.prototype.getItems = function(id, keys, callback, finalCallback) {
    var self = this;

    // Check id is valid
    if (id >= keys.length) {
        finalCallback();
        return;
    }

    var key = keys[id];

    global.db.hgetall(key, function(err, item) {
        if (item) {
            var itemID = /[^:]*$/.exec(key)[0];
            callback(itemID, item);
        }

        id++;
        self.getItems(id, keys, callback, finalCallback);
    });
}


Game.prototype.createObject = function(type, data, callback) {
    var self = this;

    if (type == "planet") {
        db.incr("next_planet_id", function(err, ID){
            // TODO: Serialise plot and shape data before placing in DB.
            db.hmset("planet:"+ID,
                "name", data.name,
                "radius", data.radius,
                "x", data.plot.x,
                "y", data.plot.y
            );
            db.hset("planets", data.name, ID);
            ui.log("NEWPLANET: " + data.name + " " + ID);

            // Create planet
            var p = new Planet(ID, data.name, data.plot, data.radius);
            self.planets.push(p);

            callback(p);
        });
    }

    if (type == "ship") {
        db.hexists("ships", data.name, function(err, res){ 
            if(res == 1) {
                callback(false);
                return;
            }
            db.incr("next_ship_id", function(err, ID){
                // TODO: Serialise plot and shape data before placing in DB.
                db.hmset("ship:"+ID,
                    "owner", data.owner,
                    "name", data.name,
                    "size", data.size,
                    "speed", data.speed, 
                    "x", data.plot.x,
                    "y", data.plot.y,
                    "viewDistane", data.viewDistane,
                    "shape", data.shape
                );
                db.sadd("user:" + data.owner + ":ships", ID);
                db.hset("ships", data.name, ID);
                ui.log("NEWSHIP: " + data.name + " " + ID);

                // Create ship
                var s = new Ship(ID, data.owner, data.name, data.plot, data.speed);
                self.ships.push(s);

                callback(s);
            });
        });
    }
}

Game.prototype.getPlanets = function() {
    return this.planets;
}


Game.prototype.getShips = function(userID) {
    var ships = [];

    this.ships.forEach(function(item) {
        item.move();
        ships.push(item.getObject());
    });

    if (!userID)
        return ships;

    // Get users ships
    var ships = [];
    this.ships.forEach(function(item) {
        if (item.owner == userID) {
            ships.push(item.getObject());
        }
    });

    return ships;
}

Game.prototype.getShip = function(shipID) {
    var ship;

    this.ships.forEach(function(item) {
        if (item.id == shipID) {
            ship = item;
            return;
        }
    });

    return ship;
}



module.exports = Game;