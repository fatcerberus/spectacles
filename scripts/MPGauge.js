/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function MPGauge(capacity)
{
	this.color = CreateColor(128, 64, 128, 255);
	
	this.capacity = capacity;
	this.font = GetSystemFont();
	this.reading = capacity;
	this.usage = 0;
	this.usageColor = CreateColor(0, 0, 0, 0);
	
	this.drawText = function(font, x, y, shadowDistance, color, text, alignment) {
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
		var outerFillColor = BlendColors(this.color, CreateColor(0, 0, 0, 255));
		var outerUsageColor = this.usageColor;
		var innerUsageColor = BlendColors(this.usageColor, CreateColor(0, 0, 0, 255));
		Rectangle(x, y, size, size, outerFillColor);
		var maxRadius = Math.ceil(size * Math.sqrt(2) / 2);
		GradientCircle(x + size / 2, y + size / 2, maxRadius * (this.reading + this.usage) / this.capacity, innerUsageColor, outerUsageColor, true);
		GradientCircle(x + size / 2, y + size / 2, maxRadius * this.reading / this.capacity, innerFillColor, outerFillColor, true);
		this.drawText(this.font, x + size / 2 - 22, y + size / 2 - 6, 1, CreateColor(255, 192, 0, 255), "MP");
		this.drawText(this.font, x + size / 2 + 22, y + size / 2 - 6, 1, CreateColor(255, 255, 255, 255), this.reading, 'right');
	}
	SetClippingRectangle(oldClip.x, oldClip.y, oldClip.width, oldClip.height);
};

MPGauge.prototype.set = function(value)
{
	value = Math.min(Math.max(value, 0), this.capacity);
	if (value < this.reading) {
		new Scenario()
			.tween(this.usageColor, 0.1, 'easeInOutSine', CreateColor(0, 96, 192, 255))
			.tween(this.usageColor, 0.5, 'easeInOutSine', CreateColor(0, 0, 0, 0))
			.run();
		this.usage = this.reading - value;
	}
	this.reading = value;
};

MPGauge.prototype.update = function()
{
};
