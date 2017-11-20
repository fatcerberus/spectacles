/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { from } from 'sphere-runtime';

import { console } from '$/main.mjs';
import { SkillUsable } from '$/battle-system/usables.mjs';
import { Stat } from '$/battle-system/stat.mjs';

import { Characters, Weapons } from '$/game-data/index.mjs';

export
class Party
{
	constructor(level = 1)
	{
		console.log("initialize party manager");

		this.defaultLevel = level;
		this.members = {};
	}

	get level()
	{
		let memberCount = from(this.members).count();
		if (memberCount > 0) {
			let total = 0;
			for (const member of from(this.members))
				total += member.level;
			return Math.floor(total / memberCount);
		} else {
			return this.defaultLevel;
		}
	}

	add(characterID, level = this.level)
	{
		let newMember = new PartyMember(characterID, level);
		this.members[characterID] = newMember;
		console.log(`add PC ${newMember.name} to party`);
	}

	hasMember(characterID)
	{
		return characterID in this.members;
	}

	remove(characterID)
	{
		from(this.members)
			.where((it, key) => key === characterID)
			.besides(it => console.log(`remove PC ${it.name} from party`))
			.remove();
	}
}

export
class PartyMember
{
	constructor(characterID, level = 1)
	{
		this.characterDef = Characters[characterID];
		this.characterID = characterID;
		this.isTargetScanOn = this.characterDef.autoScan;
		this.fullName = 'fullName' in Characters[characterID] ?
			Characters[characterID].fullName :
			Characters[characterID].name;
		this.items = [];
		this.name = Characters[characterID].name;
		this.skillList = [];
		this.stats = {};
		this.usableSkills = null;

		let character = Characters[this.characterID];
		this.weaponID = 'startingWeapon' in character ? character.startingWeapon : null;
		for (let statID in character.baseStats)
			this.stats[statID] = new Stat(character.baseStats[statID], level, true, 1.0);
		console.log(`create new PC ${this.name}`, `lvl: ${this.level}`);
		for (let i = 0; i < character.skills.length; ++i)
			this.learnSkill(character.skills[i]);
	}

	get level()
	{
		let count = from(this.stats).count();
		let sum = 0;
		for (const stat of from(this.stats))
			sum += stat.level;
		return Math.floor(sum / count);
	}

	getInfo()
	{
		let info = {
			characterID: this.characterID,
			level: this.level,
			tier: 1
		};
		info.baseStats = {};
		info.stats = {};
		for (let statID in this.characterDef.baseStats) {
			info.baseStats[statID] = this.characterDef.baseStats[statID];
			info.stats[statID] = this.stats[statID].value;
		}
		return info;
	}

	getUsableSkills()
	{
		return this.usableSkills;
	}

	learnSkill(skillID)
	{
		let skill = new SkillUsable(skillID, 100);
		this.skillList.push(skill);
		this.refreshSkills();
		console.log(`PC ${this.name} learned skill ${skill.name}`);
		return skill;
	}

	refreshSkills()
	{
		let heldWeaponType = this.weaponID !== null ? Weapons[this.weaponID].type : null;
		this.usableSkills = [];
		for (let i = 0; i < this.skillList.length; ++i) {
			let skillInfo = this.skillList[i].skillInfo;
			if (skillInfo.weaponType != null && heldWeaponType != skillInfo.weaponType)
				continue;
			this.usableSkills.push(this.skillList[i]);
		}
	}

	setWeapon(weaponID)
	{
		this.weaponID = weaponID;
		this.refreshSkills();
	}
}
