var wallNum = 4;
// -- Start Wall Class --
function Wall (x, y, parentClass, objectId, img) {
	this.objectId = objectId;
	this.x = x;
	this.y = y;
	this.img = img;
	this.id = wallNum;
	this.parentClass = parentClass;
	if(parentClass != null)
		this.parentClass.gameBoard[y][x] = this;
}
Wall.prototype.draw = function(ctxt) {
	ctxt.drawImage(this.img, this.x*30, this.y*30);
}
// -- End Wall Class --
if(typeof module !== "undefined")
	module.exports = Wall;