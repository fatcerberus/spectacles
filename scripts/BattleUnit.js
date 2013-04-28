/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Console.js");
RequireScript("BattleUnitMoveMenu.js");
RequireScript("MenuStrip.js"); /*ALPHA*/
RequireScript("PartyMember.js");
RequireScript("Stat.js");
RequireScript("StatusEffect.js");

// BattleUnit() constructor
// Creates an object representing an active battler.
// Arguments:
//     battle: The battle in which the unit is participating.
//     basis:  The party member or enemy class to use as a basis for the unit.
function BattleUnit(battle, basis)
{
	this.invokeAllStatuses = function(eventName, event) {
		if (event === undefined) { event = null; }
		for (var i = 0; i < this.statuses.length; ++i) {
			this.statuses[i].invoke(eventName, event);
		}
	};
	this.resetCounter = function(rank) {
		this.counter = Game.math.timeUntilNextTurn(this, rank);
		Console.writeLine(this.name + "'s CV reset to " + this.counter + " (rank " + rank + ")");
	};
	
	this.battle = battle;
	this.partyMember = null;
	this.stats = {};
	this.weapon = null;
	if (basis instanceof PartyMember) {
		this.partyMember = basis;
		this.name = this.partyMember.name;
		for (var name in Game.namedStats) {
			this.stats[name] = this.partyMember.stats[name];
		}
		this.maxHPValue = Game.math.partyMemberHP(this.partyMember);
		this.weapon = this.partyMember.weapon;
	} else {
		this.enemyInfo = basis;
		this.name = this.enemyInfo.name;
		for (var name in Game.namedStats) {
			this.stats[name] = new Stat(this.enemyInfo.baseStats[name], battle.battleLevel, false);
		}
		this.maxHPValue = Game.math.enemyHP(this);
		this.weapon = Game.weapons[this.enemyInfo.weapon];
	}
	this.hpValue = this.maxHP;
	this.statuses = [];
	this.counter = 0;
	this.actionQueue = [];
	this.moveTargets = null;
	this.moveMenu = new BattleUnitMoveMenu(this.battle, this);
	this.aiState = {
		turnsTaken: 0,
	};
	var unitType = this.partyMember != null ? "party" : "AI";
	Console.writeLine("Created " + unitType + " unit " + this.name + " - maxHP: " + this.maxHP);
	this.resetCounter(2);
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

// .isAlive property
// Gets a value indicating whether the unit is still alive.
BattleUnit.prototype.isAlive getter = function()
{
	return this.hp > 0;
};

// .isPartyMember property
// Gets a value indicating whether or not the unit represents a party member.
BattleUnit.prototype.isPartyMember getter = function()
{
	return this.partyMember != null;
};

// .maxHP property
// Gets the maximum amount of HP the unit can have at a time.
BattleUnit.prototype.maxHP getter = function()
{
	return this.maxHPValue;
}

// .timeUntilNextTurn property
// Gets the number of ticks until the battler can act.
BattleUnit.prototype.timeUntilNextTurn getter = function()
{
	return this.counter;
};

// .addStatus() method
// Inflicts a status effect on the battler.
// Arguments:
//     handle: The status class handle for the status to inflict.
BattleUnit.prototype.addStatus = function(handle)
{
	var statusEffect = new StatusEffect(this, handle)
	this.statuses.push(statusEffect);
	Console.writeLine(this.name + " afflicted with status " + statusEffect.name);
};

// .devour() method
// Causes another unit to get eaten by this one.
// Arguments:
//     unit: The BattleUnit getting eaten.
BattleUnit.prototype.devour = function(unit)
{
	this.heal(this.maxHP * unit.health / 100, true);
	unit.die();
	Console.writeLine(unit.name + " got eaten by " + this.name);
};

// .die() method
// Inflicts unconditional instant death on the battler.
BattleUnit.prototype.die = function()
{
	this.takeDamage(this.maxHP, true);
};

// .heal() method
// Restores a specified amount of the battler's HP.
// Arguments:
//     amount:     The number of hit points to restore.
//     isPriority: Optional. If true, specifies a priority healing effect. Certain statuses (e.g. Zombie) use
//                 this flag to determine how to act on the effect. Defaults to false.
BattleUnit.prototype.heal = function(amount, isPriority)
{
	if (isPriority === undefined) { isPriority = false; }
	
	var healEvent = {
		amount: Math.floor(amount),
		isPriority: isPriority,
		cancel: false
	};
	this.invokeAllStatuses("healed", healEvent);
	if (healEvent.cancel) {
		return;
	}
	if (healEvent.amount >= 0) {
		this.hpValue = Math.min(this.hpValue + healEvent.amount, this.maxHP);
		Console.writeLine(this.name + " healed for " + healEvent.amount + " HP");
	} else {
		this.takeDamage(healEvent.amount, true);
	}
};

// .liftStatus() method
// Removes a status's influence on the battler.
// Arguments:
//     handle: The status class handle of the status to remove.
BattleUnit.prototype.liftStatus = function(handle)
{
	for (var i = 0; i < this.statuses.length; ++i) {
		if (handle == this.statuses[i].handle) {
			Console.writeLine(this.name + " stripped of status " + this.statuses[i].name);
			this.statuses.splice(i, 1);
			--i; continue;
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
//     ignoreDefend: If set to true, prevents damage reduction when the battler is defending.
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
	this.invokeAllStatuses("damaged", damageEvent);
	if (damageEvent.cancel) {
		return;
	}
	if (damageEvent.amount >= 0) {
		this.hpValue = Math.max(this.hpValue - damageEvent.amount, 0);
		Console.writeLine(this.name + " took " + damageEvent.amount + " HP damage - remaining: " + this.hpValue);
		if (this.hpValue <= 0) {
			Console.writeLine(this.name + " died from lack of HP");
		}
	} else {
		this.heal(damageEvent.amount);
	}
};

// .tick() method
// Advances the battler's CTB timer.
BattleUnit.prototype.tick = function()
{
	if (!this.isAlive) {
		return false;
	}
	--this.counter;
	if (this.counter == 0) {
		this.battle.suspend();
		Console.writeLine("");
		Console.writeLine(this.name + "'s turn is up");
		this.invokeAllStatuses('beginTurn');
		var action = null;
		if (this.actionQueue.length > 0) {
			Console.writeLine("Robert still has " + this.actionQueue.length + " action(s) pending");
			action = this.actionQueue.shift();
		} else {
			if (this.partyMember != null) {
				// var move = this.moveMenu.show();
				/*ALPHA*/
				var weaponName = this.weapon != null ? this.weapon.name : "unarmed";
				var skillList = this.partyMember.skills;
				var moveMenu = new MenuStrip(this.name + " " + this.hp + " HP " + weaponName, false);
				for (var i = 0; i < skillList.length; ++i) {
					moveMenu.addItem(skillList[i].name, skillList[i].technique);
				}
				var technique = moveMenu.open();
				var move = {
					type: "technique",
					technique: technique,
					targets: [
						this.battle.enemiesOf(this)[0]
					]
				}
			} else {
				var move = this.enemyInfo.strategize.call(this.aiState, this, this.battle, this.battle.predictTurns(this, null));
				move.technique = Game.techniques[move.technique];
			}
			var moveOutput = this.name + " is using " + move.technique.name;
			if (this.weapon != null && move.technique.weaponType != null) {
				moveOutput += " - weaponLv: " + this.weapon.level;
			}
			Console.writeLine(moveOutput);
			this.moveTargets = move.targets;
			var action = move.technique.actions[0];
			for (var i = 1; i < move.technique.actions.length; ++i) {
				this.actionQueue.push(move.technique.actions[i]);
			}
			if (this.actionQueue.length > 0) {
				Console.writeLine("Queued " + this.actionQueue.length + " additional action(s) for " + this.name);
			}
		}
		this.battle.runAction(this, this.moveTargets, action);
		this.resetCounter(action.rank);
		this.battle.resume();
		return true;
	} else {
		return false;
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
	
	var timeLeft = this.counter;
	for (var i = 1; i <= turnIndex; ++i) {
		var rank = assumedRank;
		if (nextMoves !== null && i <= nextMoves.length) {
			rank = nextMoves[i].rank;
		}
		timeLeft += Game.math.timeUntilNextTurn(this, rank);
	}
	return timeLeft;
}
