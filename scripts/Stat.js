/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// Stat() constructor
// Creates an object representing a battler statistic.
// Arguments:
//     baseValue:    The base value of the statistic. The exact meaning of this value depends on
//                   how the gamedef interprets it.
//     level:        Optional. The starting growth level for the statistic. (default: 1)
//     enableGrowth: Optional. Specifies whether the stat's level will increase as it accumulates
//                   experience. (default: true)
//     growthRate:   Optional. The growth rate, which determines how fast the stat improves.
//                   (default: 1.0)
function Stat(baseValue, level, enableGrowth, growthRate)
{
	level = level !== void null ? level : 1;
	enableGrowth = enableGrowth !== void null ? enableGrowth : true;
	growthRate = growthRate !== void null ? growthRate : 1.0;
	
	this.baseValue = baseValue;
	this.levelUpTable = [];
	for (var i = 1; i <= 100; ++i) {
		var xpNeeded = Math.ceil(i > 1 ? i ** 3 / growthRate : 0);
		this.levelUpTable[i] = xpNeeded;
	}
	this.experience = this.levelUpTable[level];
	this.isGrowable = enableGrowth;
}

// .getLevel() method
// Gets the stat's current level.
Stat.prototype.getLevel = function()
{
	for (var level = 100; level >= 2; --level) {
		if (this.experience >= this.levelUpTable[level]) {
			return level;
		}
	}
	return 1;
};

// .getValue() method
// Get the stat's current value.
Stat.prototype.getValue = function()
{
	return Math.round(Math.max(Game.math.statValue(this.baseValue, this.getLevel()), 1));
};

// .grow() method
// Adds experience to the stat, potentially raising its level.
// Arguments:
//     experience: The number of experience points to be added.
Stat.prototype.grow = function(experience)
{
	var previousLevel = this.getLevel();
	this.experience = Math.min(Math.max(this.experience + experience, 0), this.levelUpTable[100]);
	var newLevel = this.getLevel();
};
