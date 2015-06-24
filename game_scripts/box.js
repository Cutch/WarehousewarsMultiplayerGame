var boxNum = 3;
// -- Start Box Class --
function Box (x, y, parentClass, objectId, img) {
	this.objectId = objectId;
    this.x = x;
    this.y = y;
	this.img = img;
	this.id = boxNum;
	this.parentClass = parentClass;
	if(parentClass != null)
		this.parentClass.gameBoard[y][x] = this;
}
Box.prototype.draw = function(ctxt) {
	ctxt.drawImage(this.img, 3+this.x*30, 3+this.y*30, 24, 24);
}
Box.prototype.checkMove = function(x,y,recurse) {
	if(recurse == 0) return false;
	var next = this.parentClass.gameBoard[this.y - y][this.x + x];
	if(next == 0){
		return true;
	}else if(next.id == boxNum){
		return next.checkMove(x, y, recurse-1);
	} 
	return false;
}
Box.prototype.move = function(x,y,recurse) {
	if(recurse == 0) return [false, []];
	var objToMove = [];
	var next = this.parentClass.gameBoard[this.y - y][this.x + x];
	if(next == 0){
		this.parentClass.gameBoard[this.y - y][this.x + x] = this;
		this.parentClass.gameBoard[this.y][this.x] = 0;
		this.x += x;
		this.y -= y;
		objToMove[objToMove.length] = [this.x, this.y, this.objectId];
		return [true, objToMove];
	}else if(next.id == boxNum){
		var r = next.move(x,y,recurse-1);
		if(r[0]){
			objToMove=r[1];
			this.parentClass.gameBoard[this.y - y][this.x + x] = this;
			this.parentClass.gameBoard[this.y][this.x] = 0;
			this.x += x;
			this.y -= y;
			objToMove[objToMove.length] = [this.x, this.y, this.objectId];
			return [true, objToMove];
		}
	} 
	return [false, []];
}
// -- End Box Class --
if(typeof module !== "undefined")
	module.exports = Box;