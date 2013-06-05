/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Stat.js");

// SkillUsable() constructor
// Creates an object representing a usable battler skill.
// Arguments:
//     skillID: The ID of the skill as defined in the gamedef.
//     level:   Optional. The starting level for the skill. (default: 1)
function SkillUsable(skillID, level)
{
	level = level !== void null ? level : 1;
	
	if (!(skillID in Game.skills)) {
		Abort("SkillUsable(): The skill definition '" + skillID + "' doesn't exist.");
	}
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
	var rank = 0;
	for (var i = 0; i < this.skillInfo.actions.length; ++i) {
		rank += this.skillInfo.actions[i].rank;
	}
	return rank;
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
	return Math.min(Math.max(Math.ceil(Game.math.mp.usage(this.skillInfo, this.getLevel(), user.getInfo())), 0), 999);
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
//     unit: The battler using the skill.
// Returns:
//     An array of battle actions to be executed. Unlike with peekActions(), the contents of the array may
//     be freely modified without changing the skill definition.
SkillUsable.prototype.use = function(unit)
{
	if (!this.isUsable(unit)) {
		Abort("SkillUsable.use(): " + unit.name + " tried to use " + this.name + ", which was unusable (likely due to insufficient MP).");
	}
	Console.writeLine(unit.name + " is using skill " + this.name);
	if (unit.weapon != null && this.skillInfo.weaponType != null) {
		Console.append("weaponLv: " + unit.weapon.level);
	}
	unit.mpPool.use(this.mpCost(unit));
	var growthRate = 'growthRate' in this.skillInfo ? this.skillInfo.growthRate : 1.0;
	var experience = Game.math.experience.skill(unit, this.skillInfo);
	this.levelStat.grow(experience);
	Console.writeLine(unit.name + " got " + experience + " EXP for " + this.name);
	Console.append("level: " + this.levelStat.getValue());
	return clone(this.skillInfo.actions);
};
