/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('SkillUsable.js');
RequireScript('Stat.js');

// PartyMember() constructor
// Creates an object representing an active member of a Party.
// Arguments:
//     characterID: The ID of the character represented by this party member.
//     level:       Optional. The party member's initial level. (default: 1)
function PartyMember(characterID, level)
{
	level = level !== void null ? level : 1;
	
	this.characterDef = Game.characters[characterID];
	this.characterID = characterID;
	this.isTargetScanOn = this.characterDef.autoScan;
	this.fullName = 'fullName' in Game.characters[characterID] ?
		Game.characters[characterID].fullName :
		Game.characters[characterID].name;
	this.items = [];
	this.name = Game.characters[characterID].name;
	this.skillList = [];
	this.stats = {};
	this.usableSkills = null;
	
	var character = Game.characters[this.characterID];
	this.weaponID = 'startingWeapon' in character ? character.startingWeapon : null;
	for (var statID in character.baseStats) {
		this.stats[statID] = new Stat(character.baseStats[statID], level, true, 1.0);
	}
	Console.writeLine("Created new PC " + this.name);
	Console.append("lvl: " + this.getLevel());
	for (var i = 0; i < character.skills.length; ++i) {
		this.learnSkill(character.skills[i]);
	}
}

// .getInfo() property
// Compiles information about the party member.
// Returns:
//     An object containing information about the party member.
PartyMember.prototype.getInfo = function()
{
	var info = {
		characterID: this.characterID,
		level: this.getLevel(),
		tier: 1
	}
	info.baseStats = {};
	info.stats = {};
	for (var statID in this.characterDef.baseStats) {
		info.baseStats[statID] = this.characterDef.baseStats[statID];
		info.stats[statID] = this.stats[statID].getValue();
	}
	return info;
};

// .getLevel() property
// Gets the party member's current overall level.
PartyMember.prototype.getLevel = function()
{
	var sum = 0;
	var count = 0;
	for (var stat in this.stats) {
		sum += this.stats[stat].getLevel();
		++count;
	}
	return Math.floor(sum / count);
};

// .getUsableSkills() method
// Gets a list of all skills that the party member can currently use.
PartyMember.prototype.getUsableSkills = function()
{
	return this.usableSkills;
};

// .learnSkill() method
// Grants the party member the ability to use a skill.
// Arguments:
//     skillID: The ID of the skill to learn, as defined in the gamedef.
// Returns:
//     A reference to a SkillUsable object representing the newly learned skill.
PartyMember.prototype.learnSkill = function(skillID)
{
	var skill = new SkillUsable(skillID, 100);
	this.skillList.push(skill);
	this.refreshSkills();
	Console.writeLine("PC " + this.name + " learned skill " + skill.name);
	return skill;
};

// .refreshSkills() method
// Builds the list of skills currently usable by the party member.
// Remarks:
//     This method will be called internally any time a change is made
//     that affects the skills the party member is able to use, for instance
//     when learning a new skill or changing weapons.
PartyMember.prototype.refreshSkills = function()
{
	var heldWeaponType = this.weaponID !== null ? Game.weapons[this.weaponID].type : null;
	this.usableSkills = [];
	for (var i = 0; i < this.skillList.length; ++i) {
		var skillInfo = this.skillList[i].skillInfo;
		if (skillInfo.weaponType != null && heldWeaponType != skillInfo.weaponType) {
			continue;
		}
		this.usableSkills.push(this.skillList[i]);
	}
};

// .render() method
// Renders character growth pop-ups for this party member.
PartyMember.prototype.render = function()
{
	
};

// .setWeapon() method
// Sets the weapon that the party member uses in battle.
PartyMember.prototype.setWeapon = function(weaponID)
{
	this.weaponID = weaponID;
	this.refreshSkills();
};
