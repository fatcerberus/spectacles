/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript("SkillUsable.js");

// BattleAI() constructor
// Creates an object representing an enemy AI.
// Arguments:
//     unit:     The BattleUnit this AI is managing. Must be an enemy unit.
//     battle:   The battle the unit is taking part in.
//     strategy: A function, which will be called by the AI to determine which action(s)
//               should be taken next.
function BattleAI(unit, battle, strategy)
{
	this.battle = battle;
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
		if (this.moveQueue.length == 0) {
			Abort("BattleAI.getNextAction(): Strategy routine for " + this.unit.name + " didn't queue any moves");
		}
	}
	++this.turnsTaken;
	return this.moveQueue.shift();
}

// .setTarget() method
// Sets the battler to be targetted by the AI's actions.
// Arguments:
//     targetID: The enemy or character ID of the unit to target.
BattleAI.prototype.setTarget = function(targetID)
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
		if (item.itemID == itemID && item.isUsable()) {
			itemToUse = item;
			break;
		}
	}
	if (itemToUse == null) {
		Abort("BattleAI.useItem(): AI unit " + this.unit.name + " tried to use an item it didn't have");
	}
	this.moveQueue.push({
		usable: itemToUse,
		targets: [ this.unit ]
	});
};

// .useSkill() method
// Adds the use of a skill to the AI's move queue.
// Arguments:
//     techniqueID: The technique ID for the skill to use.
// Remarks:
//     If no target has been set (as by calling .setTarget()), a random target will be
//     selected.
BattleAI.prototype.useSkill = function(techniqueID)
{
	var skillToUse = new SkillUsable(techniqueID, 100);
	/*for (var i = 0; i < this.unit.skills.length; ++i) {
		var skill = this.unit.skills[i];
		if (skill.techiqueID == techniqueID) {
			skillToUse = skill;
			break;
		}
	}
	if (skillToUse == null) {
		Abort("BattleAI.useItem(): AI unit " + this.unit.name + " tried to use an unknown or unusable skill");
	}*/
	this.moveQueue.push({
		usable: skillToUse,
		targets: [ this.battle.enemiesOf(this.unit)[0] ]
	});
};
