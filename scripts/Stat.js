/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// Stat() constructor
// Creates an object representing a battler statistic.
// Arguments:
//     baseValue:    Required. The value of the statistic at 100% growth.
//     initialLevel: The starting growth level for the statistic.
//                   Defaults to 1.
//     enableGrowth: If true, the stat will increase in value as it accumulates experience.
//                   Defaults to true.
//     growthRate:   The growth rate, which determines how fast the stat improves.
function Stat(baseValue, initialLevel, enableGrowth, growthRate)
{
	if (initialLevel === undefined) { initialLevel = 1; }
	if (enableGrowth === undefined) { enableGrowth = true; }
	if (growthRate === undefined) { growthRate = 1.0; }
	
	this.baseValue = baseValue;
	this.levelUpExperience = [];
	for (var level = 1; level <= 100; ++level) {
		var required = Math.ceil(level > 1 ? Math.pow(level, 3) / growthRate : 0);
		this.levelUpExperience[level] = required;
	}
	this.experience = this.levelUpExperience[initialLevel];
	this.isGrowable = enableGrowth;
}

// .getLevel() method
// Returns the stat's current growth level.
Stat.prototype.getLevel = function()
{
	for (var level = 100; level >= 2; --level) {
		if (this.experience >= this.levelUpExperience[level]) {
			return level;
		}
	}
	return 1;
};

// .getValue() method
// Returns the stat's current value.
Stat.prototype.getValue = function()
{
	return Math.max(Math.floor(this.baseValue * this.getLevel() / 100), 1);
};

// .grow() method
// Adds experience to the stat, potentially raising its value.
Stat.prototype.grow = function(experience)
{
	if (!this.isGrowable) {
		Abort("Stat.grow(): Can't grow a fixed stat!");
	}
	var previousLevel = this.getLevel();
	this.experience = Math.min(Math.max(this.experience + experience, 0), this.levelUpExperience[100]);
	var newLevel = this.getLevel();
};
