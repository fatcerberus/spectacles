/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('ItemUsable.js');
RequireScript('SkillUsable.js');
RequireScript('WeaponUsable.js');

// AIContext() constructor
// Creates an object representing a context for an enemy AI.
// Arguments:
//     unit:   The unit whose actions are to be managed by the AI.
//     battle: The battle session the unit is taking part in.
//     aiType: The constructor for the AI which will control the unit. The object it creates must,
//             at the very least, include a method named 'strategize', which is required to queue
//             at least one move (via AIContext.queueSkill or AIContext.queueItem) each time it
//             is called. strategize() will be passed the following argument:
//                 phase: The number of the current attack phase. If no phases are defined, this
//                        will always be 1.
// Remarks:
//     Note: aiType will be called as a constructor (that is, via new) with the following argument:
//               aiContext: The AIContext that is hosting the new AI.
function AIContext(unit, battle, aiType)
{
	// .phaseChanged event
	// Occurs when the AI enters a new attack phase.
	// Arguments (for event handler):
	//     aiContext: The AIContext that triggered the phase change.
	//     newPhase:  The phase the AI context is switching to.
	//     lastPhase: The phase being exited.
	this.phaseChanged = new delegates.Delegate();
	
	console.log("Initializing AI context for " + unit.fullName);
	this.battle = battle;
	this.data = {};
	this.defaultSkillID = null;
	this.moveQueue = [];
	this.phase = 0;
	this.phasePoints = null;
	this.targets = null;
	this.turnsTaken = 0;
	this.unit = unit;
	this.strategy = new aiType(this);
}

// .dispose() method
// Relinquishes resources held by the AI context.
AIContext.prototype.dispose = function()
{
	console.log("Shutting down AI for " + this.unit.fullName);
	if ('dispose' in this.strategy) {
		this.strategy.dispose();
	}
};

// .checkPhase() method
// Checks the state of the controlled unit and updates the current phase as
// necessary.
// Arguments:
//     allowEvents: Optional. If this is true, a phaseChanged event will be raised
//                  if the phase is advanced. (default: true)
// Remarks:
//     Phases are ratcheting; once a threshold is passed and the phase increased, it
//     will not decrease even if the damage that triggered the phase change is healed.
AIContext.prototype.checkPhase = function(allowEvents)
{
	allowEvents = allowEvents !== void null ? allowEvents : true;
	
	var phaseToEnter;
	if (this.phasePoints !== null) {
		var milestone = link(this.phasePoints)
			.where(function(value) { return value >= this.unit.hp; }.bind(this))
			.last()[0];
		phaseToEnter = 2 + link(this.phasePoints).indexOf(milestone);
	} else {
		phaseToEnter = 1;
	}
	var lastPhase = this.phase;
	this.phase = Math.max(phaseToEnter, this.phase);
	if (allowEvents && this.phase > lastPhase) {
		console.log(this.unit.name + " is entering Phase " + this.phase);
		console.append("prev: " + (lastPhase > 0 ? lastPhase : "none"));
		this.phaseChanged.invoke(this, this.phase, lastPhase);
	}
};

// .definePhases() method
// Defines HP thresholds for phase changes. Phases are useful when designing, for
// example, boss AIs.
// Arguments:
//     thresholds: An array specifying the HP thresholds for all phase transitions.
//     sigma:      Optional. The standard deviation for calculated HP thresholds. If this is
//                 zero, no variance will be applied. (default: 0)        
// Remarks:
//     Calling this method after phases have already been established is not recommended as it
//     will replace the existing HP thresholds with the new set and force the phase to be
//     recalculated, overriding the usual ratcheting behavior.
AIContext.prototype.definePhases = function(thresholds, sigma)
{
	sigma = sigma !== void null ? sigma : 0;
	
	console.log("Setting up " + (thresholds.length + 1) + " phases for " + this.unit.name);
	this.phasePoints = link(thresholds)
		.map(function(value) { return Math.round(RNG.normal(value, sigma)); })
		.toArray();
	var phaseIndex = 1;
	link(this.phasePoints).each(function(milestone) {
		++phaseIndex;
		console.log("Phase " + phaseIndex + " will start at <= " + milestone + " HP");
	});
	this.phase = 0;
}

// .getNextMove() method
// Gets the next move to be performed by the controlled unit.
// Returns:
//     An object containing the following properties:
//         usable:  The Usable object representing the skill or item to be used.
//         stance:  The battle stance the unit is switching to.
//         targets: An array of BattleUnits specifying the units targeted by the
//                  move.
// Remarks:
//     If no usable move is queued and the default skill is selected, a random target
//     will be chosen for it.
AIContext.prototype.getNextMove = function()
{
	var moveToUse = null;
	do {
		if (this.moveQueue.length == 0) {
			console.log("Deferring to AI for " + this.unit.name + "'s next move");
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
			this.checkPhase();
			if (this.moveQueue.length == 0) {
				this.strategy.strategize(this.unit.stance, this.phase);
			}
			if (this.moveQueue.length == 0) {
				console.log("No moves queued for " + this.unit.name + ", using default");
				if (this.defaultSkillID !== null) {
					this.queueSkill(this.defaultSkillID);
				} else {
					Abort("AIContext.getNextAction(): No moves were queued and there is no default skill set.");
				}
			}
		}
		var candidateMove;
		var isMoveUsable;
		do {
			candidateMove = this.moveQueue.shift();
			var isMoveLegal = candidateMove.stance != BattleStance.Attack || candidateMove.usable.isUsable(this.unit, this.unit.stance);
			var isMoveUsable = isMoveLegal && candidateMove.predicate();
			if (!isMoveUsable) {
				console.log("Discarding " + this.unit.name + "'s " + candidateMove.usable.name + ", not usable");
			}
		} while (!isMoveUsable && this.moveQueue.length > 0);
		if (isMoveUsable) {
			moveToUse = candidateMove;
		} else if (this.defaultSkillID !== null) {
			this.queueSkill(this.defaultSkillID);
		}
	} while (moveToUse === null);
	++this.turnsTaken;
	return moveToUse;
}

// .hasMovesQueued() method
// Checks whether the controlled unit has any moves pending (queued).
AIContext.prototype.hasMovesQueued = function()
{
	return this.moveQueue.length > 0;
};

// .hasStatus() method
// Determines whether the unit being controlled is afflicted with a specified status.
// Arguments:
//     statusID: The ID of the status to test for, as defined in the gamedef.
AIContext.prototype.hasStatus = function(statusID)
{
	return this.unit.hasStatus(statusID);
};

// .isItemQueued() method
// Checks whether a use of an item is already in the AI's move queue.
// Arguments:
//     itemID: The item ID of the item to check for.
AIContext.prototype.isItemQueued = function(itemID)
{
	return link(this.moveQueue)
		.pluck('usable')
		.some(function(usable) { return usable instanceof ItemUsable && usable.itemID == itemID; });
};

// .isItemUsable() method
// Determines whether the controlled unit is able to use an item.
// Arguments:
//     itemID: The ID of the item to be tested for usability.
AIContext.prototype.isItemUsable = function(itemID)
{
	return link(this.unit.items)
		.filterBy('itemID', itemID)
		.some(function(item) { return item.isUsable(this, this.unit.stance) }.bind(this));
};

// .isSkillQueued() method
// Checks whether a use of a skill is already in the AI's move queue.
// Arguments:
//     skillID: The skill ID of the skill to check for.
AIContext.prototype.isSkillQueued = function(skillID)
{
	return link(this.moveQueue)
		.pluck('usable')
		.some(function(usable) { return usable instanceof SkillUsable && usable.skillID == skillID; });
};

// .isSkillUsable() method
// Determines whether the controlled unit is able to use a skill.
// Arguments:
//     skillID: The ID of the skill to be tested for usability.
AIContext.prototype.isSkillUsable = function(skillID)
{
	var skillToUse = new SkillUsable(skillID, 100);
	return skillToUse.isUsable(this.unit, this.unit.stance);
};

// .itemsLeft() method
// Checks how many of a given item the controlled unit has available for use.
// Arguments:
//     itemID: The ID of the item to check.
AIContext.prototype.itemsLeft = function(itemID)
{
	var itemUsable = link(this.unit.items).filterBy('itemID', itemID).first();
	console.log(this.unit.name + " requested item count for " + itemUsable.name);
	console.append("left: " + itemUsable.usesLeft);
	return itemUsable.usesLeft;
};

// .predictItemTurns() method
// Gets a turn order prediction for the use of a specified item.
// Arguments:
//     itemID: The ID, as defined in the gamedef, of the item whose effects on
//             the turn order are to be tested.
AIContext.prototype.predictItemTurns = function(itemID)
{
	if (!(itemID in Game.items)) {
		Abort("AIContext.predictItemTurns(): The item '" + itemID + "' doesn't exist!");
	}
	var itemRank = 'rank' in Game.items[itemID] ? Game.items[itemID].rank : Game.defaultItemRank;
	var forecast = this.battle.predictTurns(this.unit, [ itemRank ]);
	console.log(this.unit.name + " considering " + Game.items[itemID].name);
	console.append("next: " + forecast[0].unit.name);
	return forecast;
};

// .predictSkillTurns() method
// Gets a turn order prediction for the use of a specified skill.
// Arguments:
//     skillID: The ID, as defined in the gamedef, of the skill whose effects on
//              the turn order are to be tested.
AIContext.prototype.predictSkillTurns = function(skillID)
{
	if (!(skillID in Game.skills)) {
		Abort("AIContext.predictSkillTurns(): The skill '" + skillID + "' doesn't exist!");
	}
	var forecast = this.battle.predictTurns(this.unit, Game.skills[skillID].actions);
	console.log(this.unit.name + " considering " + Game.skills[skillID].name);
	console.append("next: " + forecast[0].unit.name);
	return forecast;
};

// .queueGuard() method
// Adds a shift to Guard Stance to the AI move queue.
AIContext.prototype.queueGuard = function()
{
	this.moveQueue.push({
		usable: null,
		stance: BattleStance.Guard,
		predicate: function() { return true; }
	});
};

// .queueItem() method
// Adds the use of an item to the AI move queue.
// Arguments:
//     itemID: The item ID of the item to use.
//     unitID: Optional. The ID of the unit to use the item on. If not provided or null, a
//             default target (usually the user) will be chosen.
// Remarks:
//     If no target has been set (as by calling .setTarget()), a random target will be
//     selected.
AIContext.prototype.queueItem = function(itemID, unitID)
{
	unitID = unitID !== void null ? unitID : null;
	
	var itemToUse = null;
	for (var i = 0; i < this.unit.items.length; ++i) {
		var item = this.unit.items[i];
		if (item.itemID == itemID && item.isUsable(this.unit, this.unit.stance)) {
			itemToUse = item;
			break;
		}
	}
	if (itemToUse == null) {
		Abort("AIContext.queueItem(): AI unit " + this.unit.name + " tried to use an item (ID: '" + itemID + "') it didn't have");
	}
	var targets = this.targets !== null ? this.targets
		: unitID !== null ? [ this.battle.findUnit(unitID) ]
		: itemToUse.defaultTargets(this.unit);
	this.moveQueue.push({
		usable: itemToUse,
		stance: BattleStance.Attack,
		targets: targets,
		predicate: function() { return true; }
	});
	console.log(this.unit.name + " queued use of item " + itemToUse.name);
};

// .queueSkill() method
// Adds the use of a skill to the AI move queue.
// Arguments:
//     skillID:   The ID of the skill to use, as defined in the gamedef.
//     unitID:    Optional. The ID of the unit to use the skill on. If not provided or null, a
//                default target (usually random) will be chosen.
//     predicate: A function which will be called at the time the move is to be used. The function
//                should return true to use the skill, or false to cancel it.
AIContext.prototype.queueSkill = function(skillID, unitID, predicate)
{
	unitID = unitID !== void null ? unitID : null;
	predicate = predicate !== void null ? predicate : function() { return true; };
	
	var skillToUse = new SkillUsable(skillID, 100);
	/*for (var i = 0; i < this.unit.skills.length; ++i) {
		var skill = this.unit.skills[i];
		if (skill.skillID == skillID) {
			skillToUse = skill;
			break;
		}
	}
	if (skillToUse == null) {
		Abort("AIContext.queueItem(): AI unit " + this.unit.name + " tried to use an unknown or unusable skill");
	}*/
	var targetUnit = unitID !== null ? this.battle.findUnit(unitID) : null;
	var targets = this.targets !== null ? this.targets
		: targetUnit !== null ? [ targetUnit ]
		: skillToUse.defaultTargets(this.unit);
	this.moveQueue.push({
		usable: skillToUse,
		stance: BattleStance.Attack,
		targets: targets,
		predicate: predicate
	});
	console.log(this.unit.name + " queued use of skill " + skillToUse.name);
};

// .queueWeapon() method
// Adds a weapon-change action to the AI move queue.
// Arguments:
//     weaponID: The weapon ID of the weapon to be equipped.
AIContext.prototype.queueWeapon = function(weaponID)
{
	var weaponUsable = new WeaponUsable(weaponID);
	this.moveQueue.push({
		usable: weaponUsable,
		stance: BattleStance.Attack,
		targets: weaponUsable.defaultTargets(this.unit),
		predicate: function() { return true; }
	});
	var weaponDef = Game.weapons[weaponID];
	console.log(this.unit.name + " queued weapon change to " + weaponDef.name);
};

// .setDefaultSkill() method
// Sets the skill to be used when no specific moves are queued.
// Arguments:
//     skillID: The ID of the skill to use, as defined in the gamedef.
AIContext.prototype.setDefaultSkill = function(skillID)
{
	this.defaultSkillID = skillID;
	console.log(this.unit.name + "'s default skill set to " + Game.skills[skillID].name);
};

// .setTarget() method
// Sets the battler to be targeted by the AI's actions.
// Arguments:
//     targetID: The enemy or character ID of the unit to target.
AIContext.prototype.setTarget = function(targetID)
{
	var unit = this.battle.findUnit(targetID);
	this.targets = unit !== null ? [ unit ] : null;
};
