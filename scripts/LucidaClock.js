/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// LucidaClock() object
// Represents the time-of-day manager, which tracks the current time
// in the dream world of Lucida.
LucidaClock = new (function()
{
	var MY_DAY_MASK = CreateColor(0, 0, 0, 0);
	var MY_TWILIGHT_MASK = CreateColor(128, 32, 16, 160);
	var MY_NIGHT_MASK = CreateColor(0, 0, 32, 144);
	
	this.currentMask = CreateColor(0, 0, 0, 0);
	
	// .initialize() method
	// Initializes and activates the time-of-day manager.
	this.initialize = function()
	{
		console.log("Initializing time-of-day manager");
		threads.create(this, 1);
		var time = this.getTime();
		console.log("Time in Lucida is " + time.toString());
	}
	
	// .update() method
	// Updates the day/night filter for the next frame.
	this.update = function()
	{
		var now = this.getTime();
		var toMask;
		var fromMask;
		var alpha;
		if (now.hour < 5 || now.hour >= 19) {
			this.currentMask = MY_NIGHT_MASK;
		} else if (now.hour >= 7 && now.hour < 17) {
			this.currentMask = MY_DAY_MASK;
		} else if (now.hour >= 5 && now.hour < 6) {
			fromMask = MY_NIGHT_MASK;
			toMask = MY_TWILIGHT_MASK;
			alpha = now.minute / 60;
			this.currentMask = BlendColorsWeighted(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 6 && now.hour < 7) {
			fromMask = MY_TWILIGHT_MASK;
			toMask = MY_DAY_MASK;
			alpha = now.minute / 60;
			this.currentMask = BlendColorsWeighted(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 17 && now.hour < 18) {
			fromMask = MY_DAY_MASK;
			toMask = MY_TWILIGHT_MASK;
			alpha = now.minute / 60;
			this.currentMask = BlendColorsWeighted(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 18 && now.hour < 19) {
			fromMask = MY_TWILIGHT_MASK;
			toMask = MY_NIGHT_MASK;
			alpha = now.minute / 60;
			this.currentMask = BlendColorsWeighted(toMask, fromMask, alpha, 1.0 - alpha);
		}
		return true;
	};
	
	// .render() method
	// Applies the day/night filter in its current state.
	this.render = function()
	{
		ApplyColorMask(this.currentMask);
	};
	
	// .getTime() method
	// Calculates the current time in Lucida.
	// Returns:
	//    The current clock time in Lucida.
	this.getTime = function()
	{
		var realTime = new Date();
		var currentTime = 3600 * realTime.getHours() + 60 * realTime.getMinutes() + realTime.getSeconds();
		currentTime = (currentTime * 10) % 86400;
		var hour = Math.floor(currentTime / 3600);
		var minute = Math.floor((currentTime / 60) % 60);
		var second = currentTime % 60;
		return new LucidaTime(hour, minute, second);
	};
})();

function LucidaTime(hour, minute, second)
{
	this.hour = hour;
	this.minute = minute;
	this.second = second;
}

LucidaTime.prototype.toString = function()
{
	var hourText = ("0" + this.hour).slice(-2);
	var minuteText = ("0" + this.minute).slice(-2);
	var secondText = ("0" + this.second).slice(-2);
	return hourText + ":" + minuteText + " LST";
}
