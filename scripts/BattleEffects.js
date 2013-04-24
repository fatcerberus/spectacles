/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// BattleEffects object
// Provides the implementation for battle effects.
BattleEffects = new (function()
{
	// .damage() function
	// Returns a battle effect that inflicts damage on the target.
	// Arguments:
	//     power: The power of the effect, between 0 and 100.
	this.damage = function(type, power)
	{
		return function(user, targets, efficacy)
		{
			for (var i = 0; i < targets.length; ++i) {
				var damage = Game.math.damage[type](user, targets[i], power);
				target.takeDamage(damage);
			}
		};
	};
})();
