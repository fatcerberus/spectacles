/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Stat.js");

// Skill() constructor
// Creates an object representing a battler skill.
// Arguments:
//     techniqueID: The ID of the technique this skill is based on.
//     level:       Optional. The starting level for the skill. (default: 1)
function Skill(techniqueID, level)
{
	level = level !== void null ? level : 1;
	
	if (!(techniqueID in Game.techniques)) {
		Abort("Skill() - Technique '" + handle + "' doesn't exist!");
	}
	this.technique = Game.techniques[techniqueID];
	this.name = this.technique.name;
	this.handle = techniqueID;
	this.levelStat = new Stat(100, level);
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
