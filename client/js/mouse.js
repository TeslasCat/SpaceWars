var registerMouseListeners = function() {
    game.canvas.onwheel = function (e){
        if (mouseDown) return;

        if (normalizeWheelSpeed(e) > 0) {
            game.scale *= 1.2;
        } else {
            game.scale /= 1.2;
        }
        // game.scale += normalizeWheelSpeed(e);

        if (game.scale < 1) {
            game.scale = 1;
        } else {
            // game.setPosition(helper.getGamePosition({ x: e.pageX, y: e.pageY }));
            // game.setLocation(game.tracking.location);
            // game.setPosition(helper.getGamePosition({ x: e.pageX, y: e.pageY }));
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

    var mouseOver = null,
        clickThreshold = 200,
        doubleClickThreshold = 300,
        mouseDown = false,
        mouseDragStart = [],
        firstClick = null,
        doubleClickTimer = null;

    $(document).on('mouseout', function(e) {
        e = e ? e : window.event;
        var from = e.relatedTarget || e.toElement;
        if (!from || from.nodeName == "HTML") {
            mouseDown = false;
        }
    });

    game.canvas.onmousedown = function(e) {
        mouseDown = new Date().getTime();

        mouseDragStart = [(e.pageX/game.scale) - game.position.x, (e.pageY/game.scale) - game.position.y];
    };

    game.canvas.onmouseup   = function(e) {
        // Drag event
        if (mouseDown === true) {
            mouseDown = false;
        } else if (mouseDown) { // click
            if (new Date().getTime() - mouseDown < clickThreshold) {
                // Is this a double click?
                if (new Date().getTime() - firstClick < doubleClickThreshold) {
                    game.scale *= 2; // Zoom in
                    clearTimeout(doubleClickTimer);
                    firstClick = null;
                } else {
                    // Record first click to check for double
                    firstClick = new Date().getTime();
                    // Wait to check for double click
                    if (mouseOver) {
                        doubleClickTimer = setTimeout((function(object) {
                            return function() {
                                // UI.showInfo(object);
                            };
                        })(mouseOver), doubleClickThreshold);
                    }
                }
            }

            mouseDown = false;
        }
    };

    game.canvas.onmousemove = function(e) {
        // Panning
        if(mouseDown) {
            mouseDown = true; // remove timestamp
            game.removeTargetPosition();

            game.position = {
                x: (e.pageX/game.scale) - mouseDragStart[0],
                y: (e.pageY/game.scale) - mouseDragStart[1]
            };
        } else { // Mouse over
            if (mouseOver) {
                helper.setCursor();
                mouseOver.hover = false;
            }

            mouseOver = helper.collision(helper.getGamePosition({ x: e.pageX, y: e.pageY }));
            if (mouseOver) {
                helper.setCursor('pointer');
                mouseOver.hover = true;
            }
        }
    }
}