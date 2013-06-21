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
	this.givesExperience = true;
	this.levelStat = new Stat(100, level);
	this.name = Game.skills[skillID].name;
	this.skillInfo = Game.skills[skillID];
	this.skillID = skillID;
}

// .getLevel() method
// Returns the skill's current growth level.
SkillUsable.prototype.getLevel = function()
{
	return this.levelStat.getValue();
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
	this.levelStat.grow(experience);
	Console.writeLine(unit.name + " got " + experience + " EXP for " + this.name);
	Console.append("lv: " + this.levelStat.getValue());
	var eventData = { skill: clone(this.skillInfo) };
	unit.raiseEvent('useSkill', eventData);
	return eventData.skill.actions;
};
