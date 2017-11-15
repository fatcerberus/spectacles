/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { from } from 'sphere-runtime';

import { clone, console } from '$/main.mjs';
import { Stance } from './battle-unit.mjs';
import { Stat } from './stat.mjs';

import { Game, Items, Maths, Skills, Weapons } from '$/game-data/index.mjs';

export
class ItemUsable
{
	constructor(itemID)
	{
		if (!(itemID in Items))
			throw new ReferenceError(`no such item '${itemID}'`);

		this.givesExperience = false;
		this.isUnlimited = false;
		this.itemDef = clone(Items[itemID]);
		if (!('rank' in this.itemDef.action))
			this.itemDef.action.rank = Game.defaultItemRank;
		this.isGroupCast = false;
		this.itemID = itemID;
		this.name = this.itemDef.name;
		this.useAiming = false;
		this.allowDeadTarget = 'allowDeadTarget' in this.itemDef
			? this.itemDef.allowDeadTarget
			: false;
		this.usesLeft = 'uses' in this.itemDef ? this.itemDef.uses : 1;
	}

	get rank()
	{
		return 'rank' in this.itemDef.action ? this.itemDef.action.rank
			: Game.defaultItemRank;
	}

	clone()
	{
		var newCopy = new ItemUsable(this.itemID);
		newCopy.usesLeft = this.usesLeft;
		return newCopy;
	}

	defaultTargets(user)
	{
		var target = user;
		var allies = user.battle.alliesOf(user);
		if (this.allowDeadTarget && from(allies).any(unit => !unit.isAlive())) {
			target = from(allies)
				.where(unit => !unit.isAlive())
				.sample(1).first();
		}
		return [ target ];
	}

	isUsable(user, stance = Stance.Attack)
	{
		return (this.isUnlimited || this.usesLeft > 0)
			&& stance == Stance.Attack;
	}

	mpCost(user)
	{
		return 0;
	}

	peekActions()
	{
		return [ this.itemDef.action ];
	}

	use(unit, targets)
	{
		if (!this.isUsable(unit, unit.stance))
			throw new Error(`${unit.name} tried to use unusable item ${this.name}`);
		--this.usesLeft;
		console.log(`${unit.name} is using ${this.name}`,
			`targ: ${targets.length > 1 ? "[multi]" : targets[0].name}`,
			`left: ${this.usesLeft}`);
		var eventData = { item: clone(this.itemDef) };
		unit.raiseEvent('useItem', eventData);
		unit.battle.notifyAIs('itemUsed', unit.id, this.itemID, from(targets).select(v => v.id).toArray());
		return [ eventData.item.action ];
	}
}

export
class SkillUsable
{
	constructor(skillID, level = 1)
	{
		if (!(skillID in Skills))
			throw new ReferenceError(`no skill definition for '${skillID}'`);

		this.levelUpTable = [];
		for (let i = 1; i <= 100; ++i) {
			var xpNeeded = Math.ceil(i > 1 ? i ** 3 : 0);
			this.levelUpTable[i] = xpNeeded;
		}
		this.skillInfo = Skills[skillID];
		this.experience = this.levelUpTable[level];
		this.givesExperience = true;
		this.isGroupCast = from([ 'allEnemies', 'allAllies' ])
			.anyIs(this.skillInfo.targetType);
		this.name = this.skillInfo.name;
		this.skillID = skillID;
		this.useAiming = true;
		this.allowDeadTarget = 'allowDeadTarget' in this.skillInfo
			? this.skillInfo.allowDeadTarget
			: false;
	}

	get level()
	{
		for (let level = 100; level >= 2; --level) {
			if (this.experience >= this.levelUpTable[level])
				return level;
		}
		return 1;
	}

	get rank()
	{
		return Maths.skillRank(this.skillInfo);
	}

	defaultTargets(user)
	{
		switch (this.skillInfo.targetType) {
			case 'single':
				var enemies = user.battle.enemiesOf(user);
				var target = from(enemies)
					.where(v => v.isAlive())
					.sample(1).first();
				if (this.allowDeadTarget && from(enemies).any(v => !v.isAlive())) {
					target = from(enemies)
						.where(v => !v.isAlive())
						.sample(1).first();
				}
				return [ target ];
			case 'ally':
				var allies = user.battle.alliesOf(user);
				var target = user;
				if (this.allowDeadTarget && from(allies).any(v => !v.isAlive())) {
					target = from(allies)
						.where(v => !v.isAlive())
						.sample(1).first();
				}
				return [ target ];
			case 'allEnemies':
				return from(user.battle.enemiesOf(user))
					.where(v => v.isAlive() || this.allowDeadUnits)
					.toArray();
			case 'allAllies':
				return from(user.battle.alliesOf(user))
					.where(v => v.isAlive() || this.allowDeadUnits)
					.toArray();
			default:
				return user;
		}
	}

	grow(amount)
	{
		amount = Math.max(Math.round(amount), 0);
		this.experience = Math.min(this.experience + amount, this.levelUpTable[100]);
		console.log(`skill ${this.name} gained ${amount} EXP`, `lv: ${this.level}`);
	}

	isUsable(user, stance = Stance.Attack)
	{
		var userWeaponType = user.weapon != null ? user.weapon.type : null;
		var skillWeaponType = this.skillInfo.weaponType;
		if (skillWeaponType != null && userWeaponType != skillWeaponType)
			return false;
		var canCharge = ('chargeable' in this.skillInfo ? this.skillInfo.chargeable : true)
			&& this.skillInfo.actions.length == 1;
		var isValidCounter = ('allowAsCounter' in this.skillInfo ? this.skillInfo.allowAsCounter : true)
			&& this.skillInfo.targetType == 'single' && this.skillInfo.actions.length == 1;
		return this.mpCost(user) <= user.mpPool.availableMP
			&& (stance != Stance.Charge || canCharge)
			&& (stance != Stance.Counter || isValidCounter)
			&& stance != Stance.Guard;
	}

	mpCost(user)
	{
		return Math.min(Math.max(Math.ceil(Maths.mp.usage(this.skillInfo, this.level, user.battlerInfo)), 0), 999);
	}

	peekActions()
	{
		return this.skillInfo.actions;
	}

	use(unit, targets)
	{
		if (!this.isUsable(unit, unit.stance))
			throw new Error(`${unit.name} tried to use unusable skill ${this.name}`);
		console.log(`${unit.name} is using ${this.name}`, `targ: ${targets.length > 1 ? "[multi]" : targets[0].name}`);
		if (unit.weapon != null && this.skillInfo.weaponType != null)
			console.log(`weapon is ${unit.weapon.name}`, `lv: ${unit.weapon.level}`);
		unit.mpPool.use(this.mpCost(unit));
		var growthRate = 'growthRate' in this.skillInfo ? this.skillInfo.growthRate : 1.0;
		var targetInfos = [];
		for (let i = 0; i < targets.length; ++i)
			targetInfos.push(targets[i].battlerInfo);
		var experience = Maths.experience.skill(this.skillInfo, unit.battlerInfo, targetInfos);
		this.grow(experience);
		let eventData = { skill: clone(this.skillInfo) };
		unit.raiseEvent('useSkill', eventData);
		unit.battle.notifyAIs('skillUsed', unit.id, this.skillID, unit.stance, from(targets).select(v => v.id).toArray());
		return eventData.skill.actions;
	}
}

export
class WeaponUsable
{
	constructor(weaponID)
	{
		if (!(weaponID in Weapons))
			throw new ReferenceError(`no weapon definition for '${weaponID}'`);

		this.givesExperience = false;
		this.isUnlimited = true;
		this.weaponDef = clone(Weapons[weaponID]);
		this.isGroupCast = false;
		this.weaponID = weaponID;
		this.name = this.weaponDef.name;
		this.useAiming = false;
		this.allowDeadTarget = false;
	}

	get rank()
	{
		return Game.equipWeaponRank;
	}

	clone()
	{
		var newCopy = new WeaponUsable(this.weaponID);
		return newCopy;
	}

	defaultTargets(user)
	{
		return [ user ];
	}

	isUsable(user, stance = Stance.Attack)
	{
		return stance == Stance.Attack;
	}

	mpCost(user)
	{
		return 0;
	}

	use(unit, targets)
	{
		if (!this.isUsable(unit, unit.stance)) {
			Abort("WeaponUsable.use(): " + unit.name + " tried to change weapons, which is not currently possible.");
		}
		console.log(unit.name + " is equipping " + this.name,
			"targ: " + (targets.length > 1 ? "[multi]" : targets[0].name));
		from(targets).each(function(x) {
			x.setWeapon(this.weaponID);
		}.bind(this));
		return null;
	}
}
