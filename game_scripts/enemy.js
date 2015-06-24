var playerNum = 1;
var enemyNum = 2;
var boxNum = 3;
var wallNum = 4;
var bossNum = 5;
var directionList = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
// -- Start Enemy Class --
function Enemy (x, y, parentClass, objectId, img, deadImg) {
	this.objectId = objectId;
    this.x = x;
    this.y = y;
	this.img = img;
	this.id = enemyNum;
	this.enemyId = -1;
	this.ticks = 0;
	this.alreadyMovedThisTurn = false;
	this.dead = false;
	this.deadImg = deadImg;
	this.parentClass = parentClass;
	// Choose a movement Type
	this.enemyMovementType = Math.floor(Math.random()*2); 
	this.lastDirection = Math.floor(Math.random()*8);
	if(parentClass != null)
		this.parentClass.gameBoard[this.y][this.x] = this;
}
Enemy.prototype.draw = function(ctxt) {
	ctxt.drawImage(this.img, 3+this.x*30, 3+this.y*30, 24, 24);
}
Enemy.prototype.die = function() {
	this.img = this.deadImg;
	this.dead = true;
}
Enemy.prototype.checkMove = function() {
	if(this.dead) return false;
	
	var c;
	var start;
	do{
		c = Math.floor(Math.random()*8);
	}while(c == 8);
	start = c;
	
	var d; 
	var v;
	do{
		c++;
		c %= 8;
		d = directionList[c];
		v = this.parentClass.gameBoard[this.y-d[1]][this.x+d[0]];
	} while(((v != 0 && v.id != playerNum) || (v.id == playerNum && v.dead)) && c != start);
	
	if(v == 0 || (v.id == playerNum && !v.dead))
		return false;
	return true;
}
Enemy.prototype.move = function() {
	if(this.dead) return false;
	if(this.alreadyMovedThisTurn) { this.alreadyMovedThisTurn=false; return !this.dead;};

	var c;
	var start;
	switch (this.enemyMovementType){
		case 0:
			do{
				c = Math.floor(Math.random()*8);
			}while(c == 8);
			start = c;
			
			var d; 
			var v;
			do{
				c++;
				c %= 8;
				d = directionList[c];
				v = this.parentClass.gameBoard[this.y-d[1]][this.x+d[0]];
			} while(((v != 0 && v.id != playerNum) || (v.id == playerNum && v.dead)) && c != start);
		break;
		case 1:
			start = this.lastDirection;
			var move = 0;
			var rand = 0;
			var d; 
			var v;
			do{
				if(rand == 1)
					c = start + move;
				else
					c = start - move;
				if(move <= 0){
					rand = Math.floor(Math.random()*2);
					move = Math.abs(move)+1;
				}else 
					move = -move;
				if(c < 0) c+=8;
				else c %= 8;
				d = directionList[c];
				v = this.parentClass.gameBoard[this.y-d[1]][this.x+d[0]];
			} while(((v != 0 && v.id != playerNum) || (v.id == playerNum && v.dead)) && move != -4);
		break;
	}
	this.lastDirection = c;
	if(v == 0 || (v.id == playerNum && !v.dead)){
		this.parentClass.gameBoard[this.y][this.x] = 0;
		this.x += d[0];
		this.y -= d[1];
		this.parentClass.gameBoard[this.y][this.x] = this;
		if(v.id == playerNum){
			var deadPlayers = [];
			var pl = this.parentClass.playerList;
			var p;
			for(c=0; c < 4; c++){
				if(pl[c] != null){
					p = pl[c][1];
					if(p.x == this.x && p.y == this.y){
						deadPlayers[deadPlayers.length] = [p.objectId, 1];
						p.die();
					}
				}
			}
			
			this.parentClass.broadcast(JSON.stringify([5, deadPlayers])); // Send 
		}
		this.parentClass.objToMove[this.parentClass.objToMove.length] = [this.x, this.y, this.objectId];
	}else{
		this.parentClass.score += 50;
		this.parentClass.broadcast(JSON.stringify([6, this.parentClass.score])); 
		this.die();
		this.parentClass.broadcast(JSON.stringify([5, [[this.objectId, 1]]])); // Send change of state
		return false;
	}
	return true;
}
// -- End Enemy Class --
if(typeof module !== "undefined")
	module.exports = Enemy;
