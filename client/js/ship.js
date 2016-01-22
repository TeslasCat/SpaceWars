var Ship = function(name, location, speed) {
    this.name = name;
    this.size = 1000;
    this.speed = speed || 5000;
    this.location = location || [0, 0];
    this.targetLocation = null;

    return this;
};

Ship.prototype.setTarget = function(location) {
    this.targetLocation = location;

    this.startX = this.location[0];
    this.startY = this.location[1];
    this.targetDistance = Math.sqrt(Math.pow(this.targetLocation[0]-this.location[0],2)+Math.pow(this.targetLocation[1]-this.location[1],2));
    this.targetDirectionX = (this.targetLocation[0]-this.location[0]) / this.targetDistance;
    this.targetDirectionY = (this.targetLocation[1]-this.location[1]) / this.targetDistance;

    this.angle = Math.atan2(this.location[1] - this.targetLocation[1], this.location[0] - this.targetLocation[0]) * 180 / Math.PI;

    console.log(this.angle);
    this.angle = 180 - Math.abs(this.angle);
    console.log(this.angle);
    // if (this.angle < 0) {
    //     this.angle = 180 - this.angle;
    // }
};

Ship.prototype.removeTarget = function(location) {
    this.targetLocation = null;
};

Ship.prototype.move = function(duration) {
    if (!this.targetLocation) return;

    this.location[0] += this.targetDirectionX * (this.speed / 1000 * duration);
    this.location[1] += this.targetDirectionY * (this.speed / 1000 * duration);

    // Have we reached our destination
    if (Math.sqrt(Math.pow(this.location[0]-this.startX,2)+Math.pow(this.location[1]-this.startY,2)) >= this.targetDistance) {
        this.targetLocation = null;
    }
};

Ship.prototype.draw = function() {
    var screenLocation = game.getScreenLocation(this.location),
        size = (this.size / 1000) * game.scale;

    screenLocation[0] -= size/2;
    screenLocation[1] -= size/2;

    // Do we need to draw this ship?
    if ((screenLocation[0] < -size ||
        screenLocation[0] > game.canvas.width + size) &&
        (screenLocation[1] < -size ||
        screenLocation[1] > game.canvas.height + size)
       ) {
        return;
    }


    var context = game.context;

    context.save();
    context.translate(screenLocation[0], screenLocation[1]);
    context.rotate(this.angle);

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
        context.fillText(this.name, screenLocation[0] + (size/2) - (labelWidth/2), screenLocation[1] - 3*game.scale);
    }

};