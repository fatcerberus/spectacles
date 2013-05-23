/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript("Item.js");

// AIContext() constructor
// Creates an object representing an enemy AI.
// Arguments:
//     unit:     The BattleUnit this AI is managing. Must be an enemy unit.
//     battle:   The battle the unit is taking part in.
//     strategy: A function, which will be called by the AIContext to determine what actions
//               should be taken next.
function AIContext(unit, battle, strategy)
{
	this.actionQueue = [];
	this.battle = battle;
	this.strategy = strategy;
	this.targets = [];
	this.unit = unit;
	
	this.turnsTaken = 0;
}

// .getNextAction() method
// Gets the next action to be performed by the AI.
AIContext.prototype.getNextAction = function()
{
	if (this.actionQueue.length == 0) {
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
		this.strategy.call(this, this.unit, null);
		if (this.actionQueue.length == 0) {
			Abort("AIContext.getNextAction(): The strategy routine didn't queue any actions...");
		}
	}
	++this.turnsTaken;
	return this.actionQueue.shift();
}

// .queueItem() method
// Adds the use of an item to the AI's action queue.
// Arguments:
//     itemID: The descriptor ID of the item to use.
// Remarks:
//     If no target has been set (as by calling .setTarget()), a random target will be
//     selected.
AIContext.prototype.queueItem = function(itemID)
{
	if (!(itemID in Game.items)) {
		Abort("AIContext.queueItem(): Item descriptor '" + itemID + "' doesn't exist!");
	}
	
	var action = new Item(itemID).use();
	this.actionQueue.push(action);
};

// .queueTechnique() method
// Adds a technique's actions to the AI's action queue.
// Arguments:
//     techniqueID: The descriptor ID of the technique to queue.
// Remarks:
//     If no target has been set (as by calling .setTarget()), a random target will be
//     selected.
AIContext.prototype.queueTechnique = function(techniqueID)
{
	if (!(techniqueID in Game.techniques)) {
		Abort("AIContext.queueTechnique(): Technique descriptor '" + techniqueID + "' doesn't exist!");
	}
	if (typeof targetIDs == 'string') {
		targetIDs = [ targetIDs ];
	}
	var technique = Game.techniques[techniqueID];
	for (var i = 0; i < technique.actions.length; ++i) {
		this.actionQueue.push(technique.actions[i]);
	}
};

// .setTarget() method
// Sets the battler to be targetted by the AI's actions.
// Arguments:
//     targetID: The enemy or character ID of the unit to target.
AIContext.prototype.setTarget = function(targetID)
{
	targets
};
