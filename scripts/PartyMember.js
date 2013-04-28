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
	if (battleLevel === undefined) { battleLevel = 1; }
	
	this.character = character;
	this.name = this.character.name;
	this.fullName = this.character.fullName;
	this.stats = {};
	for (var name in Game.namedStats) {
		this.stats[name] = new Stat(this.character.baseStats[name], battleLevel, true, 1.0);
	}
	this.weapon = Game.weapons[this.character.weapon];
	this.skillList = [];
	for (var i = 0; i < this.character.techniques.length; ++i) {
		this.learnSkill(this.character.techniques[i]);
	}
}

// .battleLevel property
// Gets the party member's overall battle level.
PartyMember.prototype.battleLevel getter = function()
{
	var sum = 0;
	for (var name in this.stats) {
		sum += this.stats[name].level;
	}
	return Math.floor(sum / this.stats.length);
};

// .skills property
// Gets a list of the skills the party member can currently use.
PartyMember.prototype.skills getter = function()
{
	var heldWeaponType = this.weapon != null ? this.weapon.type : null;
	var usableSkills = [];
	for (var i = 0; i < this.skillList.length; ++i) {
		var technique = this.skillList[i].technique;
		if (technique.weaponType != null && heldWeaponType != technique.weaponType) {
			continue;
		}
		usableSkills.push(this.skillList[i]);
	}
	return usableSkills;
};

// .learnSkill method
// Grants the party member the ability to use a technique.
// Arguments:
//     handle: The handle of the technique to learn.
PartyMember.prototype.learnSkill = function(handle)
{
	this.skillList.push(new Skill(handle));
};
