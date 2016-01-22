var registerMouseListeners = function() {
    game.canvas.onwheel = function (e){
        if (mouseDown) return;

        game.scale += normalizeWheelSpeed(e) / 2;

        if (game.scale < 1) {
            game.scale = 1;
        } else {
            // game.setLocation(game.tracking.location);
            // game.location = game.getGameLocation([e.pageX, e.pageY]);
            // game.position.x = (e.pageX * game.scale) - game.position.x;
            // game.position.x = (e.pageY * game.scale) - game.position.x;
        }
    }

    function normalizeWheelSpeed(event) {
        var normalized;
        if (event.wheelDelta) {
            normalized = (event.wheelDelta % 120 - 0) == -0 ? event.wheelDelta / 120 : event.wheelDelta / 12;
        } else {
            var rawAmmount = event.deltaY ? event.deltaY : event.detail;
            normalized = -(rawAmmount % 3 ? rawAmmount * 10 : rawAmmount / 3);
        }
        return normalized;
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

        mouseDragStart = [(e.pageX/game.scale) - game.position.x, (e.pageY/game.scale) - game.position.y];
    };

    game.canvas.onmouseup   = function(e) {
        if (mouseDown) {
            game.position = {
                x: (e.pageX/game.scale) - mouseDragStart[0],
                y: (e.pageY/game.scale) - mouseDragStart[1]
            };

            mouseDown = false;
        }
    };

    game.canvas.onmousemove = function(e) {
        if(!mouseDown) return; // don't pan if mouse is not pressed

        if (game.tracking) {
            game.tracking = null;
        }

        game.position = {
            x: (e.pageX/game.scale) - mouseDragStart[0],
            y: (e.pageY/game.scale) - mouseDragStart[1]
        };
    }
}