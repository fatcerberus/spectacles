/**
 * kh2Bar 1.6 for Sphere - (c) 2013 Bruce Pascoe
 * A multi-segment HP gauge styled after the enemy HP bars in Kingdom Hearts 2.
**/

kh2Bar = kh2Bar || {};

// kh2Bar() constructor
// Creates an object representing a Kingdom Hearts 2-style HP gauge.
// Arguments:
//     capacity:   The largest HP value representable by the gauge.
//     sectorSize: Optional. The amount of HP represented by each full bar of the gauge. (default: 100)
//     color:      Optional. The color of the gauge. (default: #00FF00 (Green) @ 100%)
function kh2Bar(capacity, sectorSize, color)
{
	sectorSize = (sectorSize !== void null) ? sectorSize : 100;
	color = (color !== void null) ? color : CreateColor(0, 255, 0, 255);
	
	this.borderColor = CreateColor(0, 0, 0, color.alpha);
	this.capacity = capacity;
	this.damage = 0;
	this.damageColor = CreateColor(192, 0, 0, color.alpha);
	this.damageFadeness = 1.0;
	this.damageFadeDelay = 0.0;
	this.emptyColor = CreateColor(32, 32, 32, color.alpha);
	this.hpColor = color;
	this.reading = this.capacity;
	this.sectorSize = sectorSize;
	
	this.drawSegment = function(x, y, width, height, color) {
		var halfHeight = Math.ceil(height / 2);
		var dimColor = BlendColors(color, CreateColor(0, 0, 0, 255));
		var yHalf = y + Math.floor(height / 2);
		GradientRectangle(x, y, width, halfHeight, dimColor, dimColor, color, color);
		GradientRectangle(x, yHalf, width, halfHeight, color, color, dimColor, dimColor);
	};
}

// .draw() method
// Draws the gauge in its current state on the screen.
// Arguments:
//     x:       The X coordinate of the top left corner of the gauge, in pixels.
//     y:       The Y coordinate of the top left corner of the gauge, in pixels.
//     width:   The width of the gauge, in pixels.
//     height:  The height of the gauge, in pixels.
//     opacity: Optional. The opacity of the gauge from 0.0 to 1.0. (default: 1.0)
kh2Bar.prototype.draw = function(x, y, width, height)
{
	var numReserves = Math.ceil(this.capacity / this.sectorSize - 1);
	var numReservesFilled = Math.ceil(this.reading / this.sectorSize - 1);
	var numReservesDamaged = Math.ceil((this.damage + this.reading) / this.sectorSize - 1);
	var barInUse = this.sectorSize;
	if (numReservesFilled == numReserves) {
		barInUse = this.capacity % this.sectorSize;
		if (barInUse == 0) {
			barInUse = this.sectorSize;
		}
	}
	var barFilled = this.reading % this.sectorSize;
	if (barFilled == 0 && this.reading > 0) {
		barFilled = barInUse;
	}
	var barDamaged = Math.min(this.damage, this.sectorSize - barFilled);
	var usageColor = BlendColorsWeighted(this.emptyColor, this.damageColor, this.damageFadeness, 1.0 - this.damageFadeness);
	var barHeight = Math.ceil(height * 0.5 + 0.5);
	var widthInUse = Math.round((width - 2) * barInUse / this.sectorSize);
	var fillWidth = Math.round(widthInUse * barFilled / barInUse);
	var damageWidth = Math.round(widthInUse * (barFilled + barDamaged) / barInUse) - fillWidth;
	var emptyWidth = widthInUse - (fillWidth + damageWidth);
	if (numReserves > 0) {
		OutlinedRectangle(x, y, width, barHeight, BlendColors(this.borderColor, CreateColor(0, 0, 0, 0)));
		this.drawSegment(x + 1, y + 1, width - 2, barHeight - 2, BlendColors(this.hpColor, CreateColor(0, 0, 0, 0)));
	}
	var barEdgeX = x + width - 1;
	OutlinedRectangle(barEdgeX - widthInUse - 1, y, widthInUse + 2, barHeight, this.borderColor);
	this.drawSegment(barEdgeX - fillWidth, y + 1, fillWidth, barHeight - 2, this.hpColor);
	this.drawSegment(barEdgeX - fillWidth - damageWidth, y + 1, damageWidth, barHeight - 2, usageColor);
	this.drawSegment(barEdgeX - fillWidth - damageWidth - emptyWidth, y + 1, emptyWidth, barHeight - 2, this.emptyColor);
	var slotYSize = height - barHeight + 1;
	var slotXSize = slotYSize + 1;
	var slotX;
	var slotY = y + height - slotYSize;
	for (i = 0; i < numReserves; ++i) {
		var color;
		if (i < numReservesFilled) {
			color = this.hpColor;
		} else if (i < numReservesDamaged) {
			color = usageColor;
		} else {
			color = this.emptyColor;
		}
		slotX = x + (width - slotXSize) - i * (slotXSize - 1);
		OutlinedRectangle(slotX, slotY, slotXSize, slotYSize, this.borderColor);
		this.drawSegment(slotX + 1, slotY + 1, slotXSize - 2, slotYSize - 2, color);
	}
};

// .set() method
// Sets the gauge's current HP reading.
kh2Bar.prototype.set = function(value)
{
	value = Math.min(Math.max(Math.round(value), 0), this.capacity);
	if (value != this.reading) {
		this.damage += this.reading - value;
		this.damageFadeDelay = 0.0;
		this.damageFadeness = 0.0;
		this.reading = value;
	}
};

// .update() method
// Advances internal state by one frame.
kh2Bar.prototype.update = function()
{
	var frameRate = IsMapEngineRunning() ? GetMapEngineFrameRate() : GetFrameRate();
	this.damageFadeDelay -= 1.0 / frameRate;
	if (this.damageFadeDelay <= 0.0) {
		this.damageFadeDelay = 0.0;
		this.damageFadeness += 2.0 / frameRate;
		if (this.damageFadeness >= 1.0) {
			this.damage = 0;
			this.damageFadeDelay = 0.0;
			this.damageFadeness = 1.0;
		}
	}
};
