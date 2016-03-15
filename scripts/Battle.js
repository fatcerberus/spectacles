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
	console.log("Initializing battle context for '" + battleID + "'");
	this.battleID = battleID;
	this.mode = null;
	this.parameters = Game.battles[battleID];
	this.partyMPPool = null;
	this.session = session;
	this.suspendCount = 0;
	this.timer = 0;
	this.battleLevel = 'battleLevel' in this.parameters ? this.parameters.battleLevel : session.party.getLevel();
	
	// .itemUsed event
	// Occurs when an item is used by a battle unit.
	// Arguments (for event handler):
	//     userID:     The ID of the unit that used the item.
	//     itemID:     The ID of the item used.
	//     targetIDs:  An array with the IDs of the units, if any, that the item was used on, or
	//                 null in the case of a non-targeted item.
	this.itemUsed = new delegates.Delegate();
	
	// .skillUsed event
	// Occurs when a skill is used by a battle unit.
	// Arguments (for event handler):
	//     userID:     The ID of the unit that used the skill.
	//     itemID:     The ID of the skill used.
	//     targetIDs:  An array with the IDs of the units, if any, that the skill was used on, or
	//                 null in the case of a non-targeted skill.
	this.skillUsed = new delegates.Delegate();
	
	// .stanceChanged event
	// Occurs when a unit changes stance.
	// Arguments (for event handler):
	//     unitID: The ID of the unit changing stance.
	//     stance: The unit's new stance.
	this.stanceChanged = new delegates.Delegate();
	
	// .unitDamaged event
	// Occurs when a unit in the battle is damaged.
	// Arguments (for event handler):
	//     unit:       The unit taking damage.
	//     amount:     The amount of damage taken.
	//     actingUnit: The unit responsible for inflicting the damage. In the case of residual
	//                 (e.g. status-induced) damage, this will be null.
	this.unitDamaged = new delegates.Delegate();
	
	// .unitHealed event
	// Occurs when a unit in the battle recovers HP.
	// Arguments (for event handler):
	//     unit:     The unit recovering HP.
	//     amount:   The number of hit points recovered.
	this.unitHealed = new delegates.Delegate();
	
	// .unitKilled event
	// Occurs when a unit falls in battle.
	// Arguments (for event handler):
	//     unitID: The ID of the downed unit.
	this.unitKilled = new delegates.Delegate();
	
	// .unitReady event
	// Occurs when a unit is about to take its turn.
	// Arguments (for event handler):
	//     unitID: The ID of the unit whose turn is up.
	this.unitReady = new delegates.Delegate();
	
	// .unitTargeted event
	// Occurs when a unit in the battle is successfully targeted by an action.
	// Arguments (for event handler):
	//     unit:       The BattleUnit targeted by the action.
	//     action:     The action being performed.
	//     actingUnit: The BattleUnit performing the action.
	// Remarks:
	//     If, after accuracy is taken into account, the action would result in
	//     a miss, this event will not be raised.
	this.unitTargeted = new delegates.Delegate();
}

// .addCondition() method
// Installs a new field condition.
// Argument:
//     conditionID: The ID of the field condition, as defined in the gamedef.
Battle.prototype.addCondition = function(conditionID)
{
	if (this.hasCondition(conditionID)) {
		return;
	}
	var eventData = { conditionID: conditionID, cancel: false };
	this.raiseEvent('conditionInstalled', eventData);
	if (!eventData.cancel) {
		var effect = new ConditionContext(eventData.conditionID, this);
		this.conditions.push(effect);
		console.log("Installed field condition " + effect.name);
	} else {
		console.log("FC installation (ID: " + conditionID + ") canceled by existing FC");
	}
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

// .areEnemies() method
// Determines whether two battle units are of different alignments.
// Arguments:
//     unit1: The first battle unit to be compared.
//     unit2: The second battle unit to be compared.
// Returns:
//     true if the unit1 and unit2 are of different alignments; false otherwise.
Battle.prototype.areEnemies = function(unit1, unit2)
{
	return link(this.enemiesOf(unit1)).contains(unit2);
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

// .findUnit() method
// Finds the BattleUnit corresponding to a specified enemy or character ID.
// Arguments:
//     The enemy or character ID of the unit to find.
// Returns:
//     The BattleUnit corresponding to the specified ID, or null if no such unit
//     exists.
Battle.prototype.findUnit = function(unitID)
{
	var unit = link(this.enemyUnits, this.playerUnits)
		.first(function(unit) { return unit.id == unitID; });
	return unit !== undefined ? unit : null;
};

// .getLevel() method
// Gets the enemy battle level for the battle.
Battle.prototype.getLevel = function()
{
	return this.battleLevel;
};

// .go() method
// Starts the battle.
// Returns:
//     The ID of the thread managing the battle.
Battle.prototype.go = function()
{
	if (GetGameManifest().disableBattles) {
		console.log("Battles disabled, automatic win");
		console.append("battleID: " + this.battleID);
		this.result = BattleResult.playerWon;
		return null;
	}
	console.log("");
	console.log("Starting battle engine");
	console.append("battleID: " + this.battleID);
	var partyMaxMP = 0;
	for (id in this.session.party.members) {
		var battlerInfo = this.session.party.members[id].getInfo();
		var mpDonated = Math.round(Game.math.mp.capacity(battlerInfo));
		partyMaxMP += mpDonated;
		console.log(Game.characters[battlerInfo.characterID].name + " donated " + mpDonated + " MP to shared pool");
	}
	partyMaxMP = Math.min(Math.max(partyMaxMP, 0), 9999);
	var partyMPPool = new MPPool('partyMP', Math.min(Math.max(partyMaxMP, 0), 9999));
	partyMPPool.gainedMP.add(function(mpPool, availableMP) {
		this.ui.hud.mpGauge.set(availableMP);
	}, this);
	partyMPPool.lostMP.add(function(mpPool, availableMP) {
		this.ui.hud.mpGauge.set(availableMP);
	}, this);
	this.ui = new BattleScreen(partyMaxMP);
	this.battleUnits = [];
	this.playerUnits = [];
	this.enemyUnits = [];
	this.conditions = [];
	for (var i = 0; i < this.parameters.enemies.length; ++i) {
		var enemyID = this.parameters.enemies[i];
		var unit = new BattleUnit(this, enemyID, i == 0 ? 1 : i == 1 ? 0 : i, BattleRow.middle);
		this.battleUnits.push(unit);
		this.enemyUnits.push(unit);
	}
	var i = 0;
	for (var name in this.session.party.members) {
		var unit = new BattleUnit(this, this.session.party.members[name], i == 0 ? 1 : i == 1 ? 0 : i, BattleRow.middle, partyMPPool);
		this.battleUnits.push(unit);
		this.playerUnits.push(unit);
		++i;
	}
	var battleBGMTrack = Game.defaultBattleBGM;
	if ('bgm' in this.parameters) {
		battleBGMTrack = this.parameters.bgm;
	}
	this.ui.hud.turnPreview.set(this.predictTurns());
	music.push("music/" + battleBGMTrack + ".ogg");
	this.result = null;
	this.timer = 0;
	this.mode = 'setup';
	console.register('battle', this, {
		'spawn': this.spawnEnemy
	});
	var battleThread = threads.create(this);
	return battleThread;
};

// .hasCondition() method
// Determines whether a specific field condition is in play.
// Arguments:
//     conditionID: The ID of the field condition to test for, as defined in the gamedef.
Battle.prototype.hasCondition = function(conditionID)
{
	return link(this.conditions).pluck('conditionID').contains(conditionID);
};

// .isActive() method
// Determines whether the battle is still running.
// Returns:
//     true if the battle is still running; false otherwise.
Battle.prototype.isActive = function()
{
	return this.result === null;
};

// .liftCondition() method
// Removes a field condition from play.
// Arguments:
//     conditionID: The ID of the battle condition, as defined in the gamedef.
Battle.prototype.liftCondition = function(conditionID)
{
	for (var i = 0; i < this.conditions.length; ++i) {
		if (conditionID == this.conditions[i].conditionID) {
			console.log("Battle condition " + this.conditions[i].name + " lifted");
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
	for (var turnIndex = 0; turnIndex < 8; ++turnIndex) {
		var bias = 0;
		link(this.enemyUnits, this.playerUnits)
			.reject(function(unit) { return unit === actingUnit && turnIndex == 0; })
			.each(function(unit)
		{
			++bias;
			var timeUntilUp = unit.timeUntilTurn(turnIndex, Game.defaultMoveRank,
				actingUnit === unit ? nextActions : null);
			forecast.push({
				bias: bias,
				remainingTime: timeUntilUp,
				turnIndex: turnIndex,
				unit: unit
			});
		});
	}
	forecast.sort(function(a, b) {
		var sortOrder = a.remainingTime - b.remainingTime;
		var biasOrder = a.bias - b.bias;
		return sortOrder !== 0 ? sortOrder : biasOrder;
	});
	forecast = forecast.slice(0, 10);
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
	
	var conditions = this.conditions.slice();
	link(conditions).invoke('invoke', eventID, data);
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
		actingUnit.announce(action.announceAs);
	}
	link(action.effects)
		.filterBy('targetHint', 'user')
		.each(function(effect)
	{
		console.log("Applying effect '" + effect.type + "'");
		console.append("retarg: " + effect.targetHint);
		var effectHandler = Game.moveEffects[effect.type];
		effectHandler(actingUnit, [ actingUnit ], effect);
	});
	link(targetUnits).invoke('takeHit', actingUnit, action);
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
		console.log("Odds of hitting " + targetUnits[i].name + " are ~" + Math.round(odds * 100) + "%");
		if (RNG.chance(odds)) {
			console.append("hit");
			this.unitTargeted.invoke(targetUnits[i], action, actingUnit);
			targetsHit.push(targetUnits[i]);
		} else {
			console.append("miss");
			targetUnits[i].evade(actingUnit, action);
		}
	}
	if (targetsHit.length == 0) {
		return [];
	}
	
	// apply move effects to target(s)
	link(targetsHit).invoke('beginTargeting', actingUnit);
	var animContext = {
		effects: link(action.effects)
			.filterBy('targetHint', [ 'selected', 'random' ])
			.where(function(effect) { return effect.type != null; })
			.toArray(),
		pc: 0,
		nextEffect: function() {
			if (this.pc < this.effects.length) {
				var effect = this.effects[this.pc++];
				var targets = effect.targetHint == 'random'
					? [ RNG.sample(targetsHit) ]
					: targetsHit;
				console.log("Applying effect '" + effect.type + "'");
				console.append("retarg: " + effect.targetHint);
				Game.moveEffects[effect.type](actingUnit, targets, effect);
			}
			return this.pc < this.effects.length;
		}
	};
	if (action.animation in Game.animations) {
		Game.animations[action.animation]
			.call(animContext, actingUnit, targetsHit, false);
	}
	while (animContext.nextEffect());
	link(targetsHit).invoke('endTargeting');
	return targetsHit;
};

// .spawnEnemy() method
// Spawns an additional enemy unit and adds it to the battle.
// Arguments:
//     enemyClass: The class name of the enemy to be spawned.
Battle.prototype.spawnEnemy = function(enemyClass)
{
	console.log("Spawning new enemy '" + enemyClass + "'");
	var newUnit = new BattleUnit(this, enemyClass);
	this.battleUnits.push(newUnit);
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
	console.log("");
	console.log("Beginning CTB cycle #" + (this.timer + 1));
	++this.timer;
	var isUnitAlive = function(unit) { return unit.isAlive(); };
	var unitLists = [ this.enemyUnits, this.playerUnits ];
	link(unitLists).unroll().invoke('beginCycle');
	link(this.conditions).invoke('beginCycle');
	this.raiseEvent('beginCycle');
	var actionTaken = false;
	while (!actionTaken) {
		link(unitLists).unroll().each(function(unit) {
			actionTaken = unit.tick() || actionTaken;
		});
		if (link(this.playerUnits).none(isUnitAlive)) {
			music.adjust(0.0, 2.0);
			this.ui.fadeOut(2.0);
			this.result = BattleResult.enemyWon;
			console.log("All active party members have been killed");
			return;
		}
		if (link(this.enemyUnits).none(isUnitAlive)) {
			music.adjust(0.0, 1.0);
			this.ui.fadeOut(1.0);
			this.result = BattleResult.partyWon;
			console.log("All enemies have been killed");
			return;
		}
	}
	link(unitLists).unroll().invoke('endCycle');
};

// .update() method
// Updates the Battle's state for the next frame.
Battle.prototype.update = function() {
	switch (this.mode) {
		case 'setup':
			var heading = ('isFinalBattle' in this.parameters && this.parameters.isFinalBattle) ? "Final Battle: " : "Boss Battle: ";
			this.ui.go('title' in this.parameters ? heading + this.parameters.title : null);
			var walkInThreads = [];
			link(this.enemyUnits, this.playerUnits)
				.each(function(unit)
			{
				var thread = unit.actor.enter();
				walkInThreads.push(thread);
			});
			this.ui.hud.turnPreview.show();
			if (!link(this.session.battlesSeen).contains(this.battleID)) {
				this.session.battlesSeen.push(this.battleID);
				 if ('onFirstStart' in this.parameters) {
					console.log("Calling onFirstStart() for battleID '" + this.battleID + "'");
					this.parameters.onFirstStart.call(this);
				 }
			}
			if ('onStart' in this.parameters) {
				console.log("Calling onStart() for battleID '" + this.battleID + "'");
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
		console.log("Battle engine shutting down");
		link(this.battleUnits).invoke('dispose');
		this.ui.dispose();
		music.pop();
		music.adjust(1.0, 0.0);
		console.unregister('battle');
		return false;
	} else {
		return true;
	}
};
