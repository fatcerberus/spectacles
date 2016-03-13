/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function MPGauge(capacity, color)
{
	color !== void null ? color : CreateColor(128, 128, 128, 255);
	
	this.color = color;
	this.textFont = GetSystemFont();
	
	this.animation = null;
	this.capacity = capacity;
	this.reading = capacity;
	this.usage = 0;
	this.usageColor = CreateColor(0, 0, 0, 0);
	this.value = capacity;
	
	this.drawText = function(font, x, y, shadowDistance, color, text, alignment)
	{
		var alignments = {
			left: function(font, x, text) { return x; },
			center: function(font, x, text) { return x - font.getStringWidth(text) / 2; },
			right: function(font, x, text) { return x - font.getStringWidth(text); }
		};
		
		alignment = alignment !== void null ? alignment : 'left';
		
		if (!(alignment in alignments)) {
			Abort("MPGauge.drawText(): Invalid text alignment '" + alignment + "'.");
		}
		x = alignments[alignment](font, x, text);
		font.setColorMask(CreateColor(0, 0, 0, color.alpha));
		font.drawText(x + shadowDistance, y + shadowDistance, text);
		font.setColorMask(color);
		font.drawText(x, y, text);
	};
}

MPGauge.prototype.draw = function(x, y, size)
{
	var oldClip = GetClippingRectangle();
	SetClippingRectangle(x, y, size, size);
	if (this.capacity > 0) {
		var innerFillColor = this.color;
		var outerFillColor = BlendColors(this.color, CreateColor(0, 0, 0, this.color.alpha));
		var outerUsageColor = this.usageColor;
		var innerUsageColor = BlendColors(this.usageColor, CreateColor(0, 0, 0, this.usageColor.alpha));
		var maxRadius = Math.ceil(size * Math.sqrt(2) / 2);
		GradientCircle(x + size / 2, y + size / 2, maxRadius * (this.reading + this.usage) / this.capacity, innerUsageColor, outerUsageColor);
		GradientCircle(x + size / 2, y + size / 2, maxRadius * this.reading / this.capacity, innerFillColor, outerFillColor);
		this.drawText(this.textFont, x + size - 21, y + size / 2 - 8, 1, CreateColor(255, 255, 255, 255), Math.round(this.reading), 'right');
		this.drawText(this.textFont, x + size - 20, y + size / 2 - 4, 1, CreateColor(255, 192, 0, 255), "MP");
	}
	SetClippingRectangle(oldClip.x, oldClip.y, oldClip.width, oldClip.height);
};

MPGauge.prototype.set = function(value)
{
	value = Math.min(Math.max(value, 0), this.capacity);
	if (value != this.value) {
		if (this.animation != null) {
			this.animation.stop();
		}
		this.animation = new scenes.Scene()
			.fork()
				.tween(this, 0.25, 'easeInOutSine', { usage: this.reading - value })
			.end()
			.fork()
				.tween(this, 0.25, 'easeInOutSine', { reading: value })
			.end()
			.tween(this.usageColor, 0.1, 'easeInOutSine', this.color)
			.tween(this.usageColor, 0.5, 'easeInOutSine', CreateColor(0, 0, 0, 0))
			.run();
	}
	this.value = value;
};

MPGauge.prototype.update = function()
{
	if (this.animation != null && !this.animation.isRunning()) {
		this.usage = 0;
	}
};
