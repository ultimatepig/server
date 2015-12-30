var app = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var GameObject = require("./GameObject.js").GameObject;
var TagGame = require("./TagGame.js").TagGame;
var players = [];
var games = [];
var activeGames = [];

io.on('connection', function(socket) {
  console.log(socket.id);
  players.push(socket.id);
  socket.emit('updateLobby', {games: games});
  socket.emit('newID', {id: socket.id});
  socket.on('joinGame', function(data) {
    var newPlayer = new GameObject(0, 0, socket.id);
    for (var i = 0; i < games.length; i++) {
      if (hasPlayer(games[i].players, newPlayer)) {
        socket.leave(games[i].id);
        games[i].removePlayer(newPlayer.name, io);
      }
    }
    var gameIndex = indexOfID(games, data.id);
    var newPlayer = new GameObject(60, 60, socket.id);
    if (!hasPlayer(games[gameIndex].players, newPlayer)) {
      games[gameIndex].players.push(newPlayer);
      socket.join(games[gameIndex].id);
    }
  });
  socket.on('tagUpdate', function(data) {
    var index = indexOfID(activeGames, data.game);
    if (index == -1) {
    } else {
      var indexPlayer = indexOfID(activeGames[index].players, data.id);
      activeGames[index].players[indexPlayer].x = data.x;
      activeGames[index].players[indexPlayer].y = data.y;
    }
  });
  socket.on('tagCollision', function(data) {
    var index = indexOfID(activeGames, data.game);
    activeGames[index].handleCollision(data);
  });
  socket.on('disconnect', function() {
    var removePlayer = new GameObject(0, 0, socket.id);
    for (var i = 0; i < games.length; i++) {
      if (hasPlayer(games[i].players, removePlayer)) {
        games[i].removePlayer(socket.id, io);
      }
    }
    for (var i = 0; i < activeGames.length; i++) {
      if (hasPlayer(activeGames[i].players, removePlayer)) {
        activeGames[i].removePlayer(socket.id, io);
      }
    }
    var index = indexOfID(players, socket.id);
    players.splice(index, 1);
  });
});

http.listen(8080, '146.148.94.253', function() {
  console.log("listening on *:8080");
  var tag = new TagGame(8, 'map1', 0);
  games.push(tag);
  var tag1 = new TagGame(8, 'map1', 1);
  games.push(tag1);
  var tag2 = new TagGame(8, 'map1', 2);
  games.push(tag2);
  var tag3 = new TagGame(8, 'map1', 3);
  games.push(tag3);
  var active = setInterval(updateActive, 100);
  var lobby = setInterval(updateLobby, 1000);
});

function updateActive() {
  var clearGames = [];
  for (var i = 0; i < activeGames.length; i++) {
    activeGames[i].update();
    activeGames[i].broadcastUpdate(io);
    if (activeGames[i].gameOver) {
      activeGames[i].endGame(io);
      games.push(new TagGame(8, 'map1', activeGames[i].id));
      clearGames.push(activeGames[i].id);
    }
  }
  for (var i = 0; i < clearGames.length; i++) {
    var index = indexOfID(activeGames, clearGames[i]);
    activeGames.splice(index, 1);
  }
}

function hasPlayer(players, player) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].name == player.name)
      return true;
  }
  return false;
}

function updateLobby() {
  for (var i = 0; i < games.length; i++) {
    if (games[i].timeLeft == 0) {
      games[i].start(io);
      activeGames.push(games[i]);
      games.splice(i, 1);
    }
    else if (games[i].players.length >= games[i].maxPlayers / 2) {
      games[i].timeLeft--;
    } else {
      games[i].timeLeft = 15;
    }
  }
  io.emit('updateLobby', {games: games});
}

function indexOfID(a, id) {
  for (var i = 0; i < a.length; i++) {
    if (a[i] == id || a[i].id == id || a[i].name == id)
      return i;
  };
  return -1;
};
