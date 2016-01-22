var game = {
    context: null,
    scale: 1,
    position: {x: 0, y: 0},
    setPosition: function(position) {
        this.position = {x: -position.x, y: -position.y};
    }
}