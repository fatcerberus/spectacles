/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('AIContext.js');
RequireScript('ItemUsable.js');
RequireScript('MoveMenu.js');
RequireScript('MPPool.js');
RequireScript('SkillUsable.js');
RequireScript('Stat.js');
RequireScript('StatusContext.js');

// BattleRow enumeration
// Specifies a battler's relative distance from its opponents.
var BattleRow =
{
	front: -1,
	middle: 0,
	rear: 1
};

// BattleStance enumeration
// Specifies a battler's current battling stance.
var BattleStance =
{
	attack: 0,  // normal attacking stance
	defend: 1,  // defending - reduces damage and covers allies
	counter: 2  // counterattacks when damaged
};

// BattleUnit() constructor
// Creates an object representing an active battler.
// Arguments:
//     battle:      The battle in which the unit is participating.
//     basis:       The party member or enemy class to use as a basis for the unit.
//     position:    The position of the unit in the party order.
//     startingRow: The row the unit starts in.
//     mpPool:      Optional. The MP pool the battler should draw from. If not provided, a dedicated
//                  MP pool will be created for the battler.
function BattleUnit(battle, basis, position, startingRow, mpPool)
{
	this.actionQueue = [];
	this.actor = null;
	this.affinities = [];
	this.ai = null;
	this.battle = battle;
	this.battlerInfo = {};
	this.counterDamage = 0;
	this.cv = 0;
	this.hp = 0;
	this.lastAttacker = null;
	this.lazarusFlag = false;
	this.moveMenu = new MoveMenu(this, battle);
	this.moveTargets = null;
	this.mpPool = null;
	this.newSkills = [];
	this.partyMember = null;
	this.row = startingRow;
	this.skills = [];
	this.stance = BattleStance.attack;
	this.stats = {};
	this.statuses = [];
	this.weapon = null;
	
	if (basis instanceof PartyMember) {
		this.partyMember = basis;
		this.id = this.partyMember.characterID;
		this.character = Game.characters[this.partyMember.characterID];
		this.tier = 1;
		this.maxHP = Math.round(Math.max(Game.math.hp(this.character, this.partyMember.getLevel(), this.tier), 1));
		this.hp = this.maxHP;
		this.name = this.partyMember.name;
		this.fullName = this.partyMember.fullName;
		var skills = this.partyMember.getUsableSkills();
		for (var i = 0; i < skills.length; ++i) {
			this.skills.push(skills[i]);
		}
		this.items = this.partyMember.items;
		for (var stat in Game.namedStats) {
			this.stats[stat] = basis.stats[stat];
		}
		this.weapon = Game.weapons[this.partyMember.weaponID];
	} else {
		if (!(basis in Game.enemies)) {
			Abort("BattleUnit(): Enemy template '" + basis + "' doesn't exist!");
		}
		this.enemyInfo = Game.enemies[basis];
		this.affinities = 'damageModifiers' in this.enemyInfo ? this.enemyInfo.damageModifiers : [];
		this.ai = new AIContext(this, battle, this.enemyInfo.strategy);
		this.id = basis;
		this.name = this.enemyInfo.name;
		this.fullName = 'fullName' in this.enemyInfo ? this.enemyInfo.fullName : this.enemyInfo.name;
		for (var stat in Game.namedStats) {
			this.stats[stat] = new Stat(this.enemyInfo.baseStats[stat], battle.getLevel(), false);
		}
		this.items = [];
		if ('items' in this.enemyInfo) {
			for (var i = 0; i < this.enemyInfo.items.length; ++i) {
				this.items.push(new ItemUsable(this.enemyInfo.items[i]));
			}
		}
		this.tier = this.enemyInfo.tier;
		this.maxHP = Math.round(Math.max(Game.math.hp(this.enemyInfo, battle.getLevel(), this.tier), 1));
		this.hp = this.maxHP;
		this.weapon = Game.weapons[this.enemyInfo.weapon];
		if ('hasLifeBar' in this.enemyInfo && this.enemyInfo.hasLifeBar) {
			this.battle.ui.hud.createEnemyHPGauge(this.name, this.maxHP);
		}
	}
	this.refreshInfo();
	this.mpPool = mpPool !== void null ? mpPool
		: new MPPool(Math.round(Math.max(Game.math.mp.capacity(this.battlerInfo), 0)));
	this.actor = battle.ui.createActor(this.name, position, this.row, this.isPartyMember() ? 'party' : 'enemy');
	if (this.isPartyMember()) {
		this.battle.ui.hud.setPartyMember(position, this.name, this.hp, this.maxHP);
	}
	if (!this.isPartyMember()) {
		this.actor.enter(true);
	}
	this.resetCounter(Game.defaultMoveRank);
	var unitType = this.ai === null ? "player" : "AI";
	Console.writeLine("Created " + unitType + " unit '" + this.name + "'");
	Console.append("hp: " + this.hp + "/" + this.maxHP);
}

// .addStatus() method
// Afflicts the unit with a status effect.
// Arguments:
//     statusID: The ID of the status to inflict.
BattleUnit.prototype.addStatus = function(statusID)
{
	if (this.hasStatus(statusID)) {
		return;
	}
	for (var i = 0; i < this.statuses.length; ++i) {
		if (this.statuses[i].overrules(statusID)) {
			return;
		}
	}
	var eventData = { statusID: statusID };
	this.raiseEvent('afflicted', eventData);
	if (eventData.statusID === null) {
		return;
	}
	var effect = new StatusContext(eventData.statusID, this);
	this.statuses.push(effect);
	Console.writeLine(this.name + " took on status " + effect.name);
};

// .announce() method
// Announces in-battle events.  For AI-controlled units, any announcement will
// also passed on to the AI unless the unit is afflicted with a status that
// suppresses it.
// Arguments:
//     eventID:   The ID of the event to announce, e.g. 'unitDamaged'.
//     eventData: An object with data required to process the event. For instance, for a unitDamaged
//                event, eventData should include the ID of the damaged unit (.unitID) and the amount
//                of damage sustained (.amount).
// Remarks:
//     Unlike with statuses, the eventData for announcements should always be treated as read-only.
//     In most cases, to prevent AI units from cheating, any changes to its members will be ignored.
BattleUnit.prototype.announce = function(eventID, eventData)
{
	
};


// .beginCycle() method
// Prepares the unit for a new CTB cycle.
BattleUnit.prototype.beginCycle = function()
{
	if (!this.isAlive()) {
		return;
	}
	this.refreshInfo();
	for (var i = 0; i < this.statuses.length; ++i) {
		this.statuses[i].beginCycle();
	}
	var eventData = { battlerInfo: this.battlerInfo };
	this.raiseEvent('beginCycle', eventData);
	var baseStatSum = 0;
	var statSum = 0;
	var numStats = 0;
	for (var stat in Game.namedStats) {
		++numStats;
		this.battlerInfo.stats[stat] = Math.round(this.battlerInfo.stats[stat]);
		statSum += this.battlerInfo.stats[stat];
		this.battlerInfo.baseStats[stat] = Math.round(this.battlerInfo.baseStats[stat]);
		baseStatSum += this.battlerInfo.baseStats[stat];
	}
	this.battlerInfo.statAverage = Math.round(statSum / numStats);
	this.battlerInfo.baseStatAverage = Math.round(baseStatSum / numStats);
	this.mpPool.restore(this.battlerInfo.statAverage / 10);
};

// .beginTargeting() method
// Signals the unit that it is being targeted by a battle action.
// Arguments:
//     actingUnit: The unit performing the action.
BattleUnit.prototype.beginTargeting = function(actingUnit)
{
	this.lastAttacker = actingUnit;
}

// .clearQueue() method
// Clears the unit's action queue without executing any queued actions.
BattleUnit.prototype.clearQueue = function()
{
	if (this.actionQueue.length > 0) {
		this.actionQueue = [];
		Console.writeLine("Cleared " + this.name + "'s action queue");
	}
};

// .die() method
// Inflicts unconditional instant death on the battler.
BattleUnit.prototype.die = function()
{
	Console.writeLine(this.name + " afflicted with death");
	this.lazarusFlag = false;
	this.hp = 0;
	this.battle.ui.hud.setHP(this.name, this.hp);
	this.actor.animate('die');
};

// .endCycle() method
// Performs necessary processing for the unit at the end of a CTB cycle.
BattleUnit.prototype.endCycle = function()
{
	if (!this.isAlive()) {
		return;
	}
	if (this.stance == BattleStance.counter && this.isCounterReady) {
		Console.writeLine(this.name + " is countering with " + this.counterMove.usable.name);
		var multiplier = 1.0 + Game.math.counterBonus(this.counterDamage, this.battlerInfo);
		this.stance = BattleStance.attack;
		this.queueMove(this.counterMove);
		var action = this.getNextAction();
		while (action != null) {
			action.accuracyRate = 2.0;
			var newPower;
			var oldPower;
			Link(action.effects)
				.filterBy('type', 'damage')
				.each(function(effect)
			{
				oldPower = effect.power;
				effect.power = Math.round(effect.power * multiplier);
				newPower = effect.power;
			});
			Console.writeLine("Attack boosted by C.S. to " + newPower + " POW");
			Console.append("reg: " + oldPower);
			this.performAction(action, this.counterMove);
			action = this.getNextAction();
		}
		this.counterDamage = 0;
	}
};

// .endTargeting() method
// Signals the unit that a battle action targeting it has finished executing. Should be paired
// with .beginTargeting().
BattleUnit.prototype.endTargeting = function()
{
	this.lastAttacker = null;
};

// .evade() method
// Applies evasion bonuses when an attack misses.
// Arguments:
//     attacker: The BattleUnit whose attack was evaded.
BattleUnit.prototype.evade = function(attacker)
{
	this.actor.showDamage("miss");
	Console.writeLine(this.name + " evaded " + attacker.name + "'s attack");
};

// .getHealth() method
// Calculates the unit's remaining health as a percentage.
BattleUnit.prototype.getHealth = function()
{
	return Math.ceil(100 * this.hp / this.maxHP);
};

// .getLevel() method
// Calculates the unit's overall level.
BattleUnit.prototype.getLevel = function()
{
	if (this.partyMember != null) {
		return this.partyMember.getLevel();
	} else {
		return this.battle.getLevel();
	}
};

// .growSkill() method
// Adds experience to a party unit's existing skill or teaches it a new one.
// Arguments:
//     skillID:    The ID of the skill to grow.
//     experience: The amount of experience to add if the skill is already known.
// Remarks:
//     If the skill specified isn't already known at the time this method is called,
//     the unit will learn it.
BattleUnit.prototype.growSkill = function(skillID, experience)
{
	if (!this.isPartyMember()) {
		return;
	}
	var hasSkill = false;
	for (var i = 0; i < this.skills.length; ++i) {
		if (skillID == this.skills[i].skillID) {
			hasSkill = true;
			this.skills[i].grow(experience);
		}
	}
	if (!hasSkill) {
		var skill = this.partyMember.learnSkill(skillID);
		this.skills.push(skill);
		this.newSkills.push(skill);
		Console.writeLine(this.name + " learned " + skill.name);
	}
};

// .getNextAction() method
// Retrieves the next battle action, if any, in the unit's action queue.
// Returns:
//     The next action in the unit's action queue. If the action queue is empty, returns null.
BattleUnit.prototype.getNextAction = function()
{
	if (this.actionQueue.length > 0) {
		Console.writeLine(this.name + " has " + this.actionQueue.length + " action(s) pending, shifting queue");
		return this.actionQueue.shift();
	} else {
		return null;
	}
}

// .hasStatus() method
// Determines whether the unit is under the effects of a specified status.
// Arguments:
//     statusID: The ID of the status to test for, as defined in the gamedef.
BattleUnit.prototype.hasStatus = function(statusID)
{
	return Link(this.statuses).pluck('statusID').contains(statusID);
};

// .heal() method
// Restores a specified amount of the battler's HP.
// Arguments:
//     amount:     The number of hit points to restore.
//     isPriority: Optional. If true, specifies priority healing. Priority healing is unconditional;
//                 statuses are not allowed to act on it and as such no event will be raised. (default: false)
BattleUnit.prototype.heal = function(amount, isPriority)
{
	isPriority = isPriority !== void null ? isPriority : false;
	
	if (!isPriority) {
		var eventData = { amount: Math.round(amount) };
		this.raiseEvent('healed', eventData);
		amount = Math.round(eventData.amount);
	}
	if (amount > 0) {
		this.hp = Math.min(this.hp + amount, this.maxHP);
		this.actor.showHealing(amount);
		this.battle.ui.hud.setHP(this.name, this.hp);
		this.battle.unitHealed.invoke(this, amount);
		Console.writeLine(this.name + " healed for " + amount + " HP");
	} else if (amount < 0) {
		this.takeDamage(-amount, [], true);
	}
};

// .isAlive() method
// Determines whether the unit is still able to battle.
BattleUnit.prototype.isAlive = function()
{
	return this.hp > 0 || this.lazarusFlag;
};

// .isPartyMember() method
// Determines whether the unit represents a party member.
BattleUnit.prototype.isPartyMember = function()
{
	return this.partyMember != null;
};

// .liftStatus() method
// Removes a status effect from the battle unit.
// Arguments:
//     statusID: The status ID of the status effect to remove.
BattleUnit.prototype.liftStatus = function(statusID)
{
	var eventData = {
		statusID: statusID,
		cancel: false
	};
	this.raiseEvent('cured', eventData);
	if (!eventData.cancel) {
		for (var i = 0; i < this.statuses.length; ++i) {
			if (statusID == this.statuses[i].statusID) {
				Console.writeLine(this.name + " lost status " + this.statuses[i].name);
				this.statuses.splice(i, 1);
				--i; continue;
			}
		}
	}
};

BattleUnit.prototype.liftStatusTags = function(tags)
{
	var me = this;
	var activeStatuses = this.statuses.slice();
	var statusIDs = Link(activeStatuses)
		.where(function(status) { return Link(status.statusDef.tags).some(tags); })
		.pluck('statusID')
		.each(function(statusID)
	{
		me.liftStatus(statusID);
	});
};

// .performAction() method
// Instructs the unit to perform a battle action.
// Arguments:
//     action:  The action to perform.
//     move:    The move associated with the action, as returned by MoveMenu.open()
//              or BattleAI.getNextMove().
BattleUnit.prototype.performAction = function(action, move)
{
	var eventData = { action: action, targetsInfo: [] };
	for (var i = 0; i < move.targets.length; ++i) {
		eventData.targetsInfo.push(move.targets[i].battlerInfo);
	}
	this.raiseEvent('acting', eventData);
	eventData.action.rank = Math.max(Math.round(eventData.action.rank), 0);
	if (this.isAlive()) {
		var unitsHit = this.battle.runAction(action, this, move.targets, move.usable.useAiming);
		if (move.usable.givesExperience && unitsHit.length > 0) {
			var allEnemies = this.battle.enemiesOf(this);
			var experience = {};
			for (var i = 0; i < unitsHit.length; ++i) {
				if (!unitsHit[i].isAlive() && this.battle.areEnemies(this, unitsHit[i])) {
					for (var statID in Game.namedStats) {
						if (!(statID in experience)) {
							experience[statID] = 0;
						}
						experience[statID] += Game.math.experience.stat(statID, unitsHit[i].battlerInfo);
					}
				}
			}
			for (var statID in experience) {
				this.stats[statID].grow(experience[statID]);
				Console.writeLine(this.name + " got " + experience[statID] + " EXP for " + Game.namedStats[statID]);
				Console.append("value: " + this.stats[statID].getValue());
			}
		}
		this.resetCounter(action.rank);
	}
};

// .queueMove() method
// Queues up actions for a move.
// Arguments:
//     move: The move to be queued, as returned by MoveMenu.open() or BattleAI.getNextMove().
BattleUnit.prototype.queueMove = function(move)
{
	this.moveUsed = move;
	var nextActions = this.moveUsed.usable.use(this, this.moveUsed.targets);
	this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this, nextActions));
	for (var i = 0; i < nextActions.length; ++i) {
		this.actionQueue.push(nextActions[i]);
	}
	if (this.actionQueue.length > 0) {
		Console.writeLine("Queued " + this.actionQueue.length + " action(s) for " + this.moveUsed.usable.name);
	}
};

// .raiseEvent() method
// Triggers a status event, allowing the unit's status effects to act on it.
// Arguments:
//     eventID: The event ID. Only statuses with a corresponding event handler will receive it.
//     data:    An object containing data for the event.
// Remarks:
//     Event handlers can change the objects referenced in the data object, for example to change the effects of
//     an action taken by a battler. If you pass in any objects from the gamedef, they should be cloned first to prevent
//     the event from inadvertantly modifying the original definition.
BattleUnit.prototype.raiseEvent = function(eventID, data)
{
	data = data !== void null ? data : null;
	
	var statuses = this.statuses.slice();
	Link(statuses).invoke('invoke', eventID, data);
};

// .refreshInfo() method
// Refreshes the battler info.
BattleUnit.prototype.refreshInfo = function()
{
	this.battlerInfo.name = this.name;
	this.battlerInfo.affinities = clone(this.affinities);
	this.battlerInfo.health = Math.ceil(100 * this.hp / this.maxHP);
	this.battlerInfo.level = this.getLevel();
	this.battlerInfo.weapon = clone(this.weapon);
	this.battlerInfo.tier = this.tier;
	this.battlerInfo.baseStats = {};
	this.battlerInfo.stats = { maxHP: this.maxHP };
	for (var stat in Game.namedStats) {
		this.battlerInfo.baseStats[stat] = this.isPartyMember() ?
			this.character.baseStats[stat] :
			this.enemyInfo.baseStats[stat];
		this.battlerInfo.stats[stat] = this.stats[stat].getValue();
	}
	this.battlerInfo.statuses = [];
	for (var i = 0; i < this.statuses.length; ++i) {
		this.battlerInfo.statuses.push(this.statuses[i].statusID);
	}
};

// .resetCounter() method
// Resets the unit's counter value (CV) after an attack. The CV determines the number of
// ticks that must elapse before the unit is able to act.
// Arguments:
//     rank: The rank of the action taken. The higher the rank, the longer the unit will have to
//           wait for its next turn.
// Remarks:
//     Rank 0 is treated as a special case; passing 0 or less for rank will always give the unit
//     its next turn immediately.
BattleUnit.prototype.resetCounter = function(rank)
{
	this.cv = rank > 0
		? Math.max(Math.round(Game.math.timeUntilNextTurn(this.battlerInfo, rank)), 1)
		: 1;
	Console.writeLine(this.name + "'s CV reset to " + this.cv);
	Console.append("rank: " + rank);
};

// .restoreMP() method
// Restores a percentage of MP to the unit's assigned MP pool.
// Arguments:
//     percentage: The percentage of MP to restore, from 0 to 100.
BattleUnit.prototype.restoreMP = function(percentage)
{
	percentage = Math.min(Math.max(percentage, 0), 100);
	this.mpPool.restore(this.mpPool.capacity * percentage / 100);
};

// .setCounter() method
// Sets the unit into Counter Stance with a specified skill as the reprisal.
// Arguments:
//     skill: The SkillUsable representing the skill to use as the reprisal.
// Remarks:
//     If the unit is already in Counter Stance and ready to counterattack, this
//     merely changes the reprisal without canceling the counterattack.
BattleUnit.prototype.setCounter = function(skill)
{
	if (this.stance != BattleStance.counter) {
		Console.writeLine(this.name + " is going into Counter Stance");
		this.stance = BattleStance.counter;
		this.counterMove = { usable: skill, targets: null };
		this.isCounterReady = false;
		this.cv = Infinity;
	} else {
		this.counterMove.usable = skill;
	}
	Console.writeLine(this.name + "'s reprisal set to " + this.counterMove.usable.name);
}

// .setDefend() method
// Sets the unit into the defensive stance.
BattleUnit.prototype.setDefend = function()
{
	this.stance = BattleStance.defend;
	this.cv = Infinity;
	Console.writeLine(this.name + " has switched to defensive stance");
}

// .takeDamage() method
// Inflicts damage on the battler.
// Arguments:
//     amount:     The amount of damage to inflict.
//     tags:       Optional. An array of tags to associate with the damage event. The damage output
//                 will change if any of the tags are found in the unit's list of affinities.
//     isPriority: Optional. If true, specifies priority damage. Priority damage is unconditional;
//                 it is not affected by affinities and statuses don't receive the usual 'damaged' event before
//                 it is applied. (default: false)
// Remarks:
//     If, after all processing is complete, the final damage output is negative, the unit will be healed
//     instead. If it is exactly zero, it will be set to 1.
BattleUnit.prototype.takeDamage = function(amount, tags, isPriority)
{
	tags = tags !== void null ? tags : [];
	isPriority = isPriority !== void null ? isPriority : false;
	
	amount = Math.round(amount);
	var multiplier = 1.0;
	for (var i = 0; i < tags.length; ++i) {
		if (tags[i] in this.affinities) {
			multiplier *= this.affinities[tags[i]];
		}
	}
	amount = Math.round(amount * multiplier);
	if (amount > 0 && !isPriority) {
		var eventData = { amount: amount, tags: tags };
		this.raiseEvent('damaged', eventData);
		amount = Math.round(eventData.amount);
	}
	if (amount > 0) {
		if (this.lastAttacker !== null) {
			if (this.stance == BattleStance.counter) {
				this.counterDamage += amount;
				this.counterMove.targets = [ this.lastAttacker ];
				this.isCounterReady = true;
				Console.writeLine(this.name + " set to counter with " + this.counterMove.usable.name);
				Console.append("targ: " + this.counterMove.targets[0].name);
			} else if (this.stance == BattleStance.defend) {
				amount = Math.round(Game.math.defend.damageTaken(amount, tags));
				this.stance = BattleStance.attack;
				Console.writeLine(this.name + "'s defensive stance was broken");
				this.resetCounter(Game.defenseBreakRank);
			}
		}
		this.hp = Math.max(this.hp - amount, 0);
		this.battle.unitDamaged.invoke(this, amount, this.lastAttacker);
		Console.writeLine(this.name + " took " + amount + " HP damage");
		Console.append("left: " + this.hp);
		this.actor.showDamage(amount);
		this.battle.ui.hud.setHP(this.name, this.hp);
		if (this.hp <= 0) {
			Console.writeLine(this.name + " dying due to lack of HP");
			var eventData = { cancel: false };
			this.raiseEvent('dying', eventData);
			this.lazarusFlag = eventData.cancel;
			if (!this.lazarusFlag) {
				this.die();
			} else {
				Console.writeLine(this.name + "'s death suppressed by status effect");
			}
		}
	} else if (amount < 0) {
		this.heal(Math.abs(amount), true);
	}
};

// .takeHit() method
// Performs processing when the unit is hit by a move.
// Arguments:
//     actingUnit: The unit performing the move.
//     action:     The action being performed.
BattleUnit.prototype.takeHit = function(actingUnit, action)
{
	var eventData = {
		actingUnitInfo: actingUnit.battlerInfo,
		action: action
	};
	this.raiseEvent('attacked', eventData);
};

// .tick() method
// Decrements the unit's CTB counter value (CV).
// Returns:
//     true if the unit performed an action during this tick; false otherwise.
// Remarks:
//     The unit will be allowed to act when its CV reaches zero.
BattleUnit.prototype.tick = function()
{
	if (!this.isAlive()) {
		return false;
	}
	if (this.stance != BattleStance.attack) {
		return false;
	}
	--this.cv;
	if (this.cv == 0) {
		this.battle.suspend();
		Console.writeLine(this.name + "'s turn is up");
		this.battle.unitReady.invoke(this.id);
		var eventData = { skipTurn: false };
		this.raiseEvent('beginTurn', eventData);
		if (!this.isAlive()) {
			this.battle.resume();
			return true;
		}
		if (eventData.skipTurn) {
			this.clearQueue();
			Console.writeLine(this.name + "'s turn was skipped");
			this.resetCounter(Game.defaultMoveRank);
			this.battle.resume();
			return true;
		}
		var action = this.getNextAction();
		if (action == null) {
			var chosenMove = null;
			if (this.ai == null) {
				this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this));
				Console.writeLine("Asking player for " + this.name + "'s next move");
				chosenMove = this.moveMenu.open();
			} else {
				chosenMove = this.ai.getNextMove();
			}
			switch (chosenMove.stance) {
				case BattleStance.attack:
					this.queueMove(chosenMove);
					action = this.getNextAction();
					break;
				case BattleStance.counter:
					this.setCounter(chosenMove.usable);
					break;
				case BattleStance.defend:
					this.setDefend();
					break;
			}
		}
		if (this.isAlive()) {
			if (action !== null) {
				this.performAction(action, this.moveUsed);
			}
			this.raiseEvent('endTurn');
		}
		this.battle.resume();
		return true;
	} else {
		return false;
	}
};

// .timeUntilNextTurn() method
// Gets the number of ticks until the battler can act.
BattleUnit.prototype.timeUntilNextTurn = function()
{
	return this.cv;
};

// .timeUntilTurn() method
// Estimates the time remaining until a future turn.
// Arguments:
//     turnIndex:   How many turns ahead to look. Zero means the next turn.
//     assumedRank: Optional. The action rank to assume when the exact move to be used isn't known.
//                  If this is not specified, the value of Game.defaultMoveRank is used.
//     nextActions: Optional. The action(s) the battler is to perform next.
// Returns:
//     The estimated number of ticks until the specified turn.
BattleUnit.prototype.timeUntilTurn = function(turnIndex, assumedRank, nextActions)
{
	assumedRank = assumedRank !== void null ? assumedRank : Game.defaultMoveRank;
	nextActions = nextActions !== void null ? nextActions : null;
	
	nextActions = nextActions !== null
		? this.actionQueue.concat(nextActions)
		: this.actionQueue;
	var timeLeft = this.cv;
	for (var i = 1; i <= turnIndex; ++i) {
		var rank = assumedRank;
		if (i <= nextActions.length) {
			rank = isNaN(nextActions[i - 1]) ? nextActions[i - 1].rank
				: nextActions[i - 1];
		}
		timeLeft += Math.max(Math.round(Game.math.timeUntilNextTurn(this.battlerInfo, rank)), 1);
	}
	return timeLeft;
};
