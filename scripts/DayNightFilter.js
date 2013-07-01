/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

DayNightFilter = new (function()
{
	var MY_DAY_MASK = CreateColor(0, 0, 0, 0);
	var MY_TWILIGHT_MASK = CreateColor(128, 32, 16, 160);
	var MY_NIGHT_MASK = CreateColor(0, 0, 32, 144);
	
	this.currentMask = CreateColor(0, 0, 0, 0);
	
	// .initialize() method
	// Initializes and activates the day/night filter.
	this.initialize = function()
	{
		Threads.createEntityThread(this, 98);
		var time = this.timeInLucida();
		Console.writeLine("Started time-of-day manager");
		Console.append("time: " + time.hours + "h:" + time.minutes + "m:" + time.seconds + "s");
	}
	
	// .render() method
	// Applies the day/night filter in its current state.
	this.render = function()
	{
		ApplyColorMask(this.currentMask);
	};
	
	// timeInLucida() method
	// Calculates the current time in Lucida.
	// Returns:
	//    The current clock time in Lucida.
	this.timeInLucida = function()
	{
		var realTime = new Date();
		var currentTime = 3600 * realTime.getHours() + 60 * realTime.getMinutes() + realTime.getSeconds();
		currentTime = (currentTime * 10) % 86400;
		var lucidanTime = {};
		lucidanTime.hours = Math.floor(currentTime / 3600);
		lucidanTime.minutes = Math.floor((currentTime / 60) % 60);
		lucidanTime.seconds = currentTime % 60;
		return lucidanTime;
	};
	
	// .update() method
	// Updates the day/night filter for the next frame.
	this.update = function()
	{
		var now = this.timeInLucida();
		var toMask;
		var fromMask;
		var alpha;
		if (now.hours < 5 || now.hours >= 19) {
			this.currentMask = MY_NIGHT_MASK;
		} else if (now.hours >= 7 && now.hours < 17) {
			this.currentMask = MY_DAY_MASK;
		} else if (now.hours >= 5 && now.hours < 6) {
			fromMask = MY_NIGHT_MASK;
			toMask = MY_TWILIGHT_MASK;
			alpha = now.minutes / 60;
			this.currentMask = BlendColorsWeighted(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hours >= 6 && now.hours < 7) {
			fromMask = MY_TWILIGHT_MASK;
			toMask = MY_DAY_MASK;
			alpha = now.minutes / 60;
			this.currentMask = BlendColorsWeighted(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hours >= 17 && now.hours < 18) {
			fromMask = MY_DAY_MASK;
			toMask = MY_TWILIGHT_MASK;
			alpha = now.minutes / 60;
			this.currentMask = BlendColorsWeighted(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hours >= 18 && now.hours < 19) {
			fromMask = MY_TWILIGHT_MASK;
			toMask = MY_NIGHT_MASK;
			alpha = now.minutes / 60;
			this.currentMask = BlendColorsWeighted(toMask, fromMask, alpha, 1.0 - alpha);
		}
		return true;
	};
})();
