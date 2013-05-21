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
		Abort("Skill(): The technique '" + handle + "' doesn't exist!");
	}
	
	this.levelStat = new Stat(100, level);
	this.technique = Game.techniques[techniqueID];

	this.name = this.technique.name;
	this.techniqueID = techniqueID;
}

// .getLevel() method
// Returns the skill's current growth level.
Skill.prototype.getLevel = function()
{
	return this.levelStat.getValue();
};

// .grow() method
// Adds experience to the skill, potentially raising its level.
Skill.prototype.grow = function(experience)
{
	this.levelStat.grow(experience);
};
