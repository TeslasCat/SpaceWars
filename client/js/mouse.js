var registerMouseListeners = function() {
    game.canvas.onwheel = function (e){
        if (mouseDown) return;

        console.log(e.pageX, e.pageY, game.getGameLocation([e.pageX, e.pageY]));

        var wheel = Math.abs(e.deltaY/120);
        if (e.wheelDelta > 0) {
            game.scale += wheel;
        } else {
            game.scale -= wheel;
        }

        if (game.scale < 1) {
            game.scale = 1;
        } else {
            // game.setLocation(game.tracking.location);
            // game.location = game.getGameLocation([e.pageX, e.pageY]);
            // game.location[0] = (e.pageX * game.scale) - game.location[0];
            // game.location[1] = (e.pageY * game.scale) - game.location[1];
        }
    }


    var mouseDown = false;
    var mouseDragStart = [];

    $(document).on('mouseout', function(e) {
        e = e ? e : window.event;
        var from = e.relatedTarget || e.toElement;
        if (!from || from.nodeName == "HTML") {
            mouseDown = false;
        }
    });

    game.canvas.onmousedown = function(e) {
        mouseDown = true;

        mouseDragStart = [(e.pageX/game.scale) - game.location[0], (e.pageY/game.scale) - game.location[1]];
    };

    game.canvas.onmouseup   = function(e) {
        if (mouseDown) {
            game.location = [
                (e.pageX/game.scale) - mouseDragStart[0],
                (e.pageY/game.scale) - mouseDragStart[1]
            ];

            mouseDown = false;
        }
    };

    game.canvas.onmousemove = function(e) {
        if(!mouseDown) return; // don't pan if mouse is not pressed

        if (game.tracking) {
            game.tracking = null;
        }

        game.location = [
            (e.pageX/game.scale) - mouseDragStart[0],
            (e.pageY/game.scale) - mouseDragStart[1]
        ];
    }
}