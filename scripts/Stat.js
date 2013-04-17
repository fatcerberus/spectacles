/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("lib/MultiDelegate.js");

// Stat() constructor
// Creates an object representing a dynamic statistic with experience-based growth.
// Arguments:
//     baseValue:    Required. The value of the statistic at 100% growth.
//     initialLevel: The starting growth level for the statistic.
//                   Defaults to 1.
//     enableGrowth: If true, the stat will increase in value as it accumulates experience.
//                   Defaults to true.
//     growthRate:   The growth rate, which determines how fast the stat improves.
function Stat(baseValue, initialLevel, enableGrowth, growthRate)
{
	if (initialGrowthLevel === undefined) { initialGrowthLevel = 1; }
	if (enableGrowth === undefined) { enableGrowth = true; }
	if (growthRate === undefined) { growthRate = 1.0; }
	
	this.baseValue = baseValue;
	this.levelUpExperience = [];
	for (var level = 1; level <= 100; ++level) {
		var requiredExperience = Math.ceil(level > 1 ? Math.pow(level, 3) / growthRate : 0);
		this.levelUpExperience[level] = requiredExperience;
	}
	this.experiencePoints = this.levelUpExperience[initialGrowthLevel];
	this.isGrowthEnabled = enableGrowth;
	
	// .levelUpEvent event
	// Invoked when the stat's level increases.
	// Arguments for event handler:
	//     stat:     The stat raising the event.
	//     newLevel: The new growth level.
	this.levelUpEvent = new MultiDelegate();
	
	// .experience property
	// Gets or sets the stat's current accumulated experience.
	this.experience getter = function()
	{
		return this.experiencePoints;
	};
	this.experience setter = function(value)
	{
		var previousLevel = this.growthLevel;
		this.experiencePoints = Math.min(Math.max(value, 0), this.levelUpExperience[100]);
		var newLevel = this.growthLevel;
		for (var i = 0; i < newLevel - previousLevel; ++i) {
			this.levelUpEvent.invoke(this, previousLevel + 1 + i);
		}
	};
	
	// .level property
	// Gets the stat's current growth level.
	this.level getter = function()
	{
		
		for (var level = 100; level >= 2; --level) {
			if (this.experience >= this.levelUpExperience[level]) {
				return level;
			}
		}
		return 1;
	};
	
	// .value property
	// Gets the stat's current value.
	this.value getter = function()
	{
		return Math.max(Math.floor(this.baseValue * this.growthLevel / 100), 1);
	};
}
