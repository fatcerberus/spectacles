/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// MPGauge() constructor
// Creates an object representing an on-screen MP gauge.
// Arguments:
//     maxValue: The largest value representable by the gauge.
function MPGauge(maxValue)
{
	var MYFILLCOLOR = CreateColor(0, 192, 255);
	var MYBACKCOLOR = CreateColor(0, 64, 80);
	var MYUSAGECOLOR = CreateColor(255, 255, 255);
	var MYBORDERCOLOR = CreateColor(0, 0, 0);
	
	this.maxValue = maxValue;
	this.value = this.maxValue;
	this.usageAmount = 0;
	this.usageFade = 1.0;
	
	// .present() method
	// Updates the gauge and renders it to the frame buffer. 
	// Arguments:
	//     x:        The X coordinate, in pixels, of the center of the gauge relative to the screen
	//     y:        The Y coordinate, in pixels, of the center of the gauge relative to the screen
	//     radius:   The radius of the gauge in pixels
	this.present = function(x, y, radius)
	{
		myUsageFade += 0.02;
		if (myUsageFade >= 1.0)
		{
			myUsageState = 1.0;
			myUsage = 0;
		}
		
		var fillColor2 = BlendColorsWeighted(MYFILLCOLOR, CreateColor(0, 0, 0), 0.333, 0.666);
		var backColor2 = BlendColorsWeighted(MYBACKCOLOR, CreateColor(0, 0, 0), 0.333, 0.666);
		var usageColor = BlendColorsWeighted(MYUSAGECOLOR, MYBACKCOLOR, 1.0 - myUsageFade, myUsageFade);
		var usageColor2 = BlendColorsWeighted(usageColor, CreateColor(0, 0, 0), 0.333, 0.666);
		var fillRadius = (radius - 1) * (myValue / myMaxValue);
		var usageRadius = (radius - 1) * ((myValue + myUsage) / myMaxValue);
		GradientCircle(x, y, radius, MYBACKCOLOR, backColor2, true);
		OutlinedCircle(x, y, radius, MYBORDERCOLOR, true);
		if (myMaxValue > 0)
		{
			GradientCircle(x, y, usageRadius, usageColor, usageColor2, true);
			GradientCircle(x, y, fillRadius, MYFILLCOLOR, fillColor2, true);
			OutlinedCircle(x, y, fillRadius, MYBACKCOLOR, true);
		}
	};
	
	// .reading property
	// Gets or sets the gauge's current reading.
	this.reading getter = function()
	{
		return myValue;
	};
	this.reading setter = function(value)
	{
		value = Math.min(Math.max(Math.round(value), 0), myMaxValue);
		myUsage = myValue - value;
		myUsageFade = 0.0;
		myValue = value;
	};
}
