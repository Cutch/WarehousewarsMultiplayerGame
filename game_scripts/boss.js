var enemyId = 1;
var playerNum = 1;
var enemyNum = 2;
var boxNum = 3;
var wallNum = 4;
var bossNum = 5;
var directionList = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
// -- Start Boss Class --
function Boss (x, y, parentClass, objectId, tlimg, trimg, blimg, brimg, deadImg) {
	this.objectId = objectId;
    this.x = x;
    this.y = y;
	this.tlimg = tlimg;
	this.trimg = trimg;
	this.blimg = blimg;
	this.brimg = brimg;
	this.id = bossNum;
	this.enemyId = enemyId++;
	this.ticks = 0;
	this.dead = false;
	this.alreadyMovedThisTurn = false;
	this.deadImg = deadImg;
	this.parentClass = parentClass;
	if(parentClass != null){
		this.parentClass.gameBoard[this.y][this.x] = this;
		this.parentClass.gameBoard[this.y+1][this.x] = this;
		this.parentClass.gameBoard[this.y][this.x+1] = this;
		this.parentClass.gameBoard[this.y+1][this.x+1] = this;
	}
}
Boss.prototype.draw = function(ctxt) {
	ctxt.drawImage(this.tlimg, this.x*30, 3+this.y*30, 30, 30);
	ctxt.drawImage(this.blimg, this.x*30, 3+(this.y+1)*30, 30, 30);
	ctxt.drawImage(this.trimg, (this.x+1)*30, 3+this.y*30, 30, 30);
	ctxt.drawImage(this.brimg, (this.x+1)*30, 3+(this.y+1)*30, 30, 30);
}
Boss.prototype.checkMove = function(x, y) {
	var p = this.parentClass.gameBoard[y][x];
	if(p != 0) { // Top Left
		if((p.id == enemyNum || p.id == bossNum) && p.enemyId != this.enemyId) return false;
		if(p.id == wallNum) return false;
		if(p.id == boxNum){
			var canMove = false;
			var d = directionList[0];
			canMove = p.checkMove(d[0], d[1], 1);
			if(!canMove){
				d = directionList[6];
				canMove = p.checkMove(d[0], d[1], 1);
			}
			if(!canMove) return false;
		}
	}
	p = this.parentClass.gameBoard[y][x+1];
	if(p != 0) { // Top Right
		if((p.id == enemyNum || p.id == bossNum) && p.enemyId != this.enemyId) return false;
		if(p.id == wallNum) return false;
		if(p.id == boxNum){
			var canMove = false;
			var d = directionList[0];
			canMove = p.checkMove(d[0], d[1], 1);
			if(!canMove){
				d = directionList[2];
				canMove = p.checkMove(d[0], d[1], 1);
			}
			if(!canMove) return false;
		}
	}
	p = this.parentClass.gameBoard[y+1][x+1];
	if(p != 0) { // Bottom Right
		if((p.id == enemyNum || p.id == bossNum) && p.enemyId != this.enemyId) return false;
		if(p.id == wallNum) return false;
		if(p.id == boxNum){
			var canMove = false;
			var d = directionList[4];
			canMove = p.checkMove(d[0], d[1], 1);
			if(!canMove){
				d = directionList[2];
				canMove = p.checkMove(d[0], d[1], 1);
			}
			if(!canMove) return false;
		}
	}
	p = this.parentClass.gameBoard[y+1][x];
	if(p != 0) { // Bottom Left
		if((p.id == enemyNum || p.id == bossNum) && p.enemyId != this.enemyId) return false;
		if(p.id == wallNum) return false;
		if(p.id == boxNum){
			var canMove = false;
			var d = directionList[6];
			canMove = p.checkMove(d[0], d[1], 1);
			if(!canMove){
				d = directionList[4];
				canMove = p.checkMove(d[0], d[1], 1);
			}
			if(!canMove) return false;
		}
	}
	return true;
}
Boss.prototype.moveBoxes = function(x, y) {
	var ret;
	var p = this.parentClass.gameBoard[y][x];
	if(p != 0){
		if((p.id == enemyNum || p.id == bossNum) && p.enemyId != this.enemyId) return false;
		if(p.id == wallNum) return false;
		if(p.id == boxNum){ // Top Left
			var canMove = false;
			var d = directionList[0];
			ret = p.move(d[0], d[1], 1);
			canMove = ret[0];
			if(canMove) this.parentClass.objToMove=this.parentClass.objToMove.concat(ret[1]);
			if(!canMove){
				d = directionList[6];
				ret = p.move(d[0], d[1], 1);
				canMove = ret[0];
				if(canMove) this.parentClass.objToMove=this.parentClass.objToMove.concat(ret[1]);
			} 
			if(!canMove) return false;
		}
	}
	p = this.parentClass.gameBoard[y][x+1];
	if(p != 0){
		if((p.id == enemyNum || p.id == bossNum) && p.enemyId != this.enemyId) return false;
		if(p.id == wallNum) return false;
		if(p.id == boxNum){ // Top Right
			var canMove = false;
			var d = directionList[0];
			ret = p.move(d[0], d[1], 1);
			canMove = ret[0];
			if(canMove) this.parentClass.objToMove=this.parentClass.objToMove.concat(ret[1]);
			if(!canMove){
				d = directionList[2];
				ret = p.move(d[0], d[1], 1);
				canMove = ret[0];
				if(canMove) this.parentClass.objToMove=this.parentClass.objToMove.concat(ret[1]);
			}
			if(!canMove) return false;
		}
	}
	p = this.parentClass.gameBoard[y+1][x+1];
	if(p != 0){ 
		if((p.id == enemyNum || p.id == bossNum) && p.enemyId != this.enemyId) return false;
		if(p.id == wallNum) return false;
		if(p.id == boxNum){ // Bottom Right
			var canMove = false;
			var d = directionList[4];
			ret = p.move(d[0], d[1], 1);
			canMove = ret[0];
			if(canMove) this.parentClass.objToMove=this.parentClass.objToMove.concat(ret[1]);
			if(!canMove){
				d = directionList[2];
				ret = p.move(d[0], d[1], 1);
				canMove = ret[0];
				if(canMove) this.parentClass.objToMove=this.parentClass.objToMove.concat(ret[1]);
			}
			if(!canMove) return false;
		}
	}
	p = this.parentClass.gameBoard[y+1][x];
	if(p != 0){
		if((p.id == enemyNum || p.id == bossNum) && p.enemyId != this.enemyId) return false;
		if(p.id == wallNum) return false;
		if(p.id == boxNum){ // Bottom Left
			var canMove = false;
			var d = directionList[6];
			ret = p.move(d[0], d[1], 1);
			canMove = ret[0];
			if(canMove) this.parentClass.objToMove=this.parentClass.objToMove.concat(ret[1]);
			if(!canMove){
				d = directionList[4];
				ret = p.move(d[0], d[1], 1);
				canMove = ret[0];
				if(canMove) this.parentClass.objToMove=this.parentClass.objToMove.concat(ret[1]);
			}
			if(!canMove) return false;
		}
	}
	return true;
}
Boss.prototype.die = function() {
	this.tlimg = this.deadImg;
	this.trimg = this.deadImg;
	this.blimg = this.deadImg;
	this.brimg = this.deadImg;
	this.dead = true;
}
Boss.prototype.move = function() {
	if(this.dead) return false
	if(this.alreadyMovedThisTurn) { this.alreadyMovedThisTurn=false; return !this.dead;};
	var c;
	var start;
	do{
		c = Math.floor(Math.random()*8);
	}while(c == 8);
	start = c;
	
	var d;
	var check;
	do{
		c++;
		c %= 8;
		d = directionList[c];
	} while(!(check=this.checkMove(this.x+d[0],this.y-d[1], 1)) && c != start);
	if(check){
		this.moveBoxes(this.x+d[0],this.y-d[1], 1);
		this.parentClass.gameBoard[this.y][this.x] = 0;
		this.parentClass.gameBoard[this.y+1][this.x] = 0;
		this.parentClass.gameBoard[this.y][this.x+1] = 0;
		this.parentClass.gameBoard[this.y+1][this.x+1] = 0;
		this.x += d[0];
		this.y -= d[1];
		this.parentClass.gameBoard[this.y][this.x] = this;
		this.parentClass.gameBoard[this.y+1][this.x] = this;
		this.parentClass.gameBoard[this.y][this.x+1] = this;
		this.parentClass.gameBoard[this.y+1][this.x+1] = this;
		
		var deadPlayers = [];
		var pl = this.parentClass.playerList;
		var p;
		for(c=0; c < 4; c++){
			if(pl[c] != null){
				p = pl[c][1];
				if(p.x >= this.x && p.y >= this.y && p.x <= this.x+1 && p.y <= this.y+1){
					deadPlayers[deadPlayers.length] = [p.objectId, 1];
					p.die();
				}
			}
		}
		if(deadPlayers.length > 0)
			this.parentClass.broadcast(JSON.stringify([5, deadPlayers])); // Send 
	
		this.parentClass.objToMove[this.parentClass.objToMove.length] = [this.x, this.y, this.objectId];
	}else{
		this.parentClass.score += 500;
		this.parentClass.broadcast(JSON.stringify([6, this.parentClass.score])); 
		this.die();
		this.parentClass.broadcast(JSON.stringify([5, [[this.objectId, 1]]]));
		return false;
	}
	return true;
}
// -- End Boss Class --
if(typeof module !== "undefined")
	module.exports = Boss;
