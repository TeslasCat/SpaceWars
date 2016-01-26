var blessed = require('blessed');
var util    = require('util');

var UI = function() {
    this.elements = [];

    this.colors = {'main': {'fg': 'white', 'bg': 'black'}, 'highlight': {'fg': 'white', 'bg': 'black'}};

    // Create a screen object.
    this.screen = blessed.screen({
      smartCSR: true
    });

    this.renderLayout();

    // Quit on Escape, q, or Control-C.
    this.screen.key(['C-c'], function(ch, key) {
      return process.exit(0);
    });

    // Render the screen.
    this.screen.render();
}

UI.prototype.renderLayout = function() {
    var self = this;

    // Footer
    this.elements['footer'] = blessed.Box({
        content: "", 
        tags: true,
        align: 'left',
        valign: 'top',
        width: '100%',
        height: '5%',
        bottom: 0,
        left: 0,
        style: {
            bg: this.colors.highlight.bg,
            fg: this.colors.highlight.fg
        }
    });
    this.screen.append(this.elements['footer']);

    // Main Window
    this.elements['main'] = blessed.Box({
      border: {
        type: 'line'
      },
      label: ' Output Console ',
      align: 'left',
      valign: 'top',
      width: '70%',
      height: '98%',
      top: 0,
      left: 0
    });
    this.screen.append(this.elements['main']);

    // SideBar
    this.elements['sidebar'] = blessed.Box({
        border: {
            type: 'line'
        },
        label: ' Player List ',
        align: 'left',
        valign: 'top',
        width: '30%',
        height: '98%',
        top: 0,
        left: '71%'
    });
    this.screen.append(this.elements['sidebar']);

    this.screen.render();
}

/* Set Functions */
UI.prototype.updatePlayerList = function(players){
	var self = this;
	this.elements['sidebar'].setText("");
    for(var i in players){
        // make the screens say the right things
        this.elements['sidebar'].insertBottom(
                util.format("%s [%s]", players[i].name, players[i].ping));
    }

	// Finally render to the screen.
	this.screen.render();
}

UI.prototype.log = function(str){
    var self = this;
    
    // make the screens say the right things
    this.elements['main'].insertBottom(str);

    // Finally render to the screen.
    this.screen.render();
}

UI.prototype.setFooter = function(str){
    var self = this;
    
    // make the screens say the right things
    this.elements['footer'].setContent(str);

    // Finally render to the screen.
    this.screen.render();
}


module.exports = UI;