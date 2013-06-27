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
	this.experience = this.levelUpTable[level];
	this.givesExperience = true;
	this.name = Game.skills[skillID].name;
	this.skillInfo = Game.skills[skillID];
	this.skillID = skillID;
	this.useAiming = true;
}

// .defaultTargets() method
// Determines the default targets for the skill.
// Arguments:
//     user: The battle unit which will use the skill.
// Returns:
//     An array of battle unit references specifying the default targets.
SkillUsable.prototype.defaultTargets = function(user)
{
	switch (this.skillInfo.targetType) {
		case 'single':
			return [ user.battle.enemiesOf(user)[0] ];
		case 'ally':
			return user;
		case 'allEnemies':
			return user.battle.enemiesOf(user);
		case 'allAllies':
			return user.battle.alliesOf(user);
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

// .isUsable() method
// Determines whether the skill can be used by a specified battler.
// Arguments:
//     user: The battle unit that will be using the skill.
// Returns:
//     true if the skill can be used; false otherwise.
SkillUsable.prototype.isUsable = function(user)
{
	var userWeaponType = user.weapon != null ? user.weapon.type : null;
	var skillWeaponType = this.skillInfo.weaponType;
	if (skillWeaponType != null && userWeaponType != skillWeaponType) {
		return false;
	}
	return this.mpCost(user) <= user.mpPool.availableMP;
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
	if (!this.isUsable(unit)) {
		Abort("SkillUsable.use(): " + unit.name + " tried to use " + this.name + ", which was unusable (likely due to insufficient MP).");
	}
	Console.writeLine(unit.name + " is using skill " + this.name);
	if (unit.weapon != null && this.skillInfo.weaponType != null) {
		Console.append("weapLv: " + unit.weapon.level);
	}
	unit.mpPool.use(this.mpCost(unit));
	var growthRate = 'growthRate' in this.skillInfo ? this.skillInfo.growthRate : 1.0;
	var targetInfos = [];
	for (var i = 0; i < targets.length; ++i) {
		targetInfos.push(targets[i].battlerInfo);
	}
	var experience = Game.math.experience.skill(this.skillInfo, unit.battlerInfo, targetInfos);
	this.experience = Math.min(this.experience + experience, this.levelUpTable[100]);
	Console.writeLine(unit.name + " got " + experience + " EXP for " + this.name);
	Console.append("lv: " + this.getLevel());
	var eventData = { skill: clone(this.skillInfo) };
	unit.raiseEvent('useSkill', eventData);
	return eventData.skill.actions;
};
