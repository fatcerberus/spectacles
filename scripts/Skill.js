/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Stat.js");

// Skill() constructor
// Creates an object representing a battler skill.
// Arguments:
//     handle: The handle of the technique embodied by the skill.
function Skill(handle)
{
	if (!(handle in Game.techniques)) {
		Abort("Skill() - Technique '" + handle + "' doesn't exist.");
	}
	this.handle = handle;
	this.techniqueClass = Game.techniques[this.handle];
	this.level = new Stat(100);
}

// .experience property
// Gets or sets the skill's experience point count.
Skill.prototype.experience getter = function()
{
	return this.level.experience;
};
Skill.prototype.experience setter = function(value)
{
	this.level.experience = value;
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
