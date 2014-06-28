/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript("SkillUsable.js");

// AIContext() constructor
// Creates an object representing a context for an enemy AI.
// Arguments:
//     unit:   The unit whose actions are to be managed by the AI.
//     battle: The battle session the unit is taking part in.
//     aiType: The constructor for the AI which will control the unit. The object it creates must,
//             at the very least, include a parameterless method named 'strategize', which
//             is required to queue at least one move (via AIContext.queueSkill or AIContext.queueItem) each
//             time it is called.
// Remarks:
//     Note: aiType will be called as a constructor (that is, via new) with the following argument:
//               aiContext: The AIContext that is hosting the AI.
function AIContext(unit, battle, aiType)
{
	Console.writeLine("Initializing AI context for " + unit.fullName);
	this.battle = battle;
	this.data = {};
	this.defaultSkillID = null;
	this.moveQueue = [];
	this.targets = null;
	this.turnsTaken = 0;
	this.unit = unit;
	this.strategy = new aiType(this);
}

// .dispose() method
// Relinquishes resources held by the AI context.
AIContext.prototype.dispose = function()
{
	Console.writeLine("Shutting down AI for " + this.unit.fullName);
	if ('dispose' in this.strategy) {
		this.strategy.dispose();
	}
};

// .getNextMove() method
// Gets the next move to be performed by the controlled unit.
// Returns:
//     An object containing the following properties:
//         usable:  The Usable object representing the skill or item to be used.
//         stance:  The battle stance the unit is switching to.
//         targets: An array of BattleUnits specifying the units targeted by the
//                  move.
// Remarks:
//     If no usable move is queued and the default skill is selected, a random target
//     will be chosen for it.
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
				Console.writeLine("No moves queued for " + this.unit.name + ", using default");
				if (this.defaultSkillID !== null) {
					this.queueSkill(this.defaultSkillID);
				} else {
					Abort("AIContext.getNextAction(): No moves were queued and there is no default skill set.");
				}
			}
		}
		var candidateMove;
		var isMoveUsable;
		do {
			candidateMove = this.moveQueue.shift();
			var isMoveUsable = candidateMove.usable.isUsable(this.unit, this.unit.stance)
				&& candidateMove.predicate();
			if (!isMoveUsable) {
				Console.writeLine("Discarding " + this.unit.name + "'s " + candidateMove.usable.name + ", not usable");
			}
		} while (!isMoveUsable && this.moveQueue.length > 0);
		if (isMoveUsable) {
			moveToUse = candidateMove;
		} else if (this.defaultSkillID !== null) {
			this.queueSkill(this.defaultSkillID);
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

// .isItemQueued() method
// Checks whether a use of an item is already in the AI's move queue.
// Arguments:
//     itemID: The item ID of the item to check for.
AIContext.prototype.isItemQueued = function(itemID)
{
	return Link(this.moveQueue)
		.pluck('usable')
		.some(function(usable) { return usable instanceof ItemUsable && usable.itemID == itemID; });
};

// .isItemUsable() method
// Determines whether the controlled unit is able to use an item.
// Arguments:
//     itemID: The ID of the item to be tested for usability.
AIContext.prototype.isItemUsable = function(itemID)
{
	return Link(this.unit.items)
		.filterBy('itemID', itemID)
		.some(function(item) { return item.isUsable(this, this.unit.stance) }.bind(this));
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
	return skillToUse.isUsable(this.unit, this.unit.stance);
};

// .itemsLeft() method
// Checks how many of a given item the controlled unit has available for use.
// Arguments:
//     itemID: The ID of the item to check.
AIContext.prototype.itemsLeft = function(itemID)
{
	var itemUsable = Link(this.unit.items).filterBy('itemID', itemID).first();
	Console.writeLine(this.unit.name + " requested item count for " + itemUsable.name);
	Console.append("left: " + itemUsable.usesLeft);
	return itemUsable.usesLeft;
};

// .predictItemTurns() method
// Gets a turn order prediction for the use of a specified skill.
// Arguments:
//     itemID: The ID, as defined in the gamedef, of the item whose effects on
//             the turn order are to be tested.
AIContext.prototype.predictItemTurns = function(itemID)
{
	if (!(itemID in Game.items)) {
		Abort("AIContext.predictItemTurns(): The item '" + itemID + "' doesn't exist!");
	}
	var itemRank = 'rank' in Game.items[itemID] ? Game.items[itemID].rank : Game.defaultItemRank;
	var forecast = this.battle.predictTurns(this.unit, [ itemRank ]);
	Console.writeLine(this.unit.name + " considering " + Game.items[itemID].name);
	Console.append("next: " + forecast[0].unit.name);
	return forecast;
};

// .predictSkillTurns() method
// Gets a turn order prediction for the use of a specified skill.
// Arguments:
//     skillID: The ID, as defined in the gamedef, of the skill whose effects on
//              the turn order are to be tested.
AIContext.prototype.predictSkillTurns = function(skillID)
{
	if (!(skillID in Game.skills)) {
		Abort("AIContext.predictSkillTurns(): The skill '" + skillID + "' doesn't exist!");
	}
	var forecast = this.battle.predictTurns(this.unit, Game.skills[skillID].actions);
	Console.writeLine(this.unit.name + " considering " + Game.skills[skillID].name);
	Console.append("next: " + forecast[0].unit.name);
	return forecast;
};

// .queueItem() method
// Adds the use of an item to the AI's move queue.
// Arguments:
//     itemID: The item ID of the item to use.
//     unitID: Optional. The ID of the unit to use the item on. If not provided or null, a
//             default target (usually the user) will be chosen.
// Remarks:
//     If no target has been set (as by calling .setTarget()), a random target will be
//     selected.
AIContext.prototype.queueItem = function(itemID, unitID)
{
	unitID = unitID !== void null ? unitID : null;
	
	var itemToUse = null;
	for (var i = 0; i < this.unit.items.length; ++i) {
		var item = this.unit.items[i];
		if (item.itemID == itemID && item.isUsable(this.unit, this.unit.stance)) {
			itemToUse = item;
			break;
		}
	}
	if (itemToUse == null) {
		Abort("AIContext.queueItem(): AI unit " + this.unit.name + " tried to use an item (ID: '" + itemID + "') it didn't have");
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

// .queueSkill() method
// Adds the use of a skill to the AI context's move queue.
// Arguments:
//     skillID:   The ID of the skill to use, as defined in the gamedef.
//     unitID:    Optional. The ID of the unit to use the skill on. If not provided or null, a
//                default target (usually random) will be chosen.
//     predicate: A function which will be called at the time the move is to be used. The function
//                should return true to use the skill, or false to cancel it.
AIContext.prototype.queueSkill = function(skillID, unitID, predicate)
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
		Abort("AIContext.queueItem(): AI unit " + this.unit.name + " tried to use an unknown or unusable skill");
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
AIContext.prototype.setDefaultSkill = function(skillID)
{
	this.defaultSkillID = skillID;
	Console.writeLine(this.unit.name + "'s default skill set to " + Game.skills[skillID].name);
};

// .setGuard() method
// Instructs the AI to put the unit into a defensive stance.
AIContext.prototype.setGuard = function()
{
	this.moveQueue.push({
		usable: null,
		stance: BattleStance.guard,
		predicate: function() { return true; }
	});
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
