var WebSocketServer = require('ws').Server, wss = new WebSocketServer({port: 10440});
var http = require('http');

var playerNum = 1;
var enemyNum = 2;
var boxNum = 3;
var wallNum = 4;
var bossNum = 5;
var gid = 1;
var pid = 1;
var Boss = require("./game_scripts/boss.js");
var Box = require("./game_scripts/box.js");
var Enemy = require("./game_scripts/enemy.js");
var Player = require("./game_scripts/player.js");
var Wall = require("./game_scripts/wall.js");
var numGames = 0;
var GameList = {};
function Game (width, height) {
	this.score = 0;
	this.gameSockets = [];
	this.objectId = 1;
	this.numPlayers = 0;
    this.gameSizeX = width;
    this.gameSizeY = height;
	this.gameId = gid++;
	this.level = 1;
	this.gameover = false;
	this.gameBoard = new Array();
	this.enemyList = [];
	this.playerList = [null, null, null, null];
	this.objToMove = [2];
	this.gameOverChoice = 0;
	this.gameOverChoiceCount = [];
	this.timer = null;
	this.gameDeleteTimer = null;
	numGames++;
	GameList[this.gameId] = this;
	this.onLoad();
}
// Post to a PHP file, get the ranking of the score from the SQL database
Game.prototype.updateScores = function(score){
	var postData = "name=t&score="+score;
	var options = {
	  hostname: 'cslinux.utm.utoronto.ca',
	  port: 80,
	  path: '/~sansonem/a3/sql.php',
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': postData.length
	  }
	};
	var _this = this;
	var req = http.request(options, function(res) {
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
		  ret=JSON.parse(chunk);
		  if(ret[0] == "ok") // ASYNC client update
			_this.broadcast(JSON.stringify([8,ret[1]]));
	  });
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	req.write(postData);
	req.end();
}
// Move all enemies, return false if none are alive
Game.prototype.moveAllEnemies = function(){
	var oneAlive = false;
	var c = this.enemyList.length;
	var i;
	for(i=0; i < c; i++){
		oneAlive |= this.enemyList[i].move();
	}
	return oneAlive;
}
Game.prototype.gameLoop = function() {
	if(!this.moveAllEnemies()){ // Move all enemies
		this.nextLevel(1); // If all dead, next level
		return;
	}
	var oneAlive=false;
	var i;
	for(i=0; i < 4; i++){
		if(this.playerList[i] == null) continue;
		oneAlive |= (!this.playerList[i][1].dead);
	}
	if(!oneAlive && this.numPlayers > 0)
		this.gameOver(false);
	if(this.objToMove.length > 1){ // Send all objects that have moved
		this.broadcast(JSON.stringify(this.objToMove));
		this.objToMove = [2]; // Reset Array
	}
}
// Add boxes
Game.prototype.fillWithBoxes = function(num){
	var i;
	for(i=0; i < num; i++){
		var x;
		var y;
		do{
			x = Math.floor(Math.random()*(this.gameSizeX-2)+1);
			y = Math.floor(Math.random()*(this.gameSizeY-2)+1);
		}while(this.gameBoard[y][x] != 0);
		new Box(x, y, this, this.objectId++);
	}
}
// Add enemies
Game.prototype.fillWithEnemies = function(num){
	this.enemyList = [];
	var i;
	var bossLevel = false;
	if((this.level % 5) == 0){
		bossLevel = true;
		num = (this.level / 5);
	}
	for(i=0; i < num; i++){
		var x;
		var y;
		do{
			do{
				x = Math.floor(Math.random()*(this.gameSizeX-2)+1);
				y = Math.floor(Math.random()*(this.gameSizeY-2)+1);
			}while(Math.abs(this.gameSizeX/2-x) <=3 && Math.abs(this.gameSizeX/3-y) <=2);
		}while(this.gameBoard[y][x] != 0 
			|| (bossLevel && (this.gameBoard[y+1][x] != 0 || this.gameBoard[y][x+1] != 0 || this.gameBoard[y+1][x+1] != 0) ));

		if(bossLevel) // Every five levels is a boss level
			this.enemyList.push(new Boss(x, y, this, this.objectId++));
		else
			this.enemyList.push(new Enemy(x, y, this, this.objectId++));
	}
}
// Reset the game board
Game.prototype.initGameBoard = function(){
	var x;
	var y;
	for(y=0; y<this.gameSizeY; y++){
		this.gameBoard[y]=new Array();
		for(x=0; x<this.gameSizeX; x++){
			this.gameBoard[y][x] = 0;
		}
	}
}
// Add walls
Game.prototype.initWalls = function(){
	var x;
	var y;
	for(x=0;x<this.gameSizeX;x++){
		new Wall(x, 0, this, this.objectId++);
		new Wall(x, this.gameSizeY-1, this, this.objectId++);
	}
	for(y=1;y<this.gameSizeY-1;y++){
		new Wall(0, y, this, this.objectId++);
		new Wall(this.gameSizeX-1, y, this, this.objectId++);
	}
}
// Write the level, players, and objects to a list to be sent
Game.prototype.gameBoardToList = function(){
	var x, y;
	var list = [1, this.numPlayers, this.level, this.score];
	for(x=0; x<4; x++){
		if(this.playerList[x] != null){
			var p = this.playerList[x][1];
			list[list.length]=[p.x, p.y, p.objectId, p.playerNumber, p.dead];
		}
	}
	for(x=0; x<this.gameSizeX; x++){
		for(y=0; y<this.gameSizeY; y++){
			if(this.gameBoard[y][x] != 0 && this.gameBoard[y][x] != playerNum)
				list[list.length]=[x, y, this.gameBoard[y][x].id, this.gameBoard[y][x].objectId];
		}
	}
	return list;
}
Game.prototype.nextBossHACK = function(){
	this.nextLevel(5-(this.level % 5));
}
// Find a free spot in the center of the map
var start = [[0,1],[1,0],[0,-1],[-1,0],[0,0],[1,1],[-1,-1],[0,2],[2,0],[-2,0],[0,-2],[-2,-1],[-1,-2],[2,1],[-2,1],[1,2],[1,-2],[2,2],[-2,2],[2,-2],[-2,-2]];
Game.prototype.findFreePlayerSpot = function(){
	var centerX = Math.floor(this.gameSizeX/2);
	var centerY = Math.floor(this.gameSizeY/2);
	var i;
	for(i = 0; i < start.length;i++){
		if(this.gameBoard[centerY+start[i][1]][centerX+start[i][0]] == 0){
			return [centerX+start[i][0], centerY+start[i][1]];
		}		
	}
	for(i = 0; i < start.length;i++){
		if(this.gameBoard[centerY+start[i][1]][centerX+start[i][0]] == wallNum){
			return [centerX+start[i][0], centerY+start[i][1]];
		}		
	}
	return [1, 1]; // If no free spots, give up and over write the top corner
}
Game.prototype.gameOver = function(win){
	this.gameover = true;
	this.stopTimer();
	var t = this;
	setTimeout(function(){
		if(!t.gameover) return;
		t.numPlayers = 0;
		t.gameOverChoice = 0;
		t.resetGame();
	}, 16500);
	this.broadcast(JSON.stringify([7, win, this.score, this.numPlayers])); // Broadcast Game Over
	this.updateScores(this.score); // Update high score db
}
Game.prototype.resetGame = function(){
	if(this.gameover){
		if((this.numPlayers - this.gameOverChoice) <= 0){
			this.gameover = false;
			this.gameOverChoice = 0;
			this.gameOverChoiceCount = [];
			this.level=0;
			this.score = 0;
			this.nextLevel(1);
			if(this.numPlayers > 0)
				this.startTimer();
			return true;
		}
	}
	return false;
}
// Go to the next level
Game.prototype.nextLevel = function(next){
	this.objectId=1;
	this.enemyList = [];
	this.objToMove = [2];
	this.initGameBoard();
	this.level += next;
	if(this.level > 50){
		this.gameOver(true);
	}
	var i;
	this.initWalls();
	this.fillWithEnemies(this.level+1);
	if((this.level % 5) == 0)
		this.fillWithBoxes(Math.floor(0.45*(this.gameSizeX-2)*(this.gameSizeY-2)));
	else
		this.fillWithBoxes(Math.floor(0.45*(this.gameSizeX-2)*(this.gameSizeY-2)));
	var i, i2;
	for(i=0;i <4;i++){
		if(this.playerList[i] != null){
			for(i2=0; i2 < this.gameSockets.length; i2++){
				if(this.gameSockets[i2][0] == this.playerList[i][0])
					break;
			}
			if(i2 == this.gameSockets.length){
				this.playerList[i] = null;
				continue;
			}
			var p=this.findFreePlayerSpot();
			this.playerList[i][1]=new Player(p[0],p[1],this, this.objectId++, i);
		}
	}
	this.broadcast(JSON.stringify(this.gameBoardToList()));

}
// Called after game initializes
Game.prototype.onLoad = function(){
	this.initGameBoard();
	this.initWalls();
	this.fillWithEnemies(this.level+1);
	this.fillWithBoxes(Math.floor(0.45*(this.gameSizeX-2)*(this.gameSizeY-2)));
	this.gameover = false;
	this.score = 0;
}
// Start stop the game timer, really just for enemy updates
Game.prototype.startTimer = function(){
	var _this = this;
	if(this.timer == null)
		this.timer=setInterval(function () { _this.gameLoop();}, 600);
	if(this.gameDeleteTimer != null)
		clearTimeout(this.gameDeleteTimer);
	this.gameDeleteTimer = null;
}
Game.prototype.stopTimer = function(){
	var t = this;
	if(this.timer != null)
		clearInterval(this.timer);
	this.timer = null;
	if(this.gameDeleteTimer == null)
		this.gameDeleteTimer=setTimeout(function(){ delete GameList[t.gameId]; numGames--; }, 21600000);// 6 Hours
}
// Broadcast message to all clients in this game
Game.prototype.broadcast = function(message){
	var i;
	for(i=0; i < this.gameSockets.length; i++){	
		try{
			this.gameSockets[i][1].send(message);
		}catch(err){ }
	}
}
Game.prototype.removePlayer = function(pid){
	// Remove From Player List
	for(i=0; i < 4; i++){
		if(this.playerList[i] == null) continue;  
		if(this.playerList[i][0] == pid){
			if(!this.playerList[i][1].dead || this.gameOver){
				var p = this.playerList[i][1];
				p.remove();
				this.broadcast(JSON.stringify([4, pid, p.objectId, p.playerNumber])); // Broadcast Player Leave
				this.playerList[i]=null;
			}
			break;
		}
	}
	this.numPlayers--;
	// Remove game Socket
	for(i=0; i < this.gameSockets.length; i++)
		if(this.gameSockets[i][0] == pid){
			this.gameSockets.splice(i, 1);
			break;
		}
	// Stop Game if no ones here
	if(this.numPlayers == 0)
		this.stopTimer();
	// Reset Game if game over
	if(this.gameover){
		if(!this.resetGame()) // Check if game should be reset
			this.broadcast(JSON.stringify([9, this.numPlayers - this.gameOverChoice])); // Broadcast waiting
	}
}
/* -------- End Game Class -------- */

function broadcastALL(message){
	var i;
	for(i=0; i<gameSockets.length; i++)
		gameSockets[i][0].send(message);
}
function getGameList(){
	var i;
	var gameMessage = [0, numGames];
	for(key in GameList){
		var g = GameList[key];
		gameMessage[gameMessage.length] = [g.numPlayers, g.level, g.gameId, g.gameSizeX, g.gameSizeY];
	}
	return gameMessage;
}
// Check enemy reply, game Id
var gameSockets = [];
wss.on('connection', function(ws) {
	var lpid = pid++;
	ws.send(JSON.stringify([-1, lpid])); // Send Player Unique ID
	gameSockets[gameSockets.length] = [ws, lpid, null];
	ws.on('close', function() {
		var i;
		for(i=0; i < gameSockets.length; i++){
			if(gameSockets[i][1] == lpid){
				var gid = gameSockets[i][2];
				gameSockets.splice(i, 1);
				if(gid){
					var g = GameList[gid];
					g.removePlayer(lpid);
				}
				break;
			}
		}
	});
	ws.on('message', function(message) {
		var messageArr = JSON.parse(message);
		switch(messageArr[0]){
		case -1:
			var requestedPid = messageArr[1];
			if(pid <= requestedPid)
				pid = requestedPid+1;
			for(var i=0; i < gameSockets.length; i++){
				if(gameSockets[i][1] == requestedPid){
					ws.send(JSON.stringify([-1, -1]));
					break; // Disallow unique ID
				}
				if(gameSockets[i][1] == lpid){
					gameSockets[i][1]=requestedPid;
					lpid = requestedPid;
					ws.send(JSON.stringify([-1, requestedPid])); // Allow Player Unique ID
				}
			}
			break;
		case 0: /* Create Game */
			var x = messageArr[1];
			var y = messageArr[2];
			if(x < 15) x = 15; if (x > 25) x = 25;
			if(y < 15) y = 15; if (y > 25) y = 25;
			new Game(x, y);
			broadcastALL(JSON.stringify(getGameList())); // Push new games
			break;
		case 1: /* Player Enter */
			var pl;
			var i;
			var pid = messageArr[1];
			var gid = messageArr[2];
			var g = GameList[gid];
			if(g.numPlayers < 0) 
				g.numPlayers = 0;
			if(typeof g === "undefined"){
				ws.send(JSON.stringify([10, 2]));
				return; // Game no longer exists
			}
			if(g.gameover){
				ws.send(JSON.stringify([10, 3]));
				return; // Game is Over
			}
			if(g.numPlayers >= 4){
				ws.send(JSON.stringify([10, 0]));
				return; // Too Many Players
			}
			for(i=0; i < g.gameSockets.length; i++){
				if(pid == -1 || g.gameSockets[i][0] == pid){
					ws.send(JSON.stringify([10, 1]));
					return; // Pid Already in game
				}
			}
			g.numPlayers++;
			var createNewPlayer = true;
			var oneFree = false;
			// Check if dead body is in game
			var pl;
			for(i=0; i < 4; i++){
				if(g.playerList[i] != null && g.playerList[i][0] == pid){
					pl = g.playerList[i][1];
					createNewPlayer = false;
					ws.send(JSON.stringify([-2, i])); // Send PlayerNumber
					break;
				}
				if(g.playerList[i] == null)oneFree=true;
			}
			if(createNewPlayer){
				if(!oneFree){
					g.numPlayers--;
					ws.send(JSON.stringify([10, 0]));
					return;
				}
				var p=g.findFreePlayerSpot();
				for(i=0;i < 4;i++)
					if(g.playerList[i] == null){
						g.playerList[i]=[pid, pl=new Player(p[0],p[1], g, g.objectId++, i)];
						ws.send(JSON.stringify([-2, i])); // Send PlayerNumber
						break;
					}
			}
			g.broadcast(JSON.stringify([3, pl.x, pl.y, pl.objectId, pl.playerNumber, pl.dead]));
			for(i=0; i < gameSockets.length; i++){
				if(gameSockets[i][1] == pid){
					gameSockets[i][2]=gid;
					break;
				}
			}
			// Send game board
			ws.send(JSON.stringify(g.gameBoardToList()));
			g.gameSockets[g.gameSockets.length] = [pid, ws];
			var d = []; // Check if any enemies are dead
			for(i=0; i < g.enemyList.length; i++){
				if(g.enemyList[i].dead){
					d[d.length]=[g.enemyList[i].objectId, 1];
				}
			}
			for(i=0; i < 4; i++){
				if(g.playerList[i] != null && g.playerList[i].dead){
					d[d.length]=[g.playerList[i].objectId, 1];
				}
			}
			if(d.length >= 1)
				ws.send(JSON.stringify([5,d])); // Send enemy if dead
			if(g.numPlayers == 1)
				g.startTimer();
			break;
		case 2: /* Player Move */
			var pid = messageArr[1];
			var gid = messageArr[2];
			var g = GameList[gid];
			var x = messageArr[3];
			var y = messageArr[4];
			var i;
			var oneAlive=false;
			for(i=0; i < 4; i++){
				if(g.playerList[i] == null) continue;
				if(g.playerList[i][0]==pid){
					var p = g.playerList[i][1];
					p.setMove(x, y);
					var r = p.move();
					if(r[0] && r[1].length>0){ // Did move
						r[1].unshift(2);
						g.broadcast(JSON.stringify(r[1])); // Broadcast Player movement
					}
				}
				oneAlive|=!g.playerList[i][1].dead;
			}
			if(!oneAlive && g.numPlayers > 0)
				g.gameOver(false);
			break;
		case 3: /* Player Leave */
			var pid = messageArr[1];
			var gid = messageArr[2];
			var g = GameList[gid];
			var i, gs;
			for(i=0; i < gameSockets.length; i++){
				gs = gameSockets[i];
				if(gs[1] == pid && gs[2] == gid){ // Confirm PLayer in this game
					gameSockets[i][2]=null;
					g.removePlayer(pid);
					break;
				}
			}
			break;
		case 4: /* Request Games */
			var gameMessage = getGameList();
			ws.send(JSON.stringify(gameMessage));
			break;
		case 5: /* Game over continue */
			var pid = messageArr[1];
			var gid = messageArr[2];
			var g = GameList[gid];
			var i =0;
			for(;i<g.gameOverChoiceCount.length;i++)
				if(g.gameOverChoiceCount[i] == pid)
					return;
			g.gameOverChoiceCount[g.gameOverChoiceCount.length]=pid;
			g.gameOverChoice++;
			if(!g.resetGame())
				g.broadcast(JSON.stringify([9, g.numPlayers - g.gameOverChoice])); // Broadcast waiting
			break;
		case 6: /* Game over continue */
			var gid = messageArr[1];
			var g = GameList[gid];
			g.nextBossHACK();
			break;
		}
	});
});