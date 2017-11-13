// adapted from https://github.com/dci05049/Phaser-Multiplayer-Game-Tutorial/tree/master/Part1/
var socket; 
socket = io.connect();
var wKey;
var aKey;
var sKey;
var dKey;

canvas_width = window.innerWidth * window.devicePixelRatio;
canvas_height = window.innerHeight * window.devicePixelRatio;

const game = new Phaser.Game(canvas_width,canvas_height, Phaser.CANVAS, 'gameDiv');

//the enemy player list 
let enemies = {};

let gameProperties = { 
  gameWidth: 1000,
  gameHeight: 1000,
  game_elemnt: "gameDiv",
  in_game: false,
};

let main = function(game){
};

function onsocketConnected () {
  console.log("connected to server"); 
  createPlayer();
  gameProperties.in_game = true;
  // send the server our initial position and tell it we are connected
  socket.emit('new_player', {x: 0, y: 0, angle: 0});
}

// When the server notifies us of client disconnection, we find the disconnected
// enemy and remove from our game
function onRemovePlayer (data) {
  var removePlayer = findplayerbyid(data.id);
  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id)
    return;
  }

  removePlayer.player.destroy();
  //enemies.splice(enemies.indexOf(removePlayer), 1);
  delete enemies[data.id];
}

function createPlayer () {
  player = game.add.graphics(0, 0);
  player.radius = 100;

  // set a fill and line style
  player.beginFill(0xffd900);
  player.lineStyle(2, 0xffd900, 1);
  player.drawCircle(0, 0, player.radius * 2);
  player.endFill();
  player.anchor.setTo(0.5,0.5);
  player.body_size = player.radius; 

  // draw a shape
  game.physics.p2.enableBody(player, true);
  player.body.clearShapes();
  player.body.addCircle(player.body_size, 0 , 0); 
  player.body.data.shapes[0].sensor = true;
}

// this is the enemy class. 
var remote_player = function (id, startx, starty, start_angle) {
  this.x = startx;
  this.y = starty;
  //this is the unique socket id. We use it as a unique name for enemy
  this.id = id;
  this.angle = start_angle;

  this.player = game.add.graphics(this.x , this.y);
  this.player.radius = 100;

  // set a fill and line style
  this.player.beginFill(0xffd900);
  this.player.lineStyle(2, 0xffd900, 1);
  this.player.drawCircle(0, 0, this.player.radius * 2);
  this.player.endFill();
  this.player.anchor.setTo(0.5,0.5);
  this.player.body_size = this.player.radius; 

  // draw a shape
  game.physics.p2.enableBody(this.player, true);
  this.player.body.clearShapes();
  this.player.body.addCircle(this.player.body_size, 0 , 0); 
  this.player.body.data.shapes[0].sensor = true;
}

//Server will tell us when a new enemy player connects to the server.
//We create a new enemy in our game.
function onNewPlayer (data) {
  console.log(data);
  //enemy object 
  var newEnemy = new remote_player(data.id, data.x, data.y, data.angle); 
  enemies[data.id] = newEnemy;
}

//Server tells us there is a new enemy movement. We find the moved enemy
//and sync the enemy movement with the server
function onEnemyMove (data) {
  console.log(data.id);
  console.log(enemies);
  var movePlayer = findplayerbyid (data.id); 

  if (!movePlayer) {
    return;
  }
  movePlayer.player.body.x = data.x; 
  movePlayer.player.body.y = data.y; 
  movePlayer.player.angle = data.angle; 
}

//This is where we use the socket id. 
//Search through enemies list to find the right enemy of the id.
function findplayerbyid (id) {
  /*for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			return enemies[i]; 
		}
	}*/
  // my implementation 
  if(enemies[id]) return enemies[id];
}


main.prototype = {
  preload: function() {
    game.stage.disableVisibilityChange = true;
    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.world.setBounds(0, 0, gameProperties.gameWidth, gameProperties.gameHeight, false, false, false, false);
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setBoundsToWorld(false, false, false, false, false)
    game.physics.p2.gravity.y = 9.81;
    game.physics.p2.applyGravity = true; 
    game.physics.p2.enableBody(game.physics.p2.walls, false); 
    // physics start system
    game.physics.p2.setImpactEvents(true);

    // add keys to watch and assign function
    wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    wKey.onDown.add(movePlayer, this);
    
    aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    aKey.onDown.add(movePlayer, this);
    
    sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
    sKey.onDown.add(movePlayer, this);
    
    dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    dKey.onDown.add(movePlayer, this);
  },

  create: function () {
    game.stage.backgroundColor = 0xE1A1A1;
    
    //some instructions
    game.add.text(0, 0, 'WASD to move. Collide with things.', {});

    console.log("client started");
    socket.on("connect", onsocketConnected); 

    //listen to new enemy connections
    socket.on("new_enemyPlayer", onNewPlayer);
    //listen to enemy movement 
    socket.on("enemyMove", onEnemyMove);

    // when received remove_player, remove the player passed; 
    socket.on('remove_player', onRemovePlayer); 
  },

  update: function () {
    // emit the player input

    // check if mouse is inside game window before moving
    if (game.input.activePointer.withinGame) {
      gameProperties.in_game = true;
      game.input.enabled = true;
      
      // change color to let them know they're in focus
      game.stage.backgroundColor = 0xE1A193;

      //Send a new position data to the server 
      socket.emit('move_player', {x: player.x, y: player.y, angle: player.angle});
    }
    
    else{
      gameProperties.in_game = false;
      game.input.enabled = false;      
      
      game.stage.backgroundColor = 0xE1A1A1;
    }
    
  }
}

class gameBootstrapper {
  init (gaemContainerElementId) {
    game.state.add('main', main);
    game.state.start('main');
  }
}

const gbs = new gameBootstrapper();

gbs.init("gameDiv");