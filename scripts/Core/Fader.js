/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");

// Fader() constructor
// Creates an object representing a fader, a special entity used to implement fades and other
// gradual adjustment operations.
// Arguments:
//     initialValue: The initial value of the fader.
//                   Defaults to 0.0.
function Fader(initialValue)
{
	// .adjust() method
	// Adjusts the fader's value over a specified time period.
	// Arguments:
	//     targetValue: The target value for the fader.
	//     duration:    The amount of time over which to perform the adjustment, in seconds.
	this.adjust = function(targetValue, duration)
	{
		this.targetValue = targetValue;
		this.increment = (this.targetValue - this.currentValue) / duration;
	};
	
	// .dispose() method
	// Frees resources associated with the fader.
	this.dispose = function()
	{
		Threads.kill(this.threadID);
	};
	
	// .update() method
	// Updates the fader for the next frame.
	this.update = function()
	{
		this.currentValue += this.increment / Engine.frameRate;
		if ((this.currentValue > this.targetValue && this.increment > 0.0)
		    || (this.currentValue < this.targetValue && this.increment < 0.0))
		{
			this.currentValue = this.targetValue;
			this.increment = 0.0;
		}
		return true;
	};
	
	// .isFading property
	// Gets a boolean value indicating whether the fader is currently being adjusted.
	this.fading getter = function()
	{
		return this.increment != 0.0;
	};
	
	// .value property
	// Gets or sets the fader's immediate value.
	this.value getter = function()
	{
		return this.currentValue;
	};
	this.value setter = function(value)
	{
		this.targetValue = value;
		this.currentValue = this.targetValue;
		this.increment = 0.0;
	};

	// Initialize the fader.
	if (initialValue === undefined) initialValue = 0.0;
	
	this.currentValue = initialValue;
	this.targetValue = this.currentValue;
	this.increment = 0.0;
	this.threadID = Threads.createEntityThread(this);
}
