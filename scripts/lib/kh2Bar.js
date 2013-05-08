/**
 * kh2Bar 1.1 for Sphere - (c) 2013 Bruce Pascoe
 * A multi-segment HP gauge styled after the enemy HP bars in Kingdom Hearts 2.
**/

kh2Bar = kh2Bar || {};

kh2Bar.SECTOR_SIZE = 250;
kh2Bar.BORDER_COLOR = CreateColor(0, 64, 0);
kh2Bar.DAMAGE_COLOR = CreateColor(255, 0, 0);
kh2Bar.BACK_COLOR = CreateColor(24, 24, 24);
kh2Bar.DAMAGE_FADE_DELAY = 0.0;

// kh2Bar() constructor
// Creates an object representing a kh2Bar HP gauge.
// Arguments:
//     maxValue: The largest value representable by the gauge.
function kh2Bar(maxValue, color)
{
	this.drawSegment = function(x, y, width, height, color) {
		var halfHeight = Math.ceil(height / 2);
		var dimColor = BlendColorsWeighted(color, CreateColor(0, 0, 0), 0.333, 0.666);
		var yHalf = y + Math.floor(height / 2);
		GradientRectangle(x, y, width, halfHeight, dimColor, dimColor, color, color);
		GradientRectangle(x, yHalf, width, halfHeight, color, color, dimColor, dimColor);
	};
	
	if (color === void null) { color = CreateColor(0, 255, 0); }
	
	this.maxValue = maxValue;
	this.value = this.maxValue;
	this.color = color;
	this.damageAmount = 0;
	this.damageFade = 1.0;
	this.damageDelay = 0.0;
}

// .reading property
// Gets or sets the current HP reading.
kh2Bar.prototype.reading getter = function()
{
	return this.value;
};
kh2Bar.prototype.reading setter = function(value)
{
	value = Math.min(Math.max(Math.round(value), 0), this.maxValue);
	if (value != this.value) {
		this.damageAmount = this.value - value;
		this.damageDelay = kh2Bar.DAMAGE_FADE_DELAY;
		this.damageFade = 0.0;
		this.value = value;
	}
};

// .render() method
// Renders the kh2Bar.
// Arguments:
//     x: The X coordinate, in pixels, of the top left corner of the gauge.
//     y: The Y coordinate, in pixels, of the top left corner of the gauge.
kh2Bar.prototype.render = function(x, y)
{
	var numReserves = Math.ceil(this.maxValue / kh2Bar.SECTOR_SIZE - 1);
	var numReservesFilled = Math.ceil(this.value / kh2Bar.SECTOR_SIZE - 1);
	var numReservesDamaged = Math.ceil((this.damageAmount + this.value) / kh2Bar.SECTOR_SIZE - 1);
	var barWidthInUse = kh2Bar.SECTOR_SIZE;
	if (numReservesFilled == numReserves) {
		barWidthInUse = this.maxValue % kh2Bar.SECTOR_SIZE;
		if (barWidthInUse == 0) {
			barWidthInUse = kh2Bar.SECTOR_SIZE;
		}
	}
	var barFilled = this.value % kh2Bar.SECTOR_SIZE;
	if (barFilled == 0 && this.value > 0) {
		barFilled = barWidthInUse;
	}
	var barDamaged = Math.min(this.damageAmount, kh2Bar.SECTOR_SIZE - barFilled);
	var usageColor = BlendColorsWeighted(kh2Bar.BACK_COLOR, kh2Bar.DAMAGE_COLOR, this.damageFade, 1.0 - this.damageFade);
	Rectangle(x, y, kh2Bar.SECTOR_SIZE + 2, 16, kh2Bar.BORDER_COLOR);
	this.drawSegment(x + 1, y + 1, barFilled, 16 - 2, this.color);
	this.drawSegment(x + 1 + barFilled, y + 1, barDamaged, 16 - 2, usageColor);
	this.drawSegment(x + 1 + barFilled + barDamaged, y + 1, barWidthInUse - barFilled - barDamaged, 16 - 2, kh2Bar.BACK_COLOR);
	var slotXSize = 7;
	var slotYSize = 7;
	var slotX;
	var slotY = y + 16 - slotYSize;
	for (i = 0; i < numReserves; ++i) {
		var color;
		if (i < numReservesFilled) {
			color = this.color;
		} else if (i < numReservesDamaged) {
			color = usageColor;
		} else {
			color = kh2Bar.BACK_COLOR;
		}
		slotX = x + (kh2Bar.SECTOR_SIZE + 2 - slotXSize) - i * (slotXSize - 1);
		OutlinedRectangle(slotX, slotY, slotXSize, slotYSize, kh2Bar.BORDER_COLOR);
		this.drawSegment(slotX + 1, slotY + 1, slotXSize - 2, slotYSize - 2, color);
	}
};

// .update() method
// Advances the kh2Bar's internal state by one frame.
kh2Bar.prototype.update = function()
{
	this.damageDelay -= 1.0 / Engine.frameRate;
	if (this.damageDelay <= 0.0) {
		this.damageDelay = 0.0;
		this.damageFade += 0.02;
		if (this.damageFade >= 1.0) {
			this.damageAmount = 0;
			this.damageDelay = 0.0;
			this.damageFade = 1.0;
		}
	}
};
