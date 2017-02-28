/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleEngine/skill.js');
RequireScript('battleEngine/stat.js');

class Party
{
	constructor(level = 1)
	{
		term.print("initialize party manager");

		this.defaultLevel = level;
		this.members = {};
	}

	add(characterID, level = this.getLevel())
	{
		var newMember = new PartyMember(characterID, level);
		this.members[characterID] = newMember;
		term.print("add PC " + newMember.name + " to party");
	}

	getLevel()
	{
		if (this.members.length > 0) {
			var total = 0;
			var memberCount = 0;
			for (var i in this.members) {
				++memberCount;
				total += this.members[i].getLevel();
				
			}
			return Math.floor(total / memberCount);
		} else {
			return this.defaultLevel;
		}
	}

	hasMember(characterID)
	{
		return characterID in this.members;
	}

	remove(characterID)
	{
		for (var id in this.members) {
			if (id === characterID) {
				term.print("remove PC " + this.members[id].name + " from party");
				delete this.members[id];
			}
		}
	}
}

class PartyMember
{
	constructor(characterID, level = 1)
	{
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
		term.print("create new PC " + this.name, "lvl: " + this.getLevel());
		for (var i = 0; i < character.skills.length; ++i) {
			this.learnSkill(character.skills[i]);
		}
	}

	getInfo()
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
			info.stats[statID] = this.stats[statID].value;
		}
		return info;
	}

	getLevel()
	{
		var sum = 0;
		var count = 0;
		for (var stat in this.stats) {
			sum += this.stats[stat].level;
			++count;
		}
		return Math.floor(sum / count);
	}

	getUsableSkills()
	{
		return this.usableSkills;
	}

	learnSkill(skillID)
	{
		var skill = new SkillUsable(skillID, 100);
		this.skillList.push(skill);
		this.refreshSkills();
		term.print("PC " + this.name + " learned skill " + skill.name);
		return skill;
	}

	refreshSkills()
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
	}

	setWeapon(weaponID)
	{
		this.weaponID = weaponID;
		this.refreshSkills();
	}
}
