/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function MPGauge(capacity)
{
	this.color = CreateColor(0, 80, 160, 255);
	
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
			Abort("BattleHUD.drawText(): Invalid text alignment '" + alignment + "'.");
		}
		x = alignments[alignment](font, x, text);
		font.setColorMask(CreateColor(0, 0, 0, color.alpha));
		font.drawText(x + shadowDistance, y + shadowDistance, text);
		font.setColorMask(color);
		font.drawText(x, y, text);
	};
}

MPGauge.prototype.draw = function(x, y, width, height)
{
	var oldClip = GetClippingRectangle();
	SetClippingRectangle(x, y, width, height);
	var maxRadius = Math.ceil(width * Math.sqrt(2) / 2);
	var innerFillColor = this.color;
	var outerFillColor = BlendColors(innerFillColor, CreateColor(0, 0, 0, 255));
	var outerUsageColor = this.usageColor;
	var innerUsageColor = BlendColors(outerUsageColor, CreateColor(0, 0, 0, 255));
	GradientCircle(x + width / 2, y + height / 2, maxRadius * (this.reading + this.usage) / this.capacity, innerUsageColor, outerUsageColor);
	GradientCircle(x + width / 2, y + height / 2, maxRadius * this.reading / this.capacity, innerFillColor, outerFillColor);
	this.drawText(this.font, x + width - 39, y + height - 17, 1, CreateColor(255, 192, 0, 255), "MP");
	this.drawText(this.font, x + width - 4, y + height - 15, 1, CreateColor(255, 255, 255, 255), this.reading, 'right');
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
