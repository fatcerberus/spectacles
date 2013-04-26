/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Stat.js");

// Skill() constructor
// Creates an object representing a battler skill.
// Arguments:
//     techniqueName: The name of the technique represented by this skill.
function Skill(techniqueName)
{
	this.techniqueName = techniqueName;
	this.level = new Stat(100);
}

Skill.prototype.name getter = function()
{
	return this.techniqueName;
}
