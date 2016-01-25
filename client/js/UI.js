var UI = function() {
    var self = this;

    this.$sidebar = $('#sidebar');
    this.$sidebarHandle = this.$sidebar.children('.sidebar-handle');
    this.$sidebarContent = this.$sidebar.children('.sidebar-content');

    this.$sidebarHandle.on('click', function() { self.toggleSidebar(); });

    this.$sidebarContent.on('click', '.sidebar-item', function() {
        var object = helper.getObject($(this).data('object'), $(this).data('type'));
        if (object) {
            game.tracking = object;
            game.setPosition(object.getPlot());
            game.scale = 10;
        }
    });
};

UI.prototype.toggleSidebar = function() {
    this.$sidebar.toggleClass('sidebar--open');
};

UI.prototype.showSidebar = function() {
    this.$sidebar.addClass('sidebar--open');
};


UI.prototype.showInfo = function(object) {
    this.showSidebar(); // Open sidebar if not already

    var $item = $('<div>', {class: 'sidebar-item'});
    
    var info;
    if (object instanceof Ship) {
        $item.data('type', 'ship');
        $item.data('object', object.name);

        info = [
            'Classification: spaceship',
            'Size: unknown',
            'Position: ' + object.plot.x.toFixed(3) + ', ' + object.plot.y.toFixed(3),
            'Max speed: ' + helper.formatNumber(object.speed * 3600, 0) + 'km/s'
        ];

        if (object.waypoint) {
            info.push('Target: ' + object.waypoint.plot.x.toFixed(3) + ', ' + object.waypoint.plot.y.toFixed(3) + ' [' + object.waypoint.target.name + ']');
            info.push('Distance to target: ' + helper.formatNumber(helper.calculateDistance(object.waypoint.plot, object.plot), 2, true) + 'km');
            info.push('ETA: ' + helper.calculateETA(object, object.waypoint.plot))
        }
    } else if (object instanceof Planet) { 
        $item.data('type', 'planet');
        $item.data('object', object.name);

        info = [
            'Classification: planet',
            'Diamater: ' + helper.formatNumber(object.radius*2, 0, true) + 'km',
            'Position: ' + object.plot.x.toFixed(3) + ', ' + object.plot.y.toFixed(3),
            'Discovery: unknown',
            'Number of moons: ' +  object.moons.length,
            'Interests: unknown',
            'Geology: unknown'
        ];
    } else if (object instanceof Player) {
        $item.data('type', 'player');

        info = [
            'ID: ' + object.id,
        ];
    }

    $('<h3>', {text: object.name}).appendTo($item);

    if (info) {
        var $info = $('<ul>'),
            infoLength = info.length;
        for (i = 0; i < infoLength; i++) {
            $info.append($('<li>', { text: info[i] }));
        }
        $item.append($info);
    }

    this.$sidebarContent.prepend($item);
};