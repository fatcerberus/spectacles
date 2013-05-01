/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Stat.js");

// Skill() constructor
// Creates an object representing a battler skill.
// Arguments:
//     handle:       The handle of the technique embodied by the skill.
//     initialLevel: The initial growth level of the skill. If not specified, defaults to 1.
function Skill(handle, initialLevel)
{
	if (initialLevel === undefined) { initialLevel = 1; }
	
	if (!(handle in Game.techniques)) {
		Abort("Skill() - Technique '" + handle + "' doesn't exist.");
	}
	this.handle = handle;
	this.techniqueClass = Game.techniques[this.handle];
	this.levelStat = new Stat(100, initialLevel);
}

// .experience property
// Gets or sets the skill's experience point count.
Skill.prototype.experience getter = function()
{
	return this.levelStat.experience;
};
Skill.prototype.experience setter = function(value)
{
	this.levelStat.experience = value;
};

// .level property
// Gets the skill's current growth level.
Skill.prototype.level getter = function()
{
	return this.levelStat.value;
};

// .name property
// Gets the name of the skill.
Skill.prototype.name getter = function()
{
	return this.techniqueClass.name;
};

// .technique property
// Gets the technique embodied by the skill.
Skill.prototype.technique getter = function()
{
	return this.techniqueClass;
};
