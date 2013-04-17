/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Stat.js");
RequireScript("Skill.js");
RequireScript("Game.js");

// PartyMember() constructor
// Creates an object representing an active member of a Party.
// Arguments:
//     character:   The character represented by this party member.
//     battleLevel: Optional. The party member's initial battle level.
//                  Defaults to 1.
function PartyMember(character, battleLevel)
{
	// .learnSkill method
	// Grants the party member the ability to use a technique.
	// Arguments:
	//     technique: The technique to learn.
	this.learnSkill = function(technique)
	{
		this.skills.push(new Skill(technique));
	};
	
	// .battleLevel property
	// Gets the party member's overall battle level.
	this.battleLevel getter = function()
	{
		var sum = 0;
		for (var name in this.stats) {
			sum += this.stats[name].level;
		}
		return Math.floor(sum / this.stats.length);
	};
	
	
	if (battleLevel === undefined) battleLevel = 1;
	
	this.character = character;
	this.name = character.name;
	this.fullName = character.fullName;
	this.stats = {};
	for (var name in Game.namedStats) {
		this.stats[name] = new Stat(character.baseStats[name], battleLevel, true, 1.0);
	}
	this.skills = [];
	for (var i = 0; i < this.character.techniques.length; ++i) {
		this.learnSkill(this.character.techniques[i]);
	}
}
