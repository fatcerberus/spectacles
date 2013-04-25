/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("BattleUnitMoveMenu.js");
RequireScript("PartyMember.js");
RequireScript("Stat.js");
RequireScript("StatusEffect.js");

// BattleUnit() constructor
// Creates an object representing an active battler.
// Arguments:
//     battle: The battle in which the unit is participating.
//     basis:  The party member or enemy class the unit represents.
function BattleUnit(battle, basis)
{
	this.invokeStatuses = function(eventName, event) {
		for (var i = 0; i < this.statuses.length; ++i) {
			this.statuses[i].invoke(eventName, event);
		}
	};
	
	this.resetCTBTimer = function(rank) {
		this.ctbTimer = Game.math.timeUntilNextTurn(this, rank);
	};
	
	this.battle = battle;
	this.stats = {};
	if (basis instanceof PartyMember) {
		this.partyMember = basis;
		this.name = this.partyMember.name;
		for (var name in Game.namedStats) {
			this.stats[name] = this.partyMember.stats[name];
		}
		this.maxHPValue = Game.math.partyMemberHP(partyMember);
	} else {
		this.enemyInfo = basis;
		this.name = this.enemyInfo.name;
		for (var name in Game.namedStats) {
			this.stats[name] = new Stat(this.enemyInfo.baseStats[name], battle.battleLevel, false);
		}
		this.maxHPValue = Game.math.enemyHP(this);
	}
	this.hpValue = this.maxHPValue;
	this.statuses = [];
	this.ctbTimer = null;
	this.actionQueue = [];
	this.moveTargets = null;
	this.moveMenu = new BattleUnitMoveMenu(this.battle, this);
	this.addStatus("Zombie");
	this.resetCTBTimer(2);
}

// .health property
// Gets the unit's remaining health as a percentage.
BattleUnit.prototype.health getter = function()
{
	return Math.floor(100 * this.hp / this.maxHP);
};

// .hp property
// Gets the unit's remaining hit points.
BattleUnit.prototype.hp getter = function()
{
	return this.hpValue;
};

// .timeUntilNextTurn property
// Returns the number of ticks until the battler can act.
BattleUnit.prototype.timeUntilNextTurn getter = function()
{
	return this.ctbTimer;
};

// .tick() method
// Advances the battler's CTB timer.
BattleUnit.prototype.tick = function()
{
	--this.ctbTimer;
	if (this.ctbTimer == 0) {
		this.battle.suspend();
		var action = null;
		if (this.actionQueue.length > 0) {
			action = this.actionQueue.shift();
		} else {
			if (this.partyMember != null) {
				var move = this.moveMenu.show();
			} else {
				var move = this.enemyInfo.strategize(this, this.battle.predictTurns(this, null));
			}
			var technique = Game.techniques[move.technique];
			this.moveTargets = move.targets;
			var action = technique.actions[0];
			for (var i = 1; i < technique.actions.length; ++i) {
				this.actionQueue.push(technique.actions[i]);
			}
		}
		this.battle.runAction(this, this.moveTargets, action);
		this.resetCTBTimer(action.rank);
		this.battle.resume();
		return true;
	} else {
		return false;
	}
};

// .addStatus() method
// Inflicts a status on the battler.
// Arguments:
//     status: The status to inflict.
BattleUnit.prototype.addStatus = function(status)
{
	this.statuses.push(new StatusEffect(this, status));
};

// .die() method
// Inflicts instant death on the battler.
// Remarks:
//     This is implemented by inflicting non-piercing damage on the unit equal to its Max HP.
//     As such, defending will reduce this damage. This is intended.
BattleUnit.prototype.die = function()
{
	this.takeDamage(this.maxHP);
};

// .heal() method
// Restores a specified amount of the battler's HP.
// Arguments:
//     amount: The number of hit points to restore.
BattleUnit.prototype.heal = function(amount)
{
	var healEvent = {
		amount: Math.floor(amount),
		cancel: false
	};
	this.invokeStatuses("healed", healEvent);
	if (healEvent.cancel) {
		return;
	}
	if (healEvent.amount >= 0) {
		this.hpValue = Math.min(this.hpValue + healEvent.amount, this.maxHP);
	} else {
		this.takeDamage(healEvent.amount, true);
	}
};

// .liftStatus() method
// Removes a status effect from the battler.
// Arguments:
//     statusType: The status to remove.
BattleUnit.prototype.liftStatus = function(statusType)
{
	for (var i = 0; i < this.statuses.length; ++i) {
		if (this.statuses[i] instanceof StatusType) {
			this.statuses.splice(i, 1);
			--i;
		}
	}
};

// .revive() method
// Revives the battler from KO and restores HP.
// Arguments:
//     health: The percentage of the battler's HP to restore. Must be greater than zero.
//             Defaults to 100.
BattleUnit.prototype.revive = function(health)
{
	if (health === undefined) health = 100;
	
	this.hpValue = Math.min(Math.floor(this.maxHP * health / 100), this.maxHP);
};

// .takeDamage() method
// Inflicts damage on the battler.
// Arguments:
//     amount:       Required. The amount of damage to inflict.
//     ignoreDefend: If set to true, prevents damage reduction when the battler is Defending.
//                   Defaults to false.
BattleUnit.prototype.takeDamage = function(amount, ignoreDefend)
{
	if (ignoreDefend === undefined) { ignoreDefend = false; }
	
	amount = Math.floor(amount);
	if (this.isDefending && !ignoreDefend) {
		amount = Math.ceil(amount / 2);
	}
	var damageEvent = {
		amount: amount,
		cancel: false
	};
	this.invokeStatuses("damaged", damageEvent);
	if (damageEvent.cancel) {
		return;
	}
	if (damageEvent.amount >= 0) {
		this.hpValue = Math.max(this.hpValue - damageEvent.amount, 0);
	} else {
		this.heal(damageEvent.amount);
	}
};

// .timeUntilTurn() method
// Estimates the time remaining until a future turn.
// Arguments:
//     turnIndex:   Required. How many turns ahead to look. Zero means the next turn.
//     assumedRank: The rank to assume when the move to be used isn't known.
//                  Defaults to 2.
//     nextMoves:   The move(s) the battler will perform next, if any.
// Returns:
//     The estimated number of ticks until the specified turn.
BattleUnit.prototype.timeUntilTurn = function(turnIndex, assumedRank, nextMoves)
{
	if (assumedRank === undefined) assumedRank = 2;
	if (nextMoves === undefined) nextMoves = null;
	
	var timeLeft = this.ctbTimer;
	for (var i = 1; i <= turnIndex; ++i) {
		var rank = assumedRank;
		if (nextMoves !== null && i <= nextMoves.length) {
			rank = nextMoves[i].rank;
		}
		timeLeft += Game.math.timeUntilNextTurn(this, rank);
	}
	return timeLeft;
}
