/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// HPGauge() constructor
// Creates an object representing an HP gauge.
// Arguments:
//     maxValue: The largest value representable by the gauge.
function HPGauge(x, y, maxValue)
{
	// .drawSegment() method
	// Draws a segment of the gauge.
	this.drawSegment = function(x, y, width, height, color)
	{
		var halfHeight = Math.ceil(height / 2);
		var dimColor = BlendColorsWeighted(color, CreateColor(0, 0, 0), 0.333, 0.666);
		var yHalf = y + Math.floor(height / 2);
		GradientRectangle(x, y, width, halfHeight, dimColor, dimColor, color, color);
		GradientRectangle(x, yHalf, width, halfHeight, color, color, dimColor, dimColor);
	};
	
	// .present() method
	// Updates the gauge and renders it to the frame buffer. 
	// Arguments:
	//     x:        The X coordinate, in pixels, of the center of the gauge relative to the screen
	//     y:        The Y coordinate, in pixels, of the center of the gauge relative to the screen
	this.present = function(x, y)
	{
		var totalReserves = Math.ceil(this.maxValue / MYSECTORSIZE - 1);
		var reservesLeft = Math.ceil(this.value / MYSECTORSIZE - 1);
		var reservesDamaged = Math.ceil((this.damageAmount + this.value) / MYSECTORSIZE - 1);
		var barInUse = MYSECTORSIZE;
		if (reservesLeft == totalReserves) {
			barInUse = this.maxValue % MYSECTORSIZE;
			if (barInUse == 0) {
				barInUse = MYSECTORSIZE;
			}
		}
		var barFilled = this.value % MYSECTORSIZE;
		if (barFilled == 0 && this.value > 0) {
			barFilled = barInUse;
		}
		var barDamaged = Math.min(this.damageAmount, MYSECTORSIZE - barFilled);
		var usageColor = BlendColorsWeighted(MYBACKCOLOR, MYDAMAGECOLOR, this.damageFade, 1.0 - this.damageFade);
		Rectangle(x, y, MYSECTORSIZE + 2, 16, MYBORDERCOLOR);
		this.drawSegment(x + 1, y + 1, barFilled, 16 - 2, MYBARCOLOR);
		this.drawSegment(x + 1 + barFilled, y + 1, barDamaged, 16 - 2, MYDAMAGECOLOR);
		this.drawSegment(x + 1 + barFilled + barDamaged, y + 1, barInUse - barFilled - barDamaged, 16 - 2, MYBACKCOLOR);
		var slotXSize = 7;
		var slotYSize = 7;
		var slotX;
		var slotY = y + 16 - slotYSize;
		for (i = 0; i < totalReserves; ++i) {
			var color;
			if (i < reservesLeft) color = MYBARCOLOR;
				else if (i < reservesDamaged) color = usageColor;
				else color = MYBACKCOLOR;
			slotX = x + (MYSECTORSIZE + 2 - slotXSize) - i * (slotXSize - 1);
			OutlinedRectangle(slotX, slotY, slotXSize, slotYSize, MYBORDERCOLOR);
			this.drawSegment(slotX + 1, slotY + 1, slotXSize - 2, slotYSize - 2, color);
		}
		
		this.damageDelay -= 1.0 / Core.frameRate;
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
	
	// .reading property
	// Gets or sets the gauge's current reading.
	this.reading getter = function()
	{
		return this.value;
	};
	this.reading setter = function(value)
	{
		value = Math.min(Math.max(Math.round(value), 0), this.maxValue);
		if (value != this.value) {
			this.damageAmount = this.value - value;
			this.damageDelay = 1.0;
			this.damageFade = 0.0;
			this.value = value;
		}
	};
	
	
	var MYSECTORSIZE = 250;
	var MYBACKCOLOR = CreateColor(24, 24, 24);
	var MYBORDERCOLOR = CreateColor(64, 64, 64);
	var MYBARCOLOR = CreateColor(255, 255, 255);
	var MYDAMAGECOLOR = CreateColor(128, 0, 0);
	
	this.maxValue = maxValue;
	this.value = this.maxValue;
	this.damageAmount = 0;
	this.damageFade = 1.0;
	this.damageDelay = 0.0;
}
