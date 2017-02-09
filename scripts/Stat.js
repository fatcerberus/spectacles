/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

class Stat
{
	constructor(baseValue, level = 1, enableGrowth = true, growthRate = 1.0)
	{
		this.baseValue = baseValue;
		this.levelUpTable = [];
		for (var i = 1; i <= 100; ++i) {
			var xpNeeded = Math.ceil(i > 1 ? Math.pow(i, 3) / growthRate : 0);
			this.levelUpTable[i] = xpNeeded;
		}
		this.experience = this.levelUpTable[level];
		this.isGrowable = enableGrowth;
	}

	get level()
	{
		for (var level = 100; level >= 2; --level) {
			if (this.experience >= this.levelUpTable[level]) {
				return level;
			}
		}
		return 1;
	}

	get value()
	{
		return Math.round(Math.max(Game.math.statValue(this.baseValue, this.level), 1));
	}

	grow(experience)
	{
		this.experience = Math.min(Math.max(this.experience + experience, 0), this.levelUpTable[100]);
	}
}
