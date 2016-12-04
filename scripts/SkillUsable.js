/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Stat.js");

// SkillUsable() constructor
// Creates an object representing a learned battler skill.
// Arguments:
//     skillID: The ID of the skill as defined in the gamedef.
//     level:   Optional. The starting proficiency level for the skill. (default: 1)
function SkillUsable(skillID, level)
{
	level = level !== void null ? level : 1;
	
	if (!(skillID in Game.skills)) {
		Abort("SkillUsable(): The skill definition '" + skillID + "' doesn't exist.");
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

// .defaultTargets() method
// Determines the default targets for the skill.
// Arguments:
//     user: The battle unit which will use the skill.
// Returns:
//     An array of battle unit references specifying the default targets.
// Remarks:
//     For skills targeting a single enemy, this function will choose a random unit
//     on the opposing side. For skills targeting a single ally, the default target is
//     always the user.
SkillUsable.prototype.defaultTargets = function(user)
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
};

// .getLevel() method
// Returns the skill's current growth level.
SkillUsable.prototype.getLevel = function()
{
	for (var level = 100; level >= 2; --level) {
		if (this.experience >= this.levelUpTable[level]) {
			return level;
		}
	}
	return 1;
};

// .getRank() method
// Calculates the skill's move rank.
SkillUsable.prototype.getRank = function()
{
	return Game.math.skillRank(this.skillInfo);
};

// .grow() method
// Applies experience to the skill.
// Arguments:
//     amount: The number of experience points to apply.
SkillUsable.prototype.grow = function(amount)
{
	amount = Math.max(Math.round(amount), 0);
	this.experience = Math.min(this.experience + amount, this.levelUpTable[100]);
	term.print("Skill " + this.name + " gained " + amount + " EXP",
		"lv: " + this.getLevel());
};

// .isUsable() method
// Determines whether the skill can be used by a specified battler.
// Arguments:
//     user:   The battle unit that will be using the skill.
//     stance: The user's stance.
// Returns:
//     true if the skill can be used; false otherwise.
SkillUsable.prototype.isUsable = function(user, stance)
{
	var userWeaponType = user.weapon != null ? user.weapon.type : null;
	var skillWeaponType = this.skillInfo.weaponType;
	if (skillWeaponType != null && userWeaponType != skillWeaponType) {
		return false;
	}
	var isValidCounter = ('allowAsCounter' in this.skillInfo ? this.skillInfo.allowAsCounter : true)
		&& this.skillInfo.targetType == 'single' && this.skillInfo.actions.length == 1;
	return this.mpCost(user) <= user.mpPool.availableMP
		&& (stance != BattleStance.Counter || isValidCounter)
		&& stance != BattleStance.Guard;
}

// .mpCost() method
// Calculates the MP cost for a specified battler to use the skill.
// Arguments:
//     user: The battle unit that will be using the skill.
SkillUsable.prototype.mpCost = function(user)
{
	return Math.min(Math.max(Math.ceil(Game.math.mp.usage(this.skillInfo, this.getLevel(), user.battlerInfo)), 0), 999);
};

// .peekActions() method
// Peeks at the battle actions that will be executed if the skill is used.
// Returns:
//     An array of battle actions that will be executed when the skill is used.
// Remarks:
//     The array returned by this method should be considered read-only. Changing its contents
//     will change the skill definition, which is probably not what you want.
SkillUsable.prototype.peekActions = function()
{
	return this.skillInfo.actions;
};

// .use() method
// Utilizes the skill.
// Arguments:
//     unit:    The battler using the skill.
//     targets: An array of battler(s) to be targeted by the skill.
// Returns:
//     An array of battle actions to be executed. Unlike with peekActions(), the contents of the array may
//     be safely modified without affecting the underlying skill definition.
SkillUsable.prototype.use = function(unit, targets)
{
	if (!this.isUsable(unit, unit.stance)) {
		Abort("SkillUsable.use(): " + unit.name + " tried to use " + this.name + ", which was unusable (this is usually due to insufficient MP).");
	}
	term.print(unit.name + " is using " + this.name,
		"targ: " + (targets.length > 1 ? "[multi]" : targets[0].name));
	if (unit.weapon != null && this.skillInfo.weaponType != null) {
		term.print("weapon is " + unit.weapon.name, "lv: " + unit.weapon.level);
	}
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
};
