var player;
var playerNum = 1;
var enemyNum = 2;
var boxNum = 3;
var wallNum = 4;
var bossNum = 5;
// -- Start Player Class --
function Player (x, y, parentClass, objectId, playerNumber, img, deadImg) {
	this.objectId = objectId;
	this.playerNumber = playerNumber;
    this.x = x;
    this.y = y;
	this.moveX = 0;
	this.moveY = 0;
	this.img = img;
	this.deadImg = deadImg;
	this.dead = false;
	this.id = playerNum;
	this.playerSharing = [null, null, null];
	this.isSharing = false;
	this.parentClass = parentClass;
	if(parentClass != null)
		this.parentClass.gameBoard[this.y][this.x] = this;
}
Player.prototype.draw = function(ctxt, size) {
	if(typeof size === "undefined")
		ctxt.drawImage(this.img, 3+this.x*30, 3+this.y*30, 24, 24);
	else
		ctxt.drawImage(this.img, 0, 0, size[0], size[1], 3+this.x*30, 3+this.y*30, size[0], size[1]);
}
Player.prototype.remove = function() {
	this.parentClass.gameBoard[this.y][this.x] = 0;
}
Player.prototype.die = function() {
	this.img = this.deadImg;
	this.dead = true;
}
Player.prototype.playerWantsToShare = function(p, recurse) {
	var i;
	var n = 0;
	if(recurse){
		for(i=0; i < 3; i++){
			if(this.playerSharing[i] != null){
				this.playerSharing[i].playerWantsToShare(p, false);
				p.playerSharing[n++]=this.playerSharing[i];
			}
		}
	}
	for(i=0; i < 3; i++){
		if(this.playerSharing[i] == null){
			this.playerSharing[i]=p;
			break;
		}
	}
	if(recurse){
		p.playerSharing[n++]=this;
		this.isSharing = true;
		p.isSharing = true;
	}
}
Player.prototype.playerWantsToLeave = function(p, tellOthers) {
	if(!this.isSharing) return;
	var i;
	var n = 0;
	var ret = null;
	for(i=0; i < 3; i++)
		if(this.playerSharing[i] != null){
			if(tellOthers){
				this.playerSharing[i].playerWantsToLeave(this, false);
				ret = this.playerSharing[i];
				this.playerSharing[i] = null;
			}
			else if(p.objectId == this.playerSharing[i].objectId){
				this.playerSharing[i] = null;
			}else n++; // Otherwise has a friend
		}
	if(n == 0)
		this.isSharing = false;
	return ret;
}
Player.prototype.move = function() {
	if(this.dead) return [false];
	var objToMove = [];
	var lastX = this.x;
	var lastY = this.y;
	this.x += this.moveX;
	this.y -= this.moveY;
	var obj = this.parentClass.gameBoard[this.y][this.x];
	if(obj.id == boxNum){
		var r = obj.move(this.moveX,this.moveY,99);
		objToMove = r[1];
		if(!r[0]){
			this.x = lastX;
			this.y = lastY;
		}
	}else if(obj.id == wallNum){
		this.x = lastX;
		this.y = lastY;
	}else if(obj.id == enemyNum || obj.id == bossNum){
		if(obj.dead){
			this.x = lastX;
			this.y = lastY;
		}else{
			this.moveX = 0;
			this.moveY = 0;
			// Move enemy so not on top
			obj.move();
			obj.alreadyMovedThisTurn = true;
			if(lastY != this.y || lastX != this.x){
				var ret = this.playerWantsToLeave(null, true);
				if(ret != null)
					this.parentClass.gameBoard[lastY][lastX] = ret;
				else
					this.parentClass.gameBoard[lastY][lastX] = 0;
			}
			this.parentClass.gameBoard[this.y][this.x] = this;
			objToMove[objToMove.length] = [this.x, this.y, this.objectId];
			this.die();
			this.parentClass.broadcast(JSON.stringify([5, [[this.objectId, 1]]])); // Send change of state
			return [false];
		}
	}
	this.moveX = 0;
	this.moveY = 0;
	this.parentClass.gameBoard[this.y][this.x] = this;
	if(this.y != lastY || lastX != this.x){ // Is moving
		objToMove[objToMove.length] = [this.x, this.y, this.objectId];
		var ret = this.playerWantsToLeave(null, true);
		if(ret != null)
			this.parentClass.gameBoard[lastY][lastX] = ret;
		else
			this.parentClass.gameBoard[lastY][lastX] = 0;
		if(obj.id == playerNum){
			obj.playerWantsToShare(this, true);
		}
	}
	return [true, objToMove];
}
Player.prototype.setMove = function(x, y) { this.moveX = x; this.moveY = y; }
Player.prototype.moveUp = function() { this.moveY = 1; }
Player.prototype.moveRight = function() { this.moveX = 1; }
Player.prototype.moveDown = function() { this.moveY = -1; }
Player.prototype.moveLeft = function() { this.moveX = -1; }

// -- End Player Class --
if(typeof module !== "undefined")
	module.exports = Player;