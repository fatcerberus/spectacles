/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("BattleUnit.js");

// BattleResult enumeration
// Specifies the outcome of a battle.
BattleResult =
{
	partyWon: 1,
	partyRetreated: 2,
	enemyWon: 3
};

// Battle() constructor
// Creates an object representing a battle session.
// Arguments:
//     session: The game session in which the battle is taking place.
//     setup:   The starting parameters for the battle.
function Battle(session, battleClass)
{
	this.tick = function() {
		if (this.suspendCount > 0) {
			return;
		}
		var actionTaken = false;
		while (!actionTaken) {
			for (var i = 0; i < this.allBattleUnits.length; ++i) {
				actionTaken = this.allBattleUnits[i].tick() || actionTaken;
			}
		}
	};
	
	this.render = function() {
		ApplyColorMask(CreateColor(0, 128, 0, 255));
	};
	this.update = function() {
		this.tick();
		return this.battleResult == null;
	};
	
	this.setup = Game.battles[battleClass];
	this.battleResult = null;
	this.allBattleUnits = [];
	this.playerUnits = [];
	this.enemyUnits = [];
	this.suspendCount = 0;
	this.conditions = [];
}

// .battleLevel property
// Gets the enemy battle level for the battle.
Battle.prototype.battleLevel getter = function()
{
	return this.setup.battleLevel;
};

// .go() method
// Starts the battle.
Battle.prototype.go = function()
{
	this.enemyUnits = [];
	for (var i = 0; i < this.setup.enemies.length; ++i) {
		var enemyInfo = Game.enemies[this.setup.enemies[i]];
		var unit = new BattleUnit(this, enemyInfo);
		this.enemyUnits.push(unit);
		this.allBattleUnits.push(unit);
	}
	var battleThread = Threads.createEntityThread(this);
	Threads.waitFor(battleThread);
	return this.battleResult;
};

// .suspend() method
// Pauses the battle.
Battle.prototype.suspend = function()
{
	++this.suspendCount;
};

// .resume() method
// Resumes a previously-suspended battle.
Battle.prototype.resume = function()
{
	--this.suspendCount;
	if (this.suspendCount < 0) {
		this.suspendCount = 0;
	}
};

// .predictTurns() method
// Takes a forecast of the next 10 units to act.
// Arguments:
//     actingUnit: The BattleUnit that is about to act.
//     nextMoves:  The list of move(s) to be used by actingUnit.
Battle.prototype.predictTurns = function(actingUnit, nextMoves)
{
	var forecast = [];
	for (var turnIndex = 0; turnIndex <= 9; ++turnIndex) {
		for (var iUnit = 0; iUnit < this.allBattleUnits.length; ++iUnit) {
			var unit = this.allBattleUnits[iUnit];
			var timeUntilUp = unit.timeUntilTurn(turnIndex, 3, (actingUnit === unit) ? nextMoves : null);
			forecast.push({ unit: unit, remainingTime: timeUntilUp });
		}
	}
	forecast.sort(function(a, b) { return a.remainingTime - b.remainingTime; });
	return forecast.slice(0, 10);
};

// .runAction() method
// Executes a battler action.
// Arguments:
//     actingUnit:  The BattleUnit performing the move.
//     targetUnits: The list of BattleUnits, if any, targetted by the acting unit.
//     action:      The action being executed.
Battle.prototype.runAction = function(actingUnit, targetUnits, action)
{
	//TODO: implement me!
};

// .spawnEnemy() method
// Spawns an additional enemy unit and adds it to the battle.
// Arguments:
//     enemyClass: The class name of the enemy to be spawned.
Battle.prototype.spawnEnemy = function(enemyClass)
{
	var newUnit = new BattleUnit(this, enemyClass);
	this.enemyUnits.push(newUnit);
};
