#!/usr/bin/env node

process.title = "SpaceWars";

var express = require('express');
var http = require('http');
var app = express();
var socketIO = require('socket.io');
var util = require("util");
// var config = require('config');
var colors = require('colors');

var Player = require("./Player");

var io;
var connections;

function init() {
	players = [];

	var server = app.listen(8000, "127.0.0.1", function() {
		console.log("Server Running.".green);
	});

	app.get('/', function (req, res) {
	  res.sendFile(__dirname + '/index.html');
	});

	io = socketIO.listen(server);
	setEventHandlers();
};

/* Define Handlers */
var setEventHandlers = function() {
	io.on('connection', onSocketConnection);
}

function onSocketConnection(client) {
	util.log("New player has connected: ", client.id);
    
    client.on("disconnect", onClientDisconnect);
    client.on("new player", onNewPlayer);
    client.on("move player", onMovePlayer);
};

/* Handlers Functions */
function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.id);

	// Player not found
	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);

	// Broadcast removed player to connected socket clients
	this.broadcast.emit("remove player", {id: this.id});
};

function onNewPlayer(data) {
	// Create a new player
	var newPlayer = new Player(data.x, data.y);
	newPlayer.id = this.id;

	// Broadcast new player to connected socket clients
	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
	};
		
	// Add new player to the players array
	players.push(newPlayer);
};

function onMovePlayer(data) {
	// Find player in array
	var movePlayer = playerById(this.id);

	// Player not found
	if (!movePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);

	// Broadcast updated position to connected socket clients
	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
};

/* Helper Functions */
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};
	
	return false;
};

/* RUN */
init();