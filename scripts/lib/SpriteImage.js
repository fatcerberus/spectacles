function SpriteImage(filename)
{
	this.spriteset = LoadSpriteset(filename);
	this.directionID = 0;
	this.frameID = 0;
	this.elapsedFrames = 0;
	this.stopped = false;
	
	this.__defineGetter__('direction', function()
	{
		return this.spriteset.directions[this.directionID].name;
	});
	/*this.direction getter = function()
	{
		return this.spriteset.directions[this.directionID].name;
	};*/
	
	//this.direction setter = function(value)
	this.__defineSetter__('direction', function(value)
	{
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
	});
	
	this.blit = function(x, y, alpha)
	{
		alpha = alpha !== void null ? alpha : 255;
		
		this.spriteset.images[this.spriteset.directions[this.directionID].frames[this.frameID].index]
			.blitMask(x, y, CreateColor(255, 255, 255, alpha));
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
