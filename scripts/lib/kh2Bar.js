/**
 * kh2Bar 1.1 for Sphere - (c) 2013 Bruce Pascoe
 * A multi-segment HP gauge styled after the enemy HP bars in Kingdom Hearts 2.
**/

kh2Bar = kh2Bar || {};

// kh2Bar() constructor
// Creates an object representing a kh2Bar HP gauge.
// Arguments:
//     capacity: The largest HP value representable by the gauge.
//     color:    Optional. The color of the gauge. The default is green (#00FF00).
function kh2Bar(capacity, color)
{
	this.$drawSegment = function(x, y, width, height, color)
	{
		var halfHeight = Math.ceil(height / 2);
		var dimColor = BlendColorsWeighted(color, CreateColor(0, 0, 0), 0.333, 0.666);
		var yHalf = y + Math.floor(height / 2);
		GradientRectangle(x, y, width, halfHeight, dimColor, dimColor, color, color);
		GradientRectangle(x, yHalf, width, halfHeight, color, color, dimColor, dimColor);
	};
	
	if (color === void null) { color = CreateColor(0, 255, 0, 255); }
	
	this.$capacity = capacity;
	this.$value = this.$capacity;
	this.$hpColor = color;
	this.$damageColor = CreateColor(255, 0, 0, this.$hpColor.alpha);
	this.$bgColor = CreateColor(24, 24, 24, this.$hpColor.alpha);
	this.$borderColor = CreateColor(0, 0, 0, this.$hpColor.alpha);
	this.$sectorSize = 250;
	this.$damage = 0;
	this.$damageFadeness = 1.0;
	this.$damageDelay = 0.0;
	
	// .getReading() method
	// Gets the kh2Bar's current HP reading.
	this.getReading = function()
	{
		return this.$value;
	};
	
	// .setReading() method
	// Sets the kh2Bar's HP reading.
	this.setReading = function(value)
	{
		value = Math.min(Math.max(Math.round(value), 0), this.$capacity);
		if (value != this.$value) {
			this.$damage = this.$value - value;
			this.$damageDelay = 0.5;
			this.$damageFadeness = 0.0;
			this.$value = value;
		}
	};
	
	// .render() method
	// Renders the kh2Bar.
	// Arguments:
	//     x: The X coordinate, in pixels, of the top left corner of the gauge.
	//     y: The Y coordinate, in pixels, of the top left corner of the gauge.
	this.render = function(x, y)
	{
		var numReserves = Math.ceil(this.$capacity / this.$sectorSize - 1);
		var numReservesFilled = Math.ceil(this.$value / this.$sectorSize - 1);
		var numReservesDamaged = Math.ceil((this.$damage + this.$value) / this.$sectorSize - 1);
		var barWidthInUse = this.$sectorSize;
		if (numReservesFilled == numReserves) {
			barWidthInUse = this.$capacity % this.$sectorSize;
			if (barWidthInUse == 0) {
				barWidthInUse = this.$sectorSize;
			}
		}
		var barFilled = this.$value % this.$sectorSize;
		if (barFilled == 0 && this.$value > 0) {
			barFilled = barWidthInUse;
		}
		var barDamaged = Math.min(this.$damage, this.$sectorSize - barFilled);
		var usageColor = BlendColorsWeighted(this.$bgColor, this.$damageColor, this.$damageFadeness, 1.0 - this.$damageFadeness);
		Rectangle(x, y, this.$sectorSize + 2, 16, this.$borderColor);
		this.$drawSegment(x + 1, y + 1, barFilled, 16 - 2, this.$hpColor);
		this.$drawSegment(x + 1 + barFilled, y + 1, barDamaged, 16 - 2, usageColor);
		this.$drawSegment(x + 1 + barFilled + barDamaged, y + 1, barWidthInUse - barFilled - barDamaged, 16 - 2, this.$bgColor);
		var slotXSize = 7;
		var slotYSize = 7;
		var slotX;
		var slotY = y + 16 - slotYSize;
		for (i = 0; i < numReserves; ++i) {
			var color;
			if (i < numReservesFilled) {
				color = this.$hpColor;
			} else if (i < numReservesDamaged) {
				color = usageColor;
			} else {
				color = this.$bgColor;
			}
			slotX = x + (this.$sectorSize + 2 - slotXSize) - i * (slotXSize - 1);
			OutlinedRectangle(slotX, slotY, slotXSize, slotYSize, this.$borderColor);
			this.$drawSegment(slotX + 1, slotY + 1, slotXSize - 2, slotYSize - 2, color);
		}
	};
	
	// .update() method
	// Advances the kh2Bar's internal state by one frame.
	this.update = function()
	{
		var frameRate = IsMapEngineRunning() ? GetMapEngineFrameRate() : GetFrameRate();
		this.$damageDelay -= 1.0 / frameRate;
		if (this.$damageDelay <= 0.0) {
			this.$damageDelay = 0.0;
			this.$damageFadeness += 0.02;
			if (this.$damageFadeness >= 1.0) {
				this.$damage = 0;
				this.$damageDelay = 0.0;
				this.$damageFadeness = 1.0;
			}
		}
	};
}
