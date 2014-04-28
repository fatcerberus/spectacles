/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript("SkillUsable.js");

// AIContext() constructor
// Creates an object representing a context for an enemy AI.
// Arguments:
//     unit:     The unit whose actions are to be managed by the AI.
//     battle:   The battle session the unit is taking part in.
//     strategy: A function to be called by the AI context when it needs to know what action(s)
//               should be taken next. The function will be called with 'this' set to the
//               AIContext object, and takes the following arguments:
//                   me:     The BattleUnit for which actions are being determined.
//                   nextUp: The upcoming turn prediction, as returned by Battle.predictTurns().
function AIContext(unit, battle, strategy)
{
	this.battle = battle;
	this.data = {};
	this.defaultSkillID = null;
	this.moveQueue = [];
	this.targets = null;
	this.turnsTaken = 0;
	this.unit = unit;
	this.strategy = new strategy(this.battle, this.unit, this);
}

// .getNextMove() method
// Gets the next skill to be executed or item to be used by the AI.
// Returns:
//     An object with properties specifying the AI's next move.
AIContext.prototype.getNextMove = function()
{
	var moveToUse = null;
	do {
		if (this.moveQueue.length == 0) {
			Console.writeLine("Deferring to AI for " + this.unit.name + "'s next move");
			var enemyList = this.battle.enemiesOf(this.unit);
			this.enemies = [];
			for (var i = 0; i < enemyList.length; ++i) {
				var enemy = enemyList[i];
				this.enemies.push(enemy);
				this.enemies[enemy.id] = enemy;
			}
			var allyList = this.battle.alliesOf(this.unit);
			this.allies = [];
			for (var i = 0; i < allyList.length; ++i) {
				var ally = allyList[i];
				this.allies.push(ally);
				this.allies[ally.id] = ally;
			}
			this.targets = null;
			this.strategy.strategize();
			if (this.moveQueue.length == 0) {
				Console.writeLine(this.unit.name + " didn't queue any actions, defaulting");
				if (this.defaultSkillID !== null) {
					this.useSkill(this.defaultSkillID);
				} else {
					Abort("AIContext.getNextAction(): No moves were queued and there is no default skill set.");
				}
			}
		}
		var candidateMove;
		var isMoveUsable;
		do {
			candidateMove = this.moveQueue.shift();
			var isMoveUsable = candidateMove.predicate();
		} while (!isMoveUsable && this.moveQueue.length > 0);
		if (isMoveUsable) {
			moveToUse = candidateMove;
		}
	} while (moveToUse === null);
	++this.turnsTaken;
	return moveToUse;
}

// .hasMovesQueued() method
// Checks whether the controlled unit has any moves pending (queued).
AIContext.prototype.hasMovesQueued = function()
{
	return this.moveQueue.length > 0;
};

// .hasStatus() method
// Determines whether the unit being controlled is afflicted with a specified status.
// Arguments:
//     statusID: The ID of the status to test for, as defined in the gamedef.
AIContext.prototype.hasStatus = function(statusID)
{
	return this.unit.hasStatus(statusID);
};

// .isItemUsable() method
// Determines whether the controlled unit is able to use an item.
// Arguments:
//     itemID: The ID of the item to be tested for usability.
AIContext.prototype.isItemUsable = function(itemID)
{
	var user = this.unit;
	return Link(this.unit.items)
		.filterBy('itemID', itemID)
		.some(function(item) { return item.isUsable(user) });
};

// .isSkillQueued() method
// Checks whether a use of a skill is already in the AI's move queue.
// Arguments:
//     skillID: The skill ID of the skill to check for.
AIContext.prototype.isSkillQueued = function(skillID)
{
	return Link(this.moveQueue)
		.pluck('usable')
		.some(function(usable) { return usable instanceof SkillUsable && usable.skillID == skillID; });
};

// .isSkillUsable() method
// Determines whether the controlled unit is able to use a skill.
// Arguments:
//     skillID: The ID of the skill to be tested for usability.
AIContext.prototype.isSkillUsable = function(skillID)
{
	var skillToUse = new SkillUsable(skillID, 100);
	return skillToUse.isUsable(this.unit);
};

// .setCounter() method
// Instructs the AI to put the unit into counterattacking stance.
// Arguments:
//     skillID: The ID of the skill to counter with, as defined in the gamedef.
AIContext.prototype.setCounter = function(skillID)
{
	var skill = new SkillUsable(skillID, 100);
	this.moveQueue.push({
		usable: skill,
		stance: BattleStance.counter,
		predicate: function() { return true; }
	});
};

// .setDefaultSkill() method
// Sets the skill to be used when no specific moves are queued.
// Arguments:
//     skillID: The ID of the skill to use, as defined in the gamedef.
// Remarks:
//     If no target has been set (as by calling .setTarget()) at the time this skill is
//     used, a random target will be selected.
AIContext.prototype.setDefaultSkill = function(skillID)
{
	this.defaultSkillID = skillID;
	Console.writeLine(this.unit.name + "'s default skill set to " + Game.skills[skillID].name);
};

// .setTarget() method
// Sets the battler to be targeted by the AI's actions.
// Arguments:
//     targetID: The enemy or character ID of the unit to target.
AIContext.prototype.setTarget = function(targetID)
{
	var unit = this.battle.findUnit(targetID);
	this.targets = unit !== null ? [ unit ] : null;
};

// .turnForecast() method
// Gets a turn order prediction for the use of a specified skill.
// Arguments:
//     skillID: The ID, as defined in the gamedef, of the skill whose effects on
//              the turn order are to be tested.
AIContext.prototype.turnForecast = function(skillID)
{
	if (!(skillID in Game.skills)) {
		Abort("AIContext.turnForecast(): The skill '" + skillID + "' doesn't exist!");
	}
	var forecast = this.battle.predictTurns(this.unit, Game.skills[skillID].actions);
	Console.writeLine(this.unit.name + " considering " + Game.skills[skillID].name);
	Console.append("next: " + forecast[0].unit.name);
	return forecast;
};

// .useItem() method
// Adds the use of an item to the AI's move queue.
// Arguments:
//     itemID: The item ID of the item to use.
//     unitID: Optional. The ID of the unit to use the item on. If not provided or null, a
//             default target (usually the user) will be chosen.
// Remarks:
//     If no target has been set (as by calling .setTarget()), a random target will be
//     selected.
AIContext.prototype.useItem = function(itemID, unitID)
{
	unitID = unitID !== void null ? unitID : null;
	
	var itemToUse = null;
	for (var i = 0; i < this.unit.items.length; ++i) {
		var item = this.unit.items[i];
		if (item.itemID == itemID && item.isUsable(this.unit)) {
			itemToUse = item;
			break;
		}
	}
	if (itemToUse == null) {
		Abort("AIContext.useItem(): AI unit " + this.unit.name + " tried to use an item (ID: '" + itemID + "') it didn't have");
	}
	Console.writeLine(this.unit.name + " queued use of item " + itemToUse.name);
	var targets = this.targets !== null ? this.targets
		: unitID !== null ? [ this.battle.findUnit(unitID) ]
		: itemToUse.defaultTargets(this.unit);
	this.moveQueue.push({
		usable: itemToUse,
		stance: BattleStance.attack,
		targets: targets,
		predicate: function() { return true; }
	});
};

// .useSkill() method
// Adds the use of a skill to the AI's move queue.
// Arguments:
//     skillID:   The ID of the skill to use, as defined in the gamedef.
//     unitID:    Optional. The ID of the unit to use the skill on. If not provided or null, a
//                default target (usually random) will be chosen.
//     predicate: A function which will be called at the time the move is to be used. The function
//                should return true to use the skill, or false to cancel it.
AIContext.prototype.useSkill = function(skillID, unitID, predicate)
{
	unitID = unitID !== void null ? unitID : null;
	predicate = predicate !== void null ? predicate : function() { return true; };
	
	var skillToUse = new SkillUsable(skillID, 100);
	/*for (var i = 0; i < this.unit.skills.length; ++i) {
		var skill = this.unit.skills[i];
		if (skill.skillID == skillID) {
			skillToUse = skill;
			break;
		}
	}
	if (skillToUse == null) {
		Abort("AIContext.useItem(): AI unit " + this.unit.name + " tried to use an unknown or unusable skill");
	}*/
	Console.writeLine(this.unit.name + " queued use of skill " + skillToUse.name);
	var targetUnit = unitID !== null ? this.battle.findUnit(unitID) : null;
	var targets = this.targets !== null ? this.targets
		: targetUnit !== null ? [ targetUnit ]
		: skillToUse.defaultTargets(this.unit);
	this.moveQueue.push({
		usable: skillToUse,
		stance: BattleStance.attack,
		targets: targets,
		predicate: predicate
	});
};
