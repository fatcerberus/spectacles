/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('BattleScreen.js');
RequireScript('BattleUnit.js');
RequireScript('MPPool.js');

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
//     battleID: The ID of the battle descriptor to use to set up the fight.
function Battle(session, battleID)
{
	if (!(battleID in Game.battles)) {
		Abort("Battle(): Battle definition '" + battleID + "' doesn't exist!");
	}
	
	this.battleID = battleID;
	this.conditions = [];
	this.enemyUnits = [];
	this.parameters = Game.battles[battleID];
	this.partyMPPool = null;
	this.playerUnits = [];
	this.result = null;
	this.session = session;
	this.suspendCount = 0;
	Console.writeLine("Battle session prepared");
	Console.append("battle def: " + this.battleID);
	
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
					if (!unit.isAlive()) {
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
}

// .getLevel() method
// Gets the enemy battle level for the battle.
Battle.prototype.getLevel = function()
{
	return this.parameters.battleLevel;
};

// .alliesOf() method
// Gets a list of all BattleUnits allied with a specified unit.
// Arguments:
//     unit: The BattleUnit for which to find allies.
Battle.prototype.alliesOf = function(unit)
{
	if (unit.isPartyMember()) {
		return this.partyUnits;
	} else {
		return this.enemyUnits;
	}
};

// .enemiesOf() method
// Gets a list of all BattleUnits opposing a specified unit.
// Arguments:
//     unit: The BattleUnit for which to find enemies.
Battle.prototype.enemiesOf = function(unit)
{
	if (unit.isPartyMember()) {
		return this.enemyUnits;
	} else {
		return this.playerUnits;
	}
};

// .go() method
// Starts the battle.
Battle.prototype.go = function()
{
	if (DBG_DISABLE_BATTLES) {
		return BattleResult.playerWon;
	}
	Console.writeLine("Starting battle '" + this.battleID + "'");
	var partyInfo = [];
	for (id in this.session.party.members) {
		var member = this.session.party.members[id];
		var memberInfo = {
			characterID: member.characterID
		}
		memberInfo.stats = {};
		for (var stat in Game.namedStats) {
			memberInfo.stats[stat] = member.stats[stat].getValue();
		}
		partyInfo.push(memberInfo);
	}
	var partyMaxMP = Math.round(Math.min(Math.max(Game.math.mp.party(partyInfo), 0), 9999));
	var partyMPPool = new MPPool(partyMaxMP);
	partyMPPool.lostMP.addHook(this, function(mpPool, availableMP) {
		this.ui.hud.mpGauge.set(availableMP);
	});
	this.ui = new BattleScreen(partyMaxMP);
	this.playerUnits = [];
	this.enemyUnits = [];
	for (var i = 0; i < this.parameters.enemies.length; ++i) {
		var enemyID = this.parameters.enemies[i];
		var unit = new BattleUnit(this, enemyID, i == 0 ? 1 : i == 1 ? 0 : i, BattleRow.middle);
		this.enemyUnits.push(unit);
	}
	var i = 0;
	for (var name in this.session.party.members) {
		var unit = new BattleUnit(this, this.session.party.members[name], i == 0 ? 1 : i == 1 ? 0 : i, BattleRow.middle, partyMPPool);
		this.playerUnits.push(unit);
		++i;
	}
	var battleBGMTrack = this.defaultBattleBGM;
	if (this.parameters.bgm != null) {
		battleBGMTrack = this.parameters.bgm;
	}
	BGM.override(battleBGMTrack);
	var battleThread = Threads.createEntityThread(this);
	this.suspend();
	this.ui.go('title' in this.parameters ? this.parameters.title : null);
	var walkInThreads = [];
	for (var i = 0; i < this.enemyUnits.length; ++i) {
		var thread = this.enemyUnits[i].actor.enter();
		walkInThreads.push(thread);
	}
	for (var i = 0; i < this.playerUnits.length; ++i) {
		var thread = this.playerUnits[i].actor.enter();
		walkInThreads.push(thread);
	}
	if ('onStart' in this.parameters) {
		this.parameters.onStart.call(this);
	}
	Threads.synchronize(walkInThreads);
	this.ui.showTitle();
	this.resume();
	Threads.waitFor(battleThread);
	this.ui.dispose();
	BGM.reset();
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
//     action:      The action to be executed.
//     actingUnit:  The BattleUnit performing the action.
//     targetUnits: The list of BattleUnits, if any, targetted by the action.
// Returns:
//     A list of all units affected by the action.
Battle.prototype.runAction = function(action, actingUnit, targetUnits)
{
	if ('announceAs' in action && action.announceAs != null) {
		var bannerColor = actingUnit.isPartyMember() ? CreateColor(64, 64, 192, 255) : CreateColor(192, 64, 64, 255);
		this.ui.announceAction(action.announceAs, actingUnit.isPartyMember() ? 'party' : 'enemy', bannerColor);
	}
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
		return [];
	}
	for (var i = 0; i < action.effects.length; ++i) {
		var effectTargets = null;
		if (action.effects[i].targetHint == 'selected') {
			effectTargets = targetsHit;
		} else if (action.effects[i].targetHint == 'user') {
			effectTargets = [ actingUnit ];
		}
		var effect = Game.effects[action.effects[i].type];
		Console.writeLine("Applying effect '" + action.effects[i].type + "'");
		Console.append("retarget: " + action.effects[i].targetHint);
		effect(actingUnit, effectTargets, action.effects[i]);
	}
	return targetsHit;
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

// .update() method
// Updates the Battle's state for the next frame.
Battle.prototype.update = function() {
	this.tick();
	return this.result == null;
};
