function SpriteImage(filename)
{
	this.spriteset = LoadSpriteset(filename);
	this.xOff = 0; //-(this.spriteset.base.x1 + Math.round((this.spriteset.base.x2 + 1 - this.spriteset.base.x1) / 2));
	this.yOff = 0; //-(this.spriteset.base.y2 + 1);
	this.directionID = 0;
	this.frameID = 0;
	this.elapsedFrames = 0;
	this.stopped = false;
	
	var get_direction = function() {
		return this.spriteset.directions[this.directionID].name;
	};
	var set_direction = function(value) {
		var index = this.spriteset.directions.length;
		var wasFound = false;
		while (--index >= 0) {
			if (this.spriteset.directions[index].name == value) {
				wasFound = true;
				this.directionID = index;
				this.reset();
				break;
			}
		}
		if (!wasFound) {
			Abort("SpriteImage(): Direction \"" + value + "\" not found in spriteset!");
		}
	};
	if (typeof Object.defineProperty === 'function') {
		Object.defineProperty(this, 'direction', {
			configurable: false,
			get: get_direction,
			set: set_direction });
	} else {
		this.__defineGetter__('direction', get_direction);
		this.__defineSetter__('direction', set_direction);
	}
	
	this.blit = function(x, y, alpha)
	{
		alpha = alpha !== void null ? alpha : 255;
		
		this.spriteset.images[this.spriteset.directions[this.directionID].frames[this.frameID].index]
			.blitMask(x + this.xOff, y + this.yOff, CreateColor(255, 255, 255, alpha));
	};
	
	this.reset = function()
	{
		this.frameID = 0;
		this.elapsedFrames = 0;
	};
	
	this.resume = function()
	{
		this.stopped = false;
	};
	
	this.stop = function()
	{
		this.stopped = true;
	};
	
	this.update = function()
	{
		if (!this.stopped) {
			var frames = this.spriteset.directions[this.directionID].frames;
			if (this.elapsedFrames >= frames[this.frameID].delay) {
				this.frameID = (this.frameID + 1) % frames.length;
				this.elapsedFrames = 0;
			}
			else {
				++this.elapsedFrames;
			}
		}
	};
};
