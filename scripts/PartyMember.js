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
	this.skills = [];
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

// .techniques property
// Gets a list of the techniques the party member can currently use.
PartyMember.prototype.techniques getter = function()
{
	var weaponType = this.weapon != null ? this.weapon.type : null;
	var list = [];
	for (var i = 0; i < this.skills.length; ++i) {
		var technique = Game.techniques[this.skills[i].name];
		if (technique.weaponType != null && weaponType != technique.weaponType) {
			Abort(myWeaponType);
			continue;
		}
		list.push(this.skills[i].name);
	}
	return list;
};

// .learnSkill method
// Grants the party member the ability to use a technique.
// Arguments:
//     technique: The technique to learn.
PartyMember.prototype.learnSkill = function(techniqueName)
{
	this.skills.push(new Skill(techniqueName));
};
