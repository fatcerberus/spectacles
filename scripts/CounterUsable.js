/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// CounterUsable() constructor
// Creates a Usable that switches a unit into a counterattacking stance.
// Arguments:
//     skillUsable: A SkillUsable representing the skill to counter with.
function CounterUsable(skillUsable)
{
	this.givesExperience = false;
	this.name = "counter:" + Game.skills[skillID].name;
	this.skill = skillUsable;
	this.useAiming = false;
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
	return [ user ];
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
CounterUsable.prototype.getRank = function()
{
	return 0;
};

// .isUsable() method
// Determines whether the skill can be used by a specified battler.
// Arguments:
//     user: The battle unit that will be using the skill.
// Returns:
//     true if the skill can be used; false otherwise.
CounterUsable.prototype.isUsable = function(user)
{
	return true;
};

// .mpCost() method
// Calculates the MP cost for a specified battler to use the skill.
// Arguments:
//     user: The battle unit that will be using the skill.
CounterUsable.prototype.mpCost = function(user)
{
	return 0;
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
		Abort("SkillUsable.use(): " + unit.name + " tried to use " + this.name + ", which was unusable (this is usually due to insufficient MP).");
	}
	Console.writeLine(unit.name + " is using " + this.name);
	if (unit.weapon != null && this.skillInfo.weaponType != null) {
		Console.append("wLv: " + unit.weapon.level);
	}
	Console.append("targ: " + (targets.length > 1 ? "[multi]" : targets[0].name));
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
	return eventData.skill.actions;
};
