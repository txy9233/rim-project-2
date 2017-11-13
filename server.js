// adapted from https://github.com/dci05049/Phaser-Multiplayer-Game-Tutorial/tree/master/Part1
const express = require('express');

const app = express();
const serv = require('http').Server(app);

const playerList = [];


app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/client/index.html`);
});
app.use('/client', express.static(`${__dirname}/client`));

serv.listen(process.env.PORT || 3000);
console.log('Server started.');


// a player class in the server
class Player {
  constructor(startX, startY, startAngle) {
    this.x = startX;
    this.y = startY;
    this.angle = startAngle;
  }
}


// when a new player connects, we make a new instance of the player object,
// and send a new player message to the client.
function onNewplayer(data) {
  console.log(data);
  // new player instance
  const newPlayer = new Player(data.x, data.y, data.angle);
  console.log(newPlayer);
  console.log(`created new player with id ${this.id}`);
  newPlayer.id = this.id;
  // information to be sent to all clients except sender
  const currentInfo = {
    id: newPlayer.id,
    x: newPlayer.x,
    y: newPlayer.y,
    angle: newPlayer.angle,
  };

  // send to the new player about everyone who is already connected.
  for (let i = 0; i < playerList.length; i++) {
    const existingPlayer = playerList[i];
    const playerInfo = {
      id: existingPlayer.id,
      x: existingPlayer.x,
      y: existingPlayer.y,
      angle: existingPlayer.angle,
    };
    console.log('pushing player');
    // send message to the sender-client only
    this.emit('new_enemyPlayer', playerInfo);
  }

  // send message to every connected client except the sender
  this.broadcast.emit('new_enemyPlayer', currentInfo);
  
  playerList.push(newPlayer);
}

// find player by the the unique socket id
const findPlayerId = (id) => {
  for (let i = 0; i < playerList.length; i++) {
    if (playerList[i].id === id) {
      return playerList[i];
    }
  }

  return false;
};

// update the player position and send the information back to every client except sender
function onMovePlayer(data) {
  const movePlayer = findPlayerId(this.id);
  movePlayer.x = data.x;
  movePlayer.y = data.y;
  movePlayer.angle = data.angle;

  const moveplayerData = {
    id: movePlayer.id,
    x: movePlayer.x,
    y: movePlayer.y,
    angle: movePlayer.angle,
  };

  // send message to every connected client except the sender
  this.broadcast.emit('enemyMove', moveplayerData);
}

// call when a client disconnects and tell the clients except
// sender to remove the disconnected player
function onClientdisconnect() {
  console.log('disconnect');

  const removePlayer = findPlayerId(this.id);

  if (removePlayer) {
    playerList.splice(playerList.indexOf(removePlayer), 1);
  }

  console.log(`removing player ${this.id}`);

  // send message to every connected client except the sender
  this.broadcast.emit('remove_player', { id: this.id });
}


// io connection
const io = require('socket.io')(serv, {});

io.sockets.on('connection', (socket) => {
  console.log('socket connected');

  // listen for disconnection;
  socket.on('disconnect', onClientdisconnect);

  // listen for new player
  socket.on('new_player', onNewplayer);
  // listen for player position update
  socket.on('move_player', onMovePlayer);
});
