/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");

// Tween() constructor
// Creates an object representing a tween.
function Tween(o, duration, ease, endValues)
{
	this.update = function()
	{
		this.elapsed += 1.0 / Engine.frameRate;
		for (var p in this.difference) {
			this.object[p] = this.easer(this.elapsed, this.start[p], this.difference[p], this.duration);
		}
		if (this.elapsed >= this.duration) {
			this.object[p] = this.start[p] + this.difference[p];
			return false;
		} else {
			return true;
		}
	};
	
	this.eases = {
		linear: function(t, b, c, d) {
			return c * t / d + b;
		},
		easeOutBounce: function(t, b, c, d) {  
			if ((t /= d) < (1 / 2.75)) {  
				return c * (7.5625 * t * t) + b;  
			} else if (t < (2 / 2.75)) {  
				return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;  
			} else if (t < (2.5 / 2.75)) {  
				return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;  
			} else {  
				return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b; 
			}
		}  
	}
	if (!(ease in this.eases)) {
		Abort("Tween() - Invalid easing type '" + ease + "'.");
	}
	this.object = o;
	this.start = {};
	this.difference = {};
	for (var p in endValues) {
		this.start[p] = o[p];
		this.difference[p] = endValues[p] - this.start[p];
	}
	this.duration = duration;
	this.elapsed = 0.0;
	this.easer = this.eases[ease];
	this.thread = Threads.createEntityThread(this);
};

// .isActive() method
// Determines whether the tweening operation is still active.
// Returns:
//     true if the tween is still working; false otherwise.
Tween.prototype.isFinished = function()
{
	return this.elapsed < this.duration;
};
