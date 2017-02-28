/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript("battleEngine/stat.js");

class SkillUsable
{
	constructor(skillID, level = 1)
	{
		if (!(skillID in Game.skills)) {
			throw new ReferenceError(`no skill definition for '${skillID}'`);
		}
		this.levelUpTable = [];
		for (var i = 1; i <= 100; ++i) {
			var xpNeeded = Math.ceil(i > 1 ? Math.pow(i, 3) : 0);
			this.levelUpTable[i] = xpNeeded;
		}
		this.skillInfo = Game.skills[skillID];
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

	defaultTargets(user)
	{
		switch (this.skillInfo.targetType) {
			case 'single':
				var enemies = user.battle.enemiesOf(user);
				var target = from(enemies)
					.where(function(unit) { return unit.isAlive(); })
					.sample(1).first();
				if (this.allowDeadTarget && from(enemies).any(function(unit) { return !unit.isAlive(); })) {
					target = from(enemies)
						.where(function(unit) { return !unit.isAlive(); })
						.sample(1).first();
				}
				return [ target ];
			case 'ally':
				var allies = user.battle.alliesOf(user);
				var target = user;
				if (this.allowDeadTarget && from(allies).any(function(unit) { return !unit.isAlive(); })) {
					target = from(allies)
						.where(function(unit) { return !unit.isAlive(); })
						.sample(1).first();
				}
				return [ target ];
			case 'allEnemies':
				return from(user.battle.enemiesOf(user))
					.where(function(unit) { return unit.isAlive() || this.allowDeadUnits }.bind(this))
					.select();
			case 'allAllies':
				return from(user.battle.alliesOf(user))
					.where(function(unit) { return unit.isAlive() || this.allowDeadUnits }.bind(this))
					.select();
			default:
				return user;
		}
	}

	getLevel()
	{
		for (var level = 100; level >= 2; --level) {
			if (this.experience >= this.levelUpTable[level]) {
				return level;
			}
		}
		return 1;
	}

	getRank()
	{
		return Game.math.skillRank(this.skillInfo);
	}

	grow(amount)
	{
		amount = Math.max(Math.round(amount), 0);
		this.experience = Math.min(this.experience + amount, this.levelUpTable[100]);
		term.print(`skill ${this.name} gained ${amount} EXP`, `lv: ${this.getLevel()}`);
	}

	isUsable(user, stance)
	{
		var userWeaponType = user.weapon != null ? user.weapon.type : null;
		var skillWeaponType = this.skillInfo.weaponType;
		if (skillWeaponType != null && userWeaponType != skillWeaponType) {
			return false;
		}
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
		return Math.min(Math.max(Math.ceil(Game.math.mp.usage(this.skillInfo, this.getLevel(), user.battlerInfo)), 0), 999);
	}

	peekActions()
	{
		return this.skillInfo.actions;
	}

	use(unit, targets)
	{
		if (!this.isUsable(unit, unit.stance))
			throw new Error(`${unit.name} tried to use unusable skill ${this.name}`);
		term.print(`${unit.name} is using ${this.name}`, `targ: ${targets.length > 1 ? "[multi]" : targets[0].name}`);
		if (unit.weapon != null && this.skillInfo.weaponType != null)
			term.print(`weapon is ${unit.weapon.name}`, `lv: ${unit.weapon.level}`);
		unit.mpPool.use(this.mpCost(unit));
		var growthRate = 'growthRate' in this.skillInfo ? this.skillInfo.growthRate : 1.0;
		var targetInfos = [];
		for (var i = 0; i < targets.length; ++i) {
			targetInfos.push(targets[i].battlerInfo);
		}
		var experience = Game.math.experience.skill(this.skillInfo, unit.battlerInfo, targetInfos);
		this.grow(experience);
		var eventData = { skill: clone(this.skillInfo) };
		unit.raiseEvent('useSkill', eventData);
		unit.battle.skillUsed.invoke(unit.id, this.skillID,
			from(targets).select(function(x) { return x.id; }));
		return eventData.skill.actions;
	}
}
