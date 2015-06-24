// -- Start Flame Class --
var enemyNum = 2;
function Flame (x, y, parentClass, img) {
    this.x = x;
    this.y = y;
	this.img = img;
	this.id = enemyNum;
	this.enemyId = -2;
	this.parentClass = parentClass;
	this.parentClass.gameBoard[y][x] = this;
}
Flame.prototype.draw = function(ctxt) {
	ctxt.drawImage(this.img, this.x*30, this.y*30, 30, 30);
}
// -- End Flame Class --
if(typeof module !== "undefined")
	module.exports = Flame;