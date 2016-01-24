function registerCommands() {
    var actions = {
        'ship': {
            'patterns': [
                '${ship} orbit ${planet}'
            ],
            'responses': [
                'Moving ${options}'
            ]
        },
        'info': {
            'patterns': [
                '${object}'
            ],
            'responses': [
                'Loading info for ${options}'
            ]
        },
        'track': {
            'patterns': [
                '${object}',
                '${number} ${number}'
            ],
            'responses': [
                'Moving to ${options}'
            ]
        }, 'zoom': {
            'patterns': [
                '${number}',
            ],
            'responses': [
                'Zoom set to ${options}'
            ]
        }
    };

    var actionRegex = /^\${(\S+)}$/,
        invalid = 'Invalid command',
        history = [],
        historyID = 0;

    var currentCommand,
        $input = $('.commands-input'),
        $suggestion = $('.commands-input--suggestion');
        $history = $('.commands-history');

    $input.focus();

    // Load history
    if (localStorage.getItem("commands.history")) {
        history = JSON.parse(localStorage.getItem("commands.history"));
    }

    $input.on('keydown', function(e) {
        var keyCode = e.keyCode || e.which,
            text = $(this).val();

        // Tab auto-suggest
        if (keyCode == 9) {
            e.preventDefault();
            if ($suggestion.text()) {
                $input.val($suggestion.text() + ' ');
                $suggestion.text('');
            } else if (!text.endsWith(' ')) {
                $input.val($(this).val() + ' ');
            }
            return; 
        } else if (e.which == "13" && text) { // Enter key
            $(this).val('');

            history.push(text.trim());
            localStorage.setItem("commands.history", JSON.stringify(history));
            historyID = 0;

            // Check for command
            if (text[0] != '/') {
                $history.append($('<li>', {text: invalid}));
                return;
            }

            var options = text.substring(1).split(' '); // extract options
            command = options.shift(); // extract command from option

            var action = lookupCommand(command);
            if (!action) {
                $history.append($('<li>', {text: invalid}));
                return;
            }

            var response = executeCommand(action, options);
            $history.append($('<li>', {text: response}));
        } else if (e.which == "38") { // Up arrow
            e.preventDefault();
            if (historyID < history.length) {
                historyID++;
                $(this).val(history[history.length-historyID]);
            }
            return;
        } else if (e.which == "40") { // Down arrow
            e.preventDefault();
            if (historyID > 1) {
                historyID--;
                $(this).val(history[history.length-historyID]);
            } else {
                historyID = 0;
                $(this).val('');
            }
            return;
        }
    });

    $input.on('keyup', function(e) {
        $suggestion.text(''); // clear suggestion

        var command = $(this).val();
        if (command[0] != '/') return; // check for command

        var options = command.substring(1).split(' '); // extract options
        command = options.shift(); // extract command from option

        var action = lookupCommand(command);

        // If no action matched, let them carry on typing
        if (!action) return;

        lookupOptions(action, options);
    });

    function executeCommand(action, options) {
        var response = actions[action].responses[0].replace('${options}', options.join(' '));

        if (action == 'track') {
            var track = lookupContext(options[0], 'object');

            // Find item
            game.tracking = track;
            game.setPosition(track.getPlot());
            game.scale = 10;
        } else if (action == 'ship') {
            var ship = lookupContext(options[0], 'ship'),
                target = lookupContext(options[2], 'planet');

            // Find item
            var waypoint = ship.setWaypoint(target);

            // Get ETA
            response += '. ETA: ' + helper.calculateETA(ship, waypoint.plot);
        } else if (action == 'info') {
            var object = lookupContext(options[0], 'object');

            // Find item
            game.ui.showInfo(object);
        } else if (action == 'zoom') {
            game.scale = options[0];
        }

        return response;
    }

    function lookupCommand(command) {
        var closestSuggestion,
            closestSuggestionRank = 10000;

        // Lookup action
        for (var action in actions) {
            if (actions.hasOwnProperty(action)) {
                if (action == command) {
                    return action;
                } else {
                    if (command.length && action.length < closestSuggestionRank && action.indexOf(command) == 0) {
                        closestSuggestion = action;
                        closestSuggestionRank = action.length;
                    }
                }
            }
        }

        if (closestSuggestion) {
            $suggestion.text('/' + closestSuggestion);
        }
    }

    function lookupOptions(action, options) {
        var closestSuggestion,
            closestSuggestionRank = 10000;

        // Check patterns against options
        var patterns = actions[action].patterns;
        for(var n = patterns.length - 1; n >= 0; n--) {
            var pattern = patterns[n],
                patternBits = pattern.split(' '),
                patternBitsLen = patternBits.length;

            var tmpClosestSuggestion, tmpClosestSuggestionRank;

            for(var m = 0; m < patternBitsLen; m++) {
                if (options.length > m) {
                    var bit = patternBits[m],
                        option = options[m];

                    // Check for match
                    var match = actionRegex.exec(bit);
                    if (match != null) {
                        var context = match[1];

                        if (options.length == m+1) {
                            tmpClosestSuggestion = lookupContextSuggestion(option, context);
                            tmpClosestSuggestionRank = 1;
                        }
                    } else if (bit.indexOf(option) == 0) {
                        // Match
                        if (options.length == m+1) {
                            tmpClosestSuggestion = bit;
                            tmpClosestSuggestionRank = bit.length;
                        }
                    } else {
                        // Not matched, skip
                        break;
                    }
                }
            }

            if (tmpClosestSuggestion && tmpClosestSuggestionRank < closestSuggestionRank) {
                closestSuggestion = tmpClosestSuggestion;
                closestSuggestionRank = tmpClosestSuggestionRank;
            }
        }

        if (closestSuggestion) {
            options.pop();
            var text = '/' + action + ' ';
            if (options.length) {
                text += options.join(' ') + ' ';
            }
            text += closestSuggestion;
            $suggestion.text(text);
        }
    }


    function lookupContextSuggestion(value, context) {
        var closestSuggestion,
            closestSuggestionRank = 10000;

        if (context == 'ship' || context == 'object') {
            for(var n = game.ships.length - 1; n >= 0; n--) {
                var tmpName = game.ships[n].name;

                if (tmpName != value && tmpName.length < closestSuggestionRank && tmpName.indexOf(value) == 0) {
                    closestSuggestion = tmpName;
                    closestSuggestionRank = tmpName.length;
                }
            }
        }

        if (context == 'planet' || context == 'object') {
            for(var n = game.planets.length - 1; n >= 0; n--) {
                var tmpName = game.planets[n].name;

                if (tmpName != value && tmpName.length < closestSuggestionRank && tmpName.indexOf(value) == 0) {
                    closestSuggestion = tmpName;
                    closestSuggestionRank = tmpName.length;
                }
            }
        }

        return closestSuggestion;
    }

    function lookupContext(value, context) {
        if (context == 'ship' || context == 'object') {
            for(var n = game.ships.length - 1; n >= 0; n--) {
                if (game.ships[n].name == value) {
                    return game.ships[n];
                }
            }
        }

        if (context == 'planet' || context == 'object') {
            for(var n = game.planets.length - 1; n >= 0; n--) {
                if (game.planets[n].name == value) {
                    return game.planets[n];
                }
            }
        }
    }
}