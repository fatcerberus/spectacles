/**
 * kh2Bar 1.5.1 for Sphere - (c) 2013 Bruce Pascoe
 * A multi-segment HP gauge styled after the enemy HP bars in Kingdom Hearts 2.
**/

kh2Bar = kh2Bar || {};

// kh2Bar() constructor
// Creates an object representing a Kingdom Hearts 2-style HP gauge.
// Arguments:
//     capacity:   The largest HP value representable by the gauge.
//     sectorSize: Optional. The amount of HP represented by each full bar of the gauge. (Default: 100)
//     color:      Optional. The color of the gauge. (Default: #00FF00 @ 100%)
function kh2Bar(capacity, sectorSize, color)
{
	this.$drawSegment = function(x, y, width, height, color)
	{
		var halfHeight = Math.ceil(height / 2);
		var dimColor = BlendColors(color, CreateColor(0, 0, 0, 255));
		var yHalf = y + Math.floor(height / 2);
		GradientRectangle(x, y, width, halfHeight, dimColor, dimColor, color, color);
		GradientRectangle(x, yHalf, width, halfHeight, color, color, dimColor, dimColor);
	};
	
	if (sectorSize === void null) { sectorSize = 100; }
	if (color === void null) { color = CreateColor(0, 255, 0, 255); }
	
	this.$capacity = capacity;
	this.$sectorSize = sectorSize;
	this.$value = this.$capacity;
	this.$hpColor = color;
	this.$damageColor = CreateColor(192, 0, 0, this.$hpColor.alpha);
	this.$bgColor = CreateColor(32, 32, 32, this.$hpColor.alpha);
	this.$borderColor = CreateColor(0, 0, 0, this.$hpColor.alpha);
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
			this.$damage += this.$value - value;
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
	this.render = function(x, y, width, height)
	{
		var numReserves = Math.ceil(this.$capacity / this.$sectorSize - 1);
		var numReservesFilled = Math.ceil(this.$value / this.$sectorSize - 1);
		var numReservesDamaged = Math.ceil((this.$damage + this.$value) / this.$sectorSize - 1);
		var barInUse = this.$sectorSize;
		if (numReservesFilled == numReserves) {
			barInUse = this.$capacity % this.$sectorSize;
			if (barInUse == 0) {
				barInUse = this.$sectorSize;
			}
		}
		var barFilled = this.$value % this.$sectorSize;
		if (barFilled == 0 && this.$value > 0) {
			barFilled = barInUse;
		}
		var barDamaged = Math.min(this.$damage, this.$sectorSize - barFilled);
		var usageColor = BlendColorsWeighted(this.$bgColor, this.$damageColor, this.$damageFadeness, 1.0 - this.$damageFadeness);
		var barHeight = Math.ceil(height * 0.5 + 0.5);
		var widthInUse = Math.ceil((width - 2) * barInUse / this.$sectorSize);
		var fillWidth = Math.ceil((width - 2) * barFilled / this.$sectorSize);
		var damageWidth = Math.min(Math.ceil((width - 2) * barDamaged / this.$sectorSize), widthInUse - fillWidth);
		var emptyWidth = Math.max(widthInUse - (fillWidth + damageWidth), 0);
		if (numReserves > 0) {
			OutlinedRectangle(x, y, width, barHeight, BlendColors(this.$borderColor, CreateColor(0, 0, 0, 0)));
			this.$drawSegment(x + 1, y + 1, width - 2, barHeight - 2, BlendColors(this.$hpColor, CreateColor(0, 0, 0, 0)));
		}
		var barEdgeX = x + width - 1;
		OutlinedRectangle(barEdgeX - widthInUse - 1, y, widthInUse + 2, barHeight, this.$borderColor);
		this.$drawSegment(barEdgeX - fillWidth, y + 1, fillWidth, barHeight - 2, this.$hpColor);
		this.$drawSegment(barEdgeX - fillWidth - damageWidth, y + 1, damageWidth, barHeight - 2, usageColor);
		this.$drawSegment(barEdgeX - fillWidth - damageWidth - emptyWidth, y + 1, emptyWidth, barHeight - 2, this.$bgColor);
		var slotYSize = height - barHeight + 1;
		var slotXSize = slotYSize;
		var slotX;
		var slotY = y + height - slotYSize;
		for (i = 0; i < numReserves; ++i) {
			var color;
			if (i < numReservesFilled) {
				color = this.$hpColor;
			} else if (i < numReservesDamaged) {
				color = usageColor;
			} else {
				color = this.$bgColor;
			}
			slotX = x + (width - slotXSize) - i * (slotXSize - 1);
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
