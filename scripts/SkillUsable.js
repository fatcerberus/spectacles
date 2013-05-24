/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Stat.js");

// SkillUsable() constructor
// Creates an object representing a usable battler skill.
// Arguments:
//     skillID: The ID of the skill as defined in the gamedef.
//     level:   Optional. The starting level for the skill. (default: 1)
function SkillUsable(skillID, level)
{
	level = level !== void null ? level : 1;
	
	if (!(skillID in Game.techniques)) {
		Abort("SkillUsable(): The skill definition '" + skillID + "' doesn't exist.");
	}
	this.levelStat = new Stat(100, level);
	this.name = Game.techniques[skillID].name;
	this.technique = Game.techniques[skillID];
	this.techniqueID = skillID;
}

// .getLevel() method
// Returns the skill's current growth level.
SkillUsable.prototype.getLevel = function()
{
	return this.levelStat.getValue();
};

// .grow() method
// Adds experience to the skill, potentially raising its level.
SkillUsable.prototype.grow = function(experience)
{
	this.levelStat.grow(experience);
};

// .isUsable() method
// Determines whether the skill is currently usable.
// Returns:
//     true if the skill can be used; false otherwise.
SkillUsable.prototype.isUsable = function()
{
	return true;
}

// .use() method
// Utilizes the skill.
// Returns:
//     A list of battle actions to be executed by the skill user.
SkillUsable.prototype.use = function()
{
	return this.technique.actions;
};
