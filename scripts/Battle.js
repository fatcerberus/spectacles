/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
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
	this.timer = 0;
	Console.writeLine("Battle session prepared");
	Console.append("battle def: " + this.battleID);
}

// .getLevel() method
// Gets the enemy battle level for the battle.
Battle.prototype.getLevel = function()
{
	return this.parameters.battleLevel;
};

// .alliesOf() method
// Compiles a list of all the battlers allied with this battler, including itself.
// Arguments:
//     unit: The battler for which to find allies.
Battle.prototype.alliesOf = function(unit)
{
	if (unit.isPartyMember()) {
		return this.playerUnits;
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
	var partyMaxMP = 0;
	for (id in this.session.party.members) {
		var battlerInfo = this.session.party.members[id].getInfo();
		partyMaxMP += Math.floor(Game.math.mp.capacity(battlerInfo));
	}
	partyMaxMP = Math.min(Math.max(partyMaxMP, 0), 9999);
	var partyMPPool = new MPPool(Math.min(Math.max(partyMaxMP, 0), 9999));
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
	var battleBGMTrack = Game.defaultBattleBGM;
	if ('bgm' in this.parameters) {
		battleBGMTrack = this.parameters.bgm;
	}
	this.ui.hud.turnPreview.set(this.predictTurns());
	BGM.override(battleBGMTrack);
	this.timer = 0;
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
	this.ui.hud.turnPreview.show();
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
// Takes a forecast of the next seven units to act.
// Arguments:
//     actingUnit:  Optional. The BattleUnit that is about to act, if any.
//     nextActions: Optional. The list of action(s) to be performed by the acting unit, if any. Ignored if
//                  actingUnit is null.
// Returns:
//     An array of objects representing the predicted turns, sorted by turn order. Each object in the array has
//     the following properties:
//         unit:          The unit whose turn has been predicted.
//         turnIndex:     The number of turns ahead the prediction is for. This can be zero, in which case it
//                        represents the unit's next turn.
//         remainingTime: The predicted number of battle engine ticks before the turn comes up.
//
Battle.prototype.predictTurns = function(actingUnit, nextActions)
{
	actingUnit = actingUnit !== void null ? actingUnit : null;
	nextActions = nextActions !== void null ? nextActions : null;
	
	var forecast = [];
	var unitLists = [ this.enemyUnits, this.playerUnits ];
	for (var turnIndex = 0; turnIndex < 7; ++turnIndex) {
		for (var iList = 0; iList < unitLists.length; ++iList) {
			for (var i = 0; i < unitLists[iList].length; ++i) {
				var unit = unitLists[iList][i];
				if (unit === actingUnit && turnIndex == 0) {
					continue;
				}
				var timeUntilUp = unit.timeUntilTurn(turnIndex, Game.defaultMoveRank, actingUnit === unit ? nextActions : null);
				forecast.push({
					unit: unit,
					turnIndex: turnIndex,
					remainingTime: timeUntilUp
				});
			}
		}
	}
	forecast.sort(function(a, b) { return a.remainingTime - b.remainingTime; });
	forecast = forecast.slice(0, 7);
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
// Executes a battle action.
// Arguments:
//     action:      The battle action to be executed.
//     actingUnit:  The battler performing the action.
//     targetUnits: An array specifying the battlers, if any, targetted by the action.
// Returns:
//     An array of references to all units affected by the action.
Battle.prototype.runAction = function(action, actingUnit, targetUnits)
{
	if ('announceAs' in action && action.announceAs != null) {
		var bannerColor = actingUnit.isPartyMember() ? CreateColor(64, 128, 192, 255) : CreateColor(192, 64, 64, 255);
		this.ui.announceAction(action.announceAs, actingUnit.isPartyMember() ? 'party' : 'enemy', bannerColor);
	}
	if (action.effects === null) {
		return [];
	}
	var targetsHit = [];
	if ('accuracyType' in action) {
		var accuracyRate = 'accuracyRate' in action ? action.accuracyRate : 1.0;
		for (var i = 0; i < targetUnits.length; ++i) {
			var odds = Math.min(Math.max(Game.math.accuracy[action.accuracyType](actingUnit.battlerInfo, targetUnits[i].battlerInfo) * accuracyRate, 0.0), 1.0);
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
		var effectHandler = Game.effects[action.effects[i].type];
		Console.writeLine("Applying effect '" + action.effects[i].type + "'");
		Console.append("retarget: " + action.effects[i].targetHint);
		effectHandler(actingUnit, effectTargets, action.effects[i]);
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

// .tick() method
// Executes a single CTB cycle.
Battle.prototype.tick = function()
{
	if (this.suspendCount > 0 || this.result != null) {
		return;
	}
	Console.writeLine("");
	Console.writeLine("Beginning new CTB cycle");
	++this.timer;
	var unitLists = [ this.enemyUnits, this.playerUnits ];
	var actionTaken = false;
	for (var iList = 0; iList < unitLists.length; ++iList) {
		for (var i = 0; i < unitLists[iList].length; ++i) {
			var unit = unitLists[iList][i];
			unit.beginCycle();
		}
	}
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

// .update() method
// Updates the Battle's state for the next frame.
Battle.prototype.update = function() {
	this.tick();
	return this.result == null;
};
