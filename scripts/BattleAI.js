/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript("SkillUsable.js");

// BattleAI() constructor
// Creates an object representing an AI to control a battle unit.
// Arguments:
//     unit:     The battle unit whose actions are to be managed.
//     battle:   The battle session the unit is taking part in.
//     strategy: A function to be called by the AI when it needs to know what action(s)
//               should be taken next. The function will be called with 'this' set to the
//               BattleAI object, and takes the following arguments:
//                   me:     The BattleUnit for which actions are being determined.
//                   nextUp: The upcoming turn prediction, as returned by Battle.predictTurns().

function BattleAI(unit, battle, strategy)
{
	this.battle = battle;
	this.data = {};
	this.moveQueue = [];
	this.strategy = strategy;
	this.targets = [];
	this.unit = unit;
	
	this.turnsTaken = 0;
}

// .getNextMove() method
// Gets the next skill to be executed or item to be used by the AI.
// Returns:
//     An object with properties specifying the AI's next move.
BattleAI.prototype.getNextMove = function()
{
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
		this.strategy.call(this, this.unit, null);
		if (this.moveQueue.length == 0) {
			Abort("BattleAI.getNextAction(): The strategy function for " + this.unit.name + " didn't queue any moves.");
		}
	}
	++this.turnsTaken;
	return this.moveQueue.shift();
}

// .hasStatus() method
// Determines whether the unit being controlled is afflicted with a specified status.
// Arguments:
//     statusID: The ID of the status to test for, as defined in the gamedef.
BattleAI.prototype.hasStatus = function(statusID)
{
	return this.unit.hasStatus(statusID);
};

// .turnForecast() method
// Gets a turn order prediction for the use of a specified skill.
// Arguments:
//     skillID: The ID, as defined in the gamedef, of the skill whose effects on
//              the turn order are to be tested.
BattleAI.prototype.turnForecast = function(skillID)
{
	if (!(skillID in Game.skills)) {
		Abort("BattleAI.turnForecast(): The skill '" + skillID + "' doesn't exist!");
	}
	var forecast = this.battle.predictTurns(this.unit, Game.skills[skillID].actions);
	Console.writeLine(this.unit.name + " considering " + Game.skills[skillID].name);
	Console.append("next: " + forecast[0].unit.name);
	return forecast;
};

// .setTarget() method
// Sets the battler to be targetted by the AI's actions.
// Arguments:
//     targetIDs: The enemy or character ID of the unit to target.
BattleAI.prototype.setTarget = function(targetIDs)
{
	// TODO: implement me!
};

// .useItem() method
// Adds the use of an item to the AI's move queue.
// Arguments:
//     itemID: The item ID of the item to use.
// Remarks:
//     If no target has been set (as by calling .setTarget()), a random target will be
//     selected.
BattleAI.prototype.useItem = function(itemID)
{
	var itemToUse = null;
	for (var i = 0; i < this.unit.items.length; ++i) {
		var item = this.unit.items[i];
		if (item.itemID == itemID && item.isUsable(this.unit)) {
			itemToUse = item;
			break;
		}
	}
	if (itemToUse == null) {
		Abort("BattleAI.useItem(): AI unit " + this.unit.name + " tried to use an item it didn't have");
	}
	Console.writeLine(this.unit.name + " queued use of item " + itemToUse.name);
	this.moveQueue.push({
		usable: itemToUse,
		targets: [ this.unit ]
	});
};

// .useSkill() method
// Adds the use of a skill to the AI's move queue.
// Arguments:
//     skillID: The ID of the skill to use, as defined in the gamedef.
// Remarks:
//     If no target has been set (as by calling .setTarget()), a random target will be
//     selected.
BattleAI.prototype.useSkill = function(skillID)
{
	var skillToUse = new SkillUsable(skillID, 100);
	/*for (var i = 0; i < this.unit.skills.length; ++i) {
		var skill = this.unit.skills[i];
		if (skill.skillID == skillID) {
			skillToUse = skill;
			break;
		}
	}
	if (skillToUse == null) {
		Abort("BattleAI.useItem(): AI unit " + this.unit.name + " tried to use an unknown or unusable skill");
	}*/
	Console.writeLine(this.unit.name + " queued use of skill " + skillToUse.name);
	this.moveQueue.push({
		usable: skillToUse,
		targets: [ this.battle.enemiesOf(this.unit)[0] ]
	});
};
