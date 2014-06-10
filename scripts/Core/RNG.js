/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *      Copyright (C) 2012-2014 Power-Command
***/

// RNG object
// Encapsulates the random number generator.
RNG = new (function()
{
	this.nextND = null;
	
	// .chance() method
	// Tests a chance.
	// Arguments:
	//     odds: The odds of the chance passing, specified as a decimal from 0 to 1.
	//           Chances <= 0 will never pass, and >= 1 will always pass.
	this.chance = function(odds)
	{
		return odds > Math.random();
	};
	
	// .fromArray() method
	// Returns a random entry selected from an array.
	// Arguments:
	//     candidates: An array of items to choose from.
	this.fromArray = function(candidates)
	{
		var index = Math.min(Math.floor(Math.random() * candidates.length), candidates.length - 1);
		return candidates[index];
	};
	
	// .fromNormal() method
	// Returns a random deviate from the standard normal distribution.
	this.fromNormal = function()
	{
		if (this.nextND === null) {
			var u = Math.random();
			var v = Math.random();
			var x = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
			var y = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);
			this.nextND = y;
			return x;
		} else {
			var y = this.nextND;
			this.nextND = null;
			return y;
		}
	};
	
	// .fromRange() method
	// Returns a random integer within a specified range.
	// Arguments:
	//     minValue: The minimum value in the range.
	//     maxValue: The maximum value in the range.
	this.fromRange = function(minValue, maxValue)
	{
		var rangeSize = maxValue - minValue + 1;
		return minValue + Math.min(Math.floor(Math.random() * rangeSize), rangeSize - 1);
	};
	
	// .vary() method
	// Applies uniform random variance to a specified value.
	// Arguments:
	//     value:     The value on which to apply variance.
	//     tolerance: The maximum amount by which the output can diverge from the original
	//                value, in either direction.
	// Returns:
	//     The new value after random variance has been applied.
	this.vary = function(value, tolerance)
	{
		var error = tolerance * 2 * (0.5 - Math.random());
		return value + error;
	};
});
