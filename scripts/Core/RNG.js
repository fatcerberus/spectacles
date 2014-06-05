/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *      Copyright (C) 2012-2014 Power-Command
***/

// RNG object
// Encapsulates the random number generator.
RNG = new (function()
{
	// .fromArray() method
	// Returns a random entry selected from an array.
	// Arguments:
	//     candidates: An array of items to choose from.
	this.fromArray = function(candidates)
	{
		var index = Math.min(Math.floor(Math.random() * candidates.length), candidates.length - 1);
		return candidates[index];
	};
	
	// .fromRange() method
	// Returns a random integer from a specified range.
	// Arguments:
	//     minValue: The minimum value in the range.
	//     maxValue: The maximum value in the range.
	this.fromRange = function(minValue, maxValue)
	{
		var rangeSize = maxValue - minValue + 1;
		return minValue + Math.min(Math.floor(Math.random() * rangeSize), rangeSize - 1);
	};
	
	// .vary() method
	// Applies random variance to a number.
	// Arguments:
	//     value:     The value on which to apply variance.
	//     tolerance: The maximum amount of divergence, specified as a decimal. For example,
	//                for 10% of tolerance, this should be 0.1.
	// Returns:
	//     The new value after random variance is applied.
	// Remarks:
	//     The tolerance is interpreted as meaning "give or take". For example, if 5%
	//     of variance is requested, the final value can diverge by up to 5% in either
	//     direction.
	this.vary = function(value, tolerance)
	{
		var divergence = tolerance * 2 * (0.5 - Math.random());
		return value + value * divergence;
	};
});
