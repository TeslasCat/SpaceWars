var game = {
    ui: new UI(),
    epoch: Date.parse("January 30, 2016 14:20"),
    context: null,
    scale: 1,
    position: {x: 0, y: 0},
    panningSpeed: 500,
    getPosition: function() {
        return c(this.position);
    },
    setPosition: function(position) {
        console.log(position);
        position.x = -position.x;
        position.y = -position.y;
        this.targetPosition = {};
        this.targetPosition.position = position;
        this.targetPosition.origin = this.getPosition();
        this.targetPosition.distance = helper.calculateDistance(this.targetPosition.position, this.targetPosition.origin);
        this.targetPosition.vector = {
                                    x: (this.targetPosition.position.x - this.targetPosition.origin.x) / this.targetPosition.distance,
                                    y: (this.targetPosition.position.y - this.targetPosition.origin.y) / this.targetPosition.distance
                               };

        // If it's close just jump
        if (this.targetPosition.distance < this.panningSpeed * 1/60) {
            this.position = this.targetPosition.position;
            this.removeTargetPosition();
        }
    },
    removeTargetPosition: function() {
        delete game.tracking;
        delete this.targetPosition;
    },
    update: function(duration) {
        if (!this.targetPosition) return;

        this.position.x += this.targetPosition.vector.x * this.panningSpeed * duration;
        this.position.y += this.targetPosition.vector.y * this.panningSpeed * duration;

        // Have we reached our destination
        if (helper.calculateDistance(this.targetPosition.origin, this.position) >= this.targetPosition.distance) {
            this.removeTargetPosition();
        }
    }
}