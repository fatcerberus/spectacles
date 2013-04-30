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
		if (this.suspendCount > 0 || this.result != null) {
			return;
		}
		var unitLists = [ this.enemyUnits, this.playerUnits ];
		var actionTaken = false;
		while (!actionTaken) {
			for (var iList = 0; iList < unitLists.length; ++iList) {
				for (var i = 0; i < unitLists[iList].length; ++i) {
					actionTaken = unitLists[iList][i].tick() || actionTaken;
					if (!unitLists[iList][i].isAlive) {
						unitLists[iList].splice(i, 1);
						--i; continue;
					}
				}
			}
			if (this.playerUnits.length == 0) {
				this.result = BattleResult.enemyWon;
				return;
			}
			if (this.enemyUnits.length == 0) {
				this.result = BattleResult.partyWon;
				return;
			}
		}
	};
	
	this.render = function() {
		ApplyColorMask(CreateColor(64, 64, 64, 255));
	};
	this.update = function() {
		this.tick();
		return this.result == null;
	};
	
	if (!(battleClass in Game.battles)) {
		Abort("Battle(): Battle definition '" + battleClass + "' doesn't exist.");
	}
	this.session = session;
	this.battleClass = battleClass;
	this.setup = Game.battles[this.battleClass];
	this.result = null;
	this.playerUnits = [];
	this.enemyUnits = [];
	this.suspendCount = 0;
	this.conditions = [];
	Console.writeLine("Battle session prepared");
	Console.append("battle def: " + this.battleClass);
}

// .battleLevel property
// Gets the enemy battle level for the battle.
Battle.prototype.battleLevel getter = function()
{
	return this.setup.battleLevel;
};

// .enemiesOf() method
// Gets a list of all units opposing a specified unit.
// Arguments:
//     unit: The unit for which to find enemies.
Battle.prototype.enemiesOf = function(unit)
{
	if (unit.isPartyMember) {
		return this.enemyUnits;
	} else {
		return this.playerUnits;
	}
};

// .go() method
// Starts the battle.
Battle.prototype.go = function()
{
	Console.writeLine("Starting battle '" + this.battleClass + "'");
	this.playerUnits = [];
	for (var name in this.session.party.members) {
		var unit = new BattleUnit(this, this.session.party.members[name]);
		this.playerUnits.push(unit);
	}
	this.enemyUnits = [];
	for (var i = 0; i < this.setup.enemies.length; ++i) {
		var enemyInfo = Game.enemies[this.setup.enemies[i]];
		var unit = new BattleUnit(this, enemyInfo);
		this.enemyUnits.push(unit);
	}
	var battleBGMTrack = this.defaultBattleBGM;
	if (this.setup.bgm != null) {
		battleBGMTrack = this.setup.bgm;
	}
	BGM.override(battleBGMTrack);
	var battleThread = Threads.createEntityThread(this);
	Threads.waitFor(battleThread);
	return this.result;
};

// .predictTurns() method
// Takes a forecast of the next 10 units to act.
// Arguments:
//     actingUnit: The BattleUnit that is about to act.
//     nextMoves:  The list of move(s) to be used by actingUnit.
Battle.prototype.predictTurns = function(actingUnit, nextMoves)
{
	var forecast = [];
	var unitLists = [ this.enemyUnits, this.playerUnits ];
	for (var turnIndex = 0; turnIndex <= 9; ++turnIndex) {
		for (var iList = 0; iList < unitLists.length; ++iList) {
			for (var i = 0; i < unitLists[iList].length; ++i) {
				var unit = unitLists[iList][i];
				var timeUntilUp = unit.timeUntilTurn(turnIndex, Game.defaultMoveRank, actingUnit === unit ? nextMoves : null);
				forecast.push({ unit: unit, remainingTime: timeUntilUp });
			}
		}
	}
	forecast.sort(function(a, b) { return a.remainingTime - b.remainingTime; });
	forecast = forecast.slice(0, 10);
	Console.writeLine("Turn prediction");
	Console.append("reqBy: " + actingUnit.name);
	Console.append("next: " + forecast[1].unit.name)
	return forecast;
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

// .runAction() method
// Executes a battler action.
// Arguments:
//     actingUnit:  The BattleUnit performing the move.
//     targetUnits: The list of BattleUnits, if any, targetted by the acting unit's move.
//     action:      The action being executed.
Battle.prototype.runAction = function(actingUnit, targetUnits, action)
{
	var targetsHit = [];
	if ('accuracyType' in action) {
		for (var i = 0; i < targetUnits.length; ++i) {
			var odds = Game.math.accuracy[action.accuracyType](actingUnit, targetUnits[i]);
			if (Math.random() < odds) {
				targetsHit.push(targetUnits[i]);
			} else {
				targetUnits[i].evade(actingUnit);
			}
		}
	} else {
		targetsHit = targetUnits;
	}
	if (targetsHit.length == 0) {
		return;
	}
	for (var i = 0; i < action.effects.length; ++i) {
		var effectTargets = null;
		if (action.effects[i].targetHint == "selected") {
			effectTargets = targetsHit;
		} else if (action.effects[i].targetHint == "user") {
			effectTargets = [ actingUnit ];
		}
		var effect = Game.effects[action.effects[i].type];
		Console.writeLine("Applying effect '" + action.effects[i].type + "'");
		Console.append("retarget: " + action.effects[i].targetHint);
		effect(actingUnit, effectTargets, action.effects[i]);
	}
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

// .suspend() method
// Pauses the battle.
Battle.prototype.suspend = function()
{
	++this.suspendCount;
};
