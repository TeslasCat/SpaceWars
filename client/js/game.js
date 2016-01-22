var game = {
    context: null,
    scale: 1,
    location: [0,0],
    setLocation: function(location) {
        this.location = [-location[0], -location[1]];
    },
    // Convert on game coordinates to screen coordinates
    getScreenLocation: function(location) {
        return [
                ((location[0] + this.location[0])*this.scale) + (game.canvas.width/2),
                ((location[1] + this.location[1])*this.scale) + (game.canvas.height/2)
            ];
    },
    // Convert on screen coordinates to game coordinates
    getGameLocation: function(location) {

        console.log((location[0] + this.location[0]/this.scale) - (game.canvas.width/2));

        return [
                (location[0] + this.location[0]/this.scale) - (game.canvas.width/2),
                (location[1] + this.location[1]/this.scale) - (game.canvas.height/2)
            ];
    }
}