/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("BattleScreen.js");
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
//     session:  The game session in which the battle is taking place.
//     battleID: The ID of the battle definition to use to set up the fight.
function Battle(session, battleID)
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
					var unit = unitLists[iList][i];
					actionTaken = unit.tick() || actionTaken;
					if (!unit.isAlive) {
						unit.dispose();
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
	
	this.update = function() {
		this.tick();
		return this.result == null;
	};
	
	if (!(battleID in Game.battles)) {
		Abort("Battle(): Battle definition '" + battleClass + "' doesn't exist.");
	}
	this.session = session;
	this.battleID = battleID;
	this.parameters = Game.battles[this.battleID];
	this.result = null;
	this.playerUnits = [];
	this.enemyUnits = [];
	this.suspendCount = 0;
	this.conditions = [];
	Console.writeLine("Battle session prepared");
	Console.append("battle def: " + this.battleID);
}

// .battleLevel property
// Gets the enemy battle level for the battle.
Battle.prototype.battleLevel getter = function()
{
	return this.parameters.battleLevel;
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
	Console.writeLine("Starting battle '" + this.battleID + "'");
	this.playerUnits = [];
	this.enemyUnits = [];
	for (var i = 0; i < this.parameters.enemies.length; ++i) {
		var enemyInfo = Game.enemies[this.parameters.enemies[i]];
		var unit = new BattleUnit(this, enemyInfo, i, BattleRow.middle);
		this.enemyUnits.push(unit);
	}
	var position = 0;
	for (var name in this.session.party.members) {
		var unit = new BattleUnit(this, this.session.party.members[name], position, BattleRow.middle);
		this.playerUnits.push(unit);
		++position;
	}
	var battleBGMTrack = this.defaultBattleBGM;
	if (this.parameters.bgm != null) {
		battleBGMTrack = this.parameters.bgm;
	}
	BGM.override(battleBGMTrack);
	this.battleScreen = new BattleScreen(this);
	var battleThread = Threads.createEntityThread(this);
	this.suspend();
	if (!DBG_DISABLE_BATTLE_EVENTS && 'onStart' in this.parameters) {
		this.parameters.onStart.call(this);
	}
	for (var i = 0; i < this.playerUnits.length; ++i) {
		this.playerUnits[i].enter();
	}
	this.resume();
	Threads.waitFor(battleThread);
	this.battleScreen.dispose();
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
//     targetUnits: The list of BattleUnits, if any, targetted by the action.
//     skill:       The Skill used by the acting unit to intiate the action.
//     action:      The action to be executed.
Battle.prototype.runAction = function(actingUnit, targetUnits, skill, action)
{
	var targetsHit = [];
	if ('accuracyType' in action) {
		var accuracyRate = 'accuracyRate' in action ? action.accuracyRate : 1.0;
		for (var i = 0; i < targetUnits.length; ++i) {
			var odds = Math.min(Math.max(Game.math.accuracy[action.accuracyType](actingUnit, targetUnits[i]) * accuracyRate, 0.0), 1.0);
			Console.writeLine("Odds of hitting " + targetUnits[i].name + " are ~1:" + (Math.round(1 / odds) - 1));
			if (Math.random() < odds) {
				Console.append("hit");
				targetsHit.push(targetUnits[i]);
			} else {
				Console.append("miss");
				targetUnits[i].evade(actingUnit);
			}
		}
	} else {
		targetsHit = targetUnits;
	}
	if (targetsHit.length == 0) {
		return;
	}
	var proficiency = Math.floor(skill.level * actingUnit.level / 100);
	if (actingUnit.isPartyMember) {
		for (var stat in Game.namedStats) {
			var experience = Math.max(Game.math.experience.userStat(actingUnit, stat, action, proficiency), 0);
			if (experience > 0) {
				actingUnit.stats[stat].experience += experience;
				Console.writeLine(actingUnit.name + " got " + experience + " EXP for " + Game.namedStats[stat]);
				Console.append("statVal: " + actingUnit.stats[stat].value);
			}
		}
	}
	for (var i = 0; i < targetsHit.length; ++i) {
		if (!targetsHit[i].partyMember) {
			continue;
		}
		for (var stat in Game.namedStats) {
			var experience = Math.max(Game.math.experience.targetStat(targetsHit[i], stat, action, proficiency), 0);
			if (experience > 0) {
				targetsHit[i].stats[stat].experience += experience;
				Console.writeLine(targetsHit[i].name + " got " + experience + " EXP for " + Game.namedStats[stat]);
				Console.append("statVal: " + targetsHit[i].stats[stat].value);
			}
		}
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
	Console.writeLine("Spawning new enemy '" + enemyClass + "'");
	var newUnit = new BattleUnit(this, enemyClass);
	this.enemyUnits.push(newUnit);
};

// .suspend() method
// Pauses the battle.
Battle.prototype.suspend = function()
{
	++this.suspendCount;
};
