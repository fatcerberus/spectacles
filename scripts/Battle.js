/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript('BattleScreen.js');
RequireScript('BattleUnit.js');
RequireScript('ConditionContext.js');
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
	this.mode = null;
	this.parameters = Game.battles[battleID];
	this.partyMPPool = null;
	this.playerUnits = [];
	this.session = session;
	this.suspendCount = 0;
	this.timer = 0;
	Console.writeLine("Battle session prepared");
	Console.append("battleID: " + this.battleID);
}

// .addCondition() method
// Installs a new battle condition.
// Argument:
//     conditionID: The ID of the battle condition, as defined in the gamedef.
Battle.prototype.addCondition = function(conditionID)
{
	if (this.hasCondition(conditionID)) {
		return;
	}
	var effect = new ConditionContext(conditionID, this);
	this.conditions.push(effect);
	Console.writeLine("Installed battle condition " + effect.name);
};

// .alliesOf() method
// Compiles a list of all active units allied with a specified unit (including itself).
// Arguments:
//     unit: The unit for which to find allies.
// Returns:
//     An array containing references to all units allied with the one specified.
Battle.prototype.alliesOf = function(unit)
{
	if (unit.isPartyMember()) {
		return this.playerUnits;
	} else {
		return this.enemyUnits;
	}
};

// .enemiesOf() method
// Compiles a list of all active units opposing a specified unit.
// Arguments:
//     unit: The unit for which to find enemies.
// Returns:
//     An array containing references to all units opposing the one specified.
Battle.prototype.enemiesOf = function(unit)
{
	if (unit.isPartyMember()) {
		return this.enemyUnits;
	} else {
		return this.playerUnits;
	}
};

// .getLevel() method
// Gets the enemy battle level for the battle.
Battle.prototype.getLevel = function()
{
	return this.parameters.battleLevel;
};

// .go() method
// Starts the battle.
// Returns:
//     The thread handle of the thread managing the battle.
Battle.prototype.go = function()
{
	if (DBG_DISABLE_BATTLES) {
		this.result = BattleResult.playerWon;
		return null;
	}
	Console.writeLine("Starting battle engine");
	Console.append("battleID: " + this.battleID);
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
	this.result = null;
	this.timer = 0;
	this.mode = 'setup';
	var battleThread = Threads.createEntityThread(this);
	return battleThread;
};

// .hasCondition() method
// Determines whether a specific battle condition is in play.
// Arguments:
//     conditionID: The ID of the battle condition to test for, as defined in the gamedef.
Battle.prototype.hasCondition = function(conditionID)
{
	for (var i = 0; i < this.conditions.length; ++i) {
		if (conditionID == this.conditions[i].conditionID) {
			return true;
		}
	}
	return false;
};

// .areEnemies() method
// Determines whether two battle units are of different alignments.
// Arguments:
//     unit1: The first battle unit to be compared.
//     unit2: The second battle unit to be compared.
// Returns:
//     true if the unit1 and unit2 are of different alignments; false otherwise.
Battle.prototype.areEnemies = function(unit1, unit2)
{
	var enemyList = this.enemiesOf(unit1);
	for (var i = 0; i < enemyList.length; ++i) {
		if (unit2 === enemyList[i]) {
			return true;
		}
	}
	return false;
}

// .isActive() method
// Determines whether the battle is still running.
// Returns:
//     true if the battle is still running; false otherwise.
Battle.prototype.isActive = function()
{
	return this.result === null;
};

// .liftCondition() method
// Removes a battle condition from play.
// Arguments:
//     conditionID: The ID of the battle condition, as defined in the gamedef.
Battle.prototype.liftCondition = function()
{
	for (var i = 0; i < this.condition.length; ++i) {
		if (conditionID == this.conditions[i].conditionID) {
			Console.writeLine("Battle condition " + this.conditions[i].name + " lifted");
			this.conditions.splice(i, 1);
			--i; continue;
		}
	}
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
	for (var turnIndex = 0; turnIndex < 10; ++turnIndex) {
		var bias = 0;
		for (var iList = 0; iList < unitLists.length; ++iList) {
			for (var i = 0; i < unitLists[iList].length; ++i) {
				++bias;
				var unit = unitLists[iList][i];
				if (unit === actingUnit && turnIndex == 0) {
					continue;
				}
				var timeUntilUp = unit.timeUntilTurn(turnIndex, Game.defaultMoveRank, actingUnit === unit ? nextActions : null);
				forecast.push({
					bias: bias,
					remainingTime: timeUntilUp,
					turnIndex: turnIndex,
					unit: unit
				});
			}
		}
	}
	forecast.sort(function(a, b) {
		var sortOrder = a.remainingTime - b.remainingTime;
		var biasOrder = a.bias - b.bias;
		return sortOrder !== 0 ? sortOrder : biasOrder;
	});
	forecast = forecast.slice(0, 7);
	return forecast;
};

// .raiseEvent() method
// Triggers a battle event, passing it on to all active battle conditions for processing.
// Arguments:
//     eventID: The event ID. Only battle conditions with a corresponding event handler will receive it.
//     data:    An object containing data for the event.
// Remarks:
//     Event handlers can change the objects referenced in the data object, for example to change the effects of
//     an action performed by a battler. If you pass in any objects from the gamedef, they should be cloned first to prevent
//     the event from modifying the original definition.
Battle.prototype.raiseEvent = function(eventID, data)
{
	data = data !== void null ? data : null;
	
	for (var i = 0; i < this.conditions.length; ++i) {
		this.conditions[i].invoke(eventID, data);
	}
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
//     useAiming:   Optional. If set to true, one or more 'aiming' events will be raised on behalf of the
//                  acting unit to enable its statuses to modify the accuracy rate per target. If set to false,
//                  only the action's accuracy rate will be taken into account. (default: true)
// Returns:
//     An array of references to all units affected by the action.
Battle.prototype.runAction = function(action, actingUnit, targetUnits, useAiming)
{
	useAiming = useAiming !== void null ? useAiming : true;
	
	var eventData = { action: action, targets: targetUnits };
	this.raiseEvent('actionTaken', eventData);
	targetUnits = eventData.targets;
	if ('announceAs' in action && action.announceAs != null) {
		var bannerColor = actingUnit.isPartyMember() ? CreateColor(64, 128, 192, 255) : CreateColor(192, 64, 64, 255);
		this.ui.announceAction(action.announceAs, actingUnit.isPartyMember() ? 'party' : 'enemy', bannerColor);
	}
	for (var i = 0; i < targetUnits.length; ++i) {
		var eventData = {
			actingUnitInfo: actingUnit.battlerInfo,
			action: action
		};
		targetUnits[i].raiseEvent('attacked', eventData);
	}
	if (action.effects === null) {
		return [];
	}
	var targetsHit = [];
	var accuracyRate = 'accuracyRate' in action ? action.accuracyRate : 1.0;
	for (var i = 0; i < targetUnits.length; ++i) {
		var baseOdds = 'accuracyType' in action ? Game.math.accuracy[action.accuracyType](actingUnit.battlerInfo, targetUnits[i].battlerInfo) : 1.0;
		var aimRate = 1.0;
		if (useAiming) {
			var eventData = {
				action: clone(action),
				aimRate: 1.0,
				targetInfo: clone(targetUnits[i].battlerInfo)
			};
			actingUnit.raiseEvent('aiming', eventData);
			aimRate = eventData.aimRate;
		}
		var odds = Math.min(Math.max(baseOdds * accuracyRate * aimRate, 0.0), 1.0);
		Console.writeLine("Odds of hitting " + targetUnits[i].name + " are ~1:" + (Math.round(1 / odds) - 1));
		if (Math.random() < odds) {
			Console.append("hit");
			targetsHit.push(targetUnits[i]);
		} else {
			Console.append("miss");
			targetUnits[i].evade(actingUnit);
		}
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
	Link(unitLists).expand().invoke('beginCycle');
	Link(this.conditions).invoke('beginCycle');
	var actionTaken = false;
	while (!actionTaken) {
		Link(unitLists).expand().each(function(unit) {
			actionTaken = unit.tick() || actionTaken;
		});
		var isUnitAlive = function(it) { return it.isAlive(); };
		this.playerUnits = Link(this.playerUnits).where(isUnitAlive).toArray();
		this.enemyUnits = Link(this.enemyUnits).where(isUnitAlive).toArray();
		if (this.playerUnits.length == 0) {
			BGM.adjustVolume(0.0, 2.0);
			this.ui.fadeOut(2.0);
			this.result = BattleResult.enemyWon;
			Console.writeLine("All active party members have been killed");
			return;
		}
		if (this.enemyUnits.length == 0) {
			BGM.adjustVolume(0.0, 1.0);
			this.ui.fadeOut(1.0);
			this.result = BattleResult.partyWon;
			Console.writeLine("All enemies have been killed");
			return;
		}
	}
};

// .update() method
// Updates the Battle's state for the next frame.
Battle.prototype.update = function() {
	switch (this.mode) {
		case 'setup':
			this.addCondition('generalDisarray');
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
			Threads.synchronize(walkInThreads);
			this.ui.hud.turnPreview.show();
			if ('onStart' in this.parameters) {
				Console.writeLine("Calling onStart handler for battleID '" + this.battleID + "'")
				this.parameters.onStart.call(this);
			}
			this.ui.showTitle();
			this.mode = 'battle';
			break;
		case 'battle':
			this.tick();
			break;
	}
	if (this.result !== null) {
		Console.writeLine("Battle engine shutting down");
		this.ui.dispose();
		BGM.reset();
		return false;
	} else {
		return true;
	}
};
