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
	this.refreshSkills = function()
	{
		var heldWeaponType = this.heldWeapon != null ? this.heldWeapon.type : null;
		this.usableSkills = [];
		for (var i = 0; i < this.skillList.length; ++i) {
			var technique = this.skillList[i].technique;
			if (technique.weaponType != null && heldWeaponType != technique.weaponType) {
				continue;
			}
			this.usableSkills.push(this.skillList[i]);
		}
	}
	
	if (battleLevel === undefined) { battleLevel = 1; }
	
	this.character = character;
	this.name = this.character.name;
	this.fullName = this.character.fullName;
	this.stats = {};
	for (var name in Game.namedStats) {
		this.stats[name] = new Stat(this.character.baseStats[name], battleLevel, true, 1.0);
	}
	this.skillList = [];
	for (var i = 0; i < this.character.skills.length; ++i) {
		this.learnSkill(this.character.skills[i]);
	}
	this.weapon = 'startingWeapon' in this.character ? Game.weapons[this.character.startingWeapon] : null;
}

// .level property
// Gets the party member's current battle level.
PartyMember.prototype.level getter = function()
{
	var sum = 0;
	var count = 0;
	for (var name in this.stats) {
		sum += this.stats[name].level;
		++count;
	}
	return Math.floor(sum / count);
};

// .skills property
// Gets a list of the skills the party member can currently use.
PartyMember.prototype.skills getter = function()
{
	return this.usableSkills;
};

// .weapon property
// Gets or sets the party member's currently held weapon.
PartyMember.prototype.weapon getter = function()
{
	return this.heldWeapon;
};
PartyMember.prototype.weapon setter = function(value)
{
	this.heldWeapon = value;
	this.refreshSkills();
};

// .learnSkill() method
// Grants the party member the ability to use a technique.
// Arguments:
//     handle: The handle of the technique to learn.
// Returns:
//     The newly learned skill.
PartyMember.prototype.learnSkill = function(handle)
{
	var skill = new Skill(handle);
	this.skillList.push(skill);
	this.refreshSkills();
	return skill;
};
