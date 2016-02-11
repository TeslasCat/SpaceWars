"use strict";

var compression = require('compression'),
    http = require('http'),
    express = require('express');

var HTTPserver = function(config) {
    this.app = express();

    // GZIP
    this.app.use(compression());

    // Expose entire client folder
    this.app.use('/', express.static(__dirname + '/../client'));

    // Expose shared lib files
    this.app.use('/js/lib', express.static(__dirname + '/lib'));

    this.server = this.app.listen(config.port);
}


module.exports = HTTPserver;