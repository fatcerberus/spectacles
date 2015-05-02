/**
 * miniRNG 1.1b2 - (c) 2015 Bruce Pascoe
 * A polyfill for minisphere's built-in RNG object which can be used
 * in any JavaScript environment.
**/

// note: this uses the JS standard Math.random(), which cannot be manually seeded.
//       RNG.seed() is included, but is a no-op with this implementation.

if (typeof RNG === 'undefined')
{
	// RNG object
	// Encapsulates the random number generator.
	RNG = new (function()
	{
		this.nextND = null;
	})();
		
	// .seed() method
	// Seeds the random number generator. As there is no way to supply a seed
	// for Math.random(), this method actually does nothing.
	// Arguments:
	//     seed: The seed value.
	RNG.seed = function(seed)
	{
		// no-op
	};

	// .chance() method
	// Tests a percentage chance.
	// Arguments:
	//     odds: The odds of the chance passing, specified as a decimal from 0 to 1.
	//           Chances <= 0 will never pass, and >= 1 will always pass.
	RNG.chance = function(odds)
	{
		return odds > Math.random();
	};

	// .fromArray() method
	// Returns a random entry selected from an array.
	// Arguments:
	//     candidates: An array of items to choose from.
	RNG.fromArray = function(candidates)
	{
		var index = Math.min(Math.floor(Math.random() * candidates.length), candidates.length - 1);
		return candidates[index];
	};

	// .fromNormal() method
	// Generates a random value from a normal probability distribution.
	// Arguments:
	//     mean:  The mean value around which random values will be centered.
	//     sigma: The standard deviation.
	RNG.fromNormal = function(mean, sigma)
	{
		if (this.nextND === null) {
			var u, v, w;
			do {
				u = 2.0 * Math.random() - 1.0;
				v = 2.0 * Math.random() - 1.0;
				w = u * u + v * v;
			} while (w >= 1.0);
			w = Math.sqrt(-2 * Math.log(w) / w);
			var x = u * w;
			this.nextND = v * w;
			return mean + sigma * x;
		} else {
			var y = this.nextND;
			this.nextND = null;
			return mean + sigma * y;
		}
	};

	// .fromRange() method
	// Returns a random integer within a specified range.
	// Arguments:
	//     minValue: The minimum value in the range.
	//     maxValue: The maximum value in the range.
	RNG.fromRange = function(minValue, maxValue)
	{
		var width = maxValue - minValue + 1;
		return minValue + Math.min(Math.floor(Math.random() * width), width - 1);
	};

	// .vary() method
	// Applies uniform random variance to a specified value.
	// Arguments:
	//     value:     The value on which to apply variance.
	//     tolerance: The maximum amount by which the output can deviate from the original
	//                value, in either direction.
	// Returns:
	//     The new value after random variance has been applied.
	RNG.vary = function(value, tolerance)
	{
		var error = tolerance * 2 * (0.5 - Math.random());
		return value + error;
	};
}
