/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

class SpriteImage
{
	constructor(filename)
	{
		this.spriteset = LoadSpriteset(filename);
		this.xOff = 0; //-(this.spriteset.base.x1 + Math.round((this.spriteset.base.x2 + 1 - this.spriteset.base.x1) / 2));
		this.yOff = 0; //-(this.spriteset.base.y2 + 1);
		this.directionID = 0;
		this.frameID = 0;
		this.elapsedFrames = 0;
		this.stopped = false;
	}

	get direction()
	{
		return this.spriteset.directions[this.directionID].name;
	}

	set direction(value)
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
		if (!wasFound)
			throw new ReferenceError(`direction '${value}' not found in spriteset!`);
	}

	blit(x, y, alpha = 255)
	{
		this.spriteset.images[this.spriteset.directions[this.directionID].frames[this.frameID].index]
			.blitMask(x + this.xOff, y + this.yOff, CreateColor(255, 255, 255, alpha));
	}

	reset()
	{
		this.frameID = 0;
		this.elapsedFrames = 0;
	}

	resume()
	{
		this.stopped = false;
	}

	stop()
	{
		this.stopped = true;
	}

	update()
	{
		if (this.stopped)
			return;
		var frames = this.spriteset.directions[this.directionID].frames;
		if (this.elapsedFrames >= frames[this.frameID].delay) {
			this.frameID = (this.frameID + 1) % frames.length;
			this.elapsedFrames = 0;
		}
		else {
			++this.elapsedFrames;
		}
	}
}
