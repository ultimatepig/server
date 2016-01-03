var GameObject = require("./GameObject.js").GameObject;

function TagGame(maxPlayers, mapName, id) {
  this.maxPlayers = maxPlayers;
  this.mapName = mapName;
  this.id = id;
  this.players = [];
  this.timeLeft = 15;
  this.timer;
  this.gameTime = 10;
  this.beginGame = false;
  this.gameOver = false;
  this.started = false;
}

TagGame.prototype.update = function() {
  if (this.players.length < 3) {
    this.gameOver = true;
  }
  if (this.gameTime > 0)
    this.gameTime -= 0.01;
  if(this.gameTime <= 0 && !this.beginGame) {
    this.gameTime = 90;
    this.beginGame = true;
  }
  if(this.gameTime <= 0 && this.beginGame) {
    this.gameOver = true;
  }
}

TagGame.prototype.start = function(io) {
  console.log(this.players);
  this.started = true;
  for (var i = 0; i < this.players.length; i++) {
    this.players[i].color = 0xffffff;
  }
  var randomPlayer = Math.floor(Math.random() * this.players.length);
  this.players[randomPlayer].color = 0xff0000;
  io.in(this.id).emit('loadTag', {id: this.id});
  io.in(this.id).emit('updateTag', {gameObjects: this.players, time: Math.floor(this.gameTime) + 1, start: this.beginGame, gameOver: this.gameOver});
};

TagGame.prototype.broadcastUpdate = function(io) {
  io.in(this.id).emit('updateTag', {gameObjects: this.players, time: Math.floor(this.gameTime) + 1, start: this.beginGame, gameOver: this.gameOver});
};

TagGame.prototype.handleCollision = function(data) {
  var firstPlayer = this.players[getPlayer(this.players, data.playerOne)];
  var secondPlayer = this.players[getPlayer(this.players, data.playerTwo)];
  if (firstPlayer.color === 0xff0000 || secondPlayer.color === 0xff0000) {
    if (firstPlayer.color != 0x33cc33 && secondPlayer.color != 0x33cc33) {
      for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].color === 0x33cc33) {
          this.players[i].color = 0xffffff;
        }
      }
      if (firstPlayer.color === 0xff0000) {
        firstPlayer.color = 0x33cc33;
        secondPlayer.color = 0xff0000;
      } else {
        firstPlayer.color = 0xff0000;
        secondPlayer.color = 0x33cc33;
      }
    }
  }
};

TagGame.prototype.removePlayer = function(name, io) {
  var index = getPlayer(this.players, name);
  var newIt = false;
  if (index > -1) {
    if (this.started) {
      if (this.players[index].color === 0xff0000)
        newIt = true;
      io.in(this.id).emit('removeTagPlayer', {player: name});
    }
    this.players.splice(index, 1);
    if (newIt) {
      var randomPlayer = Math.floor(Math.random() * this.players.length);
      this.players[randomPlayer].color = 0xff0000;
    }
  }
};

TagGame.prototype.endGame = function(io) {
  io.in(this.id).emit('endTag', '');
}

function getPlayer(players, name) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].name === name)
            return i;
    };
    return -1;
};
exports.TagGame = TagGame;
