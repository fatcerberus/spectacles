/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Stat.js");

// Skill() constructor
// Creates an object representing a battle skill.
// Arguments:
//     technique: The technique represented by this skill.
function Skill(technique)
{
	this.technique = technique;
	this.level = new Stat(100);
}
