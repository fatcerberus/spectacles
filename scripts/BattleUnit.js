/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Console.js");
RequireScript("BattleSprite.js");
RequireScript("BattleUnitMoveMenu.js");
RequireScript("MenuStrip.js"); /*ALPHA*/
RequireScript("PartyMember.js");
RequireScript("Skill.js");
RequireScript("Stat.js");
RequireScript("StatusEffect.js");

// BattleRow enumeration
// Specifies a BattleUnit's relative distance from its opponents.
var BattleRow = {
	front: -1,
	middle: 0,
	rear: 1
};

// BattleUnit() constructor
// Creates an object representing an active battler.
// Arguments:
//     battle:      The battle in which the unit is participating.
//     basis:       The party member or enemy class to use as a basis for the unit.
//     position:    The position of the unit in the party order.
//     startingRow: The row the unit starts in.
function BattleUnit(battle, basis, position, startingRow)
{
	this.invokeAllStatuses = function(eventName, event) {
		if (event === undefined) { event = null; }
		for (var i = 0; i < this.statuses.length; ++i) {
			this.statuses[i].invoke(eventName, event);
		}
	};
	this.resetCounter = function(rank) {
		this.counter = Game.math.timeUntilNextTurn(this, rank);
		Console.writeLine(this.name + "'s CV reset to " + this.counter);
		Console.append("rank: " + rank);
	};
	
	this.battle = battle;
	this.rowValue = startingRow;
	this.partyMember = null;
	this.stats = {};
	this.weapon = null;
	if (basis instanceof PartyMember) {
		this.partyMember = basis;
		this.character = this.partyMember.character;
		this.name = this.partyMember.name;
		for (var name in Game.namedStats) {
			this.stats[name] = this.partyMember.stats[name];
		}
		this.maxHPValue = Game.math.partyMemberHP(this.partyMember);
		this.weapon = this.partyMember.weapon;
		this.skills = [];
		for (var i = 0; i < this.partyMember.skills.length; ++i) {
			this.skills.push(this.partyMember.skills[i]);
		}
	} else {
		this.enemyInfo = basis;
		this.name = this.enemyInfo.name;
		for (var name in Game.namedStats) {
			this.stats[name] = new Stat(this.enemyInfo.baseStats[name], battle.battleLevel, false);
		}
		this.maxHPValue = Game.math.enemyHP(this);
		this.weapon = Game.weapons[this.enemyInfo.weapon];
	}
	this.newSkills = [];
	this.hpValue = this.maxHP;
	this.statuses = [];
	this.counter = 0;
	this.actionQueue = [];
	this.moveTargets = null;
	this.moveMenu = new BattleUnitMoveMenu(this.battle, this);
	this.aiState = {
		turnsTaken: 0,
	};
	this.sprite = new BattleSprite(this, position, this.row, this.isPartyMember);
	if (!this.isPartyMember) {
		this.sprite.enter(true);
	}
	var unitType = this.partyMember != null ? "party" : "AI";
	Console.writeLine("Created " + unitType + " unit '" + this.name + "'");
	Console.append("maxHP: " + this.maxHP);
	this.resetCounter(Game.defaultMoveRank);
}

// .dispose() method
// Frees any resources used by the BattleUnit.
BattleUnit.prototype.dispose = function()
{
	this.sprite.dispose();
};

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

// .level property
// Gets the unit's battle level.
BattleUnit.prototype.level getter = function()
{
	if (this.partyMember != null) {
		return this.partyMember.level;
	} else {
		return this.battle.battleLevel;
	}
};

// .maxHP property
// Gets the maximum amount of HP the unit can have at a time.
BattleUnit.prototype.maxHP getter = function()
{
	return this.maxHPValue;
}

// .row property
// Gets or sets the unit's current row.
BattleUnit.prototype.row getter = function()
{
	return this.rowValue;
}
BattleUnit.prototype.row setter = function(value)
{
	this.rowValue = value;
};

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
	this.sprite.showMessage(statusEffect.name, 'afflict');
	Console.writeLine(this.name + " afflicted with status " + statusEffect.name);
};

// .die() method
// Inflicts unconditional instant death on the battler.
BattleUnit.prototype.die = function()
{
	Console.writeLine(this.name + " afflicted with instant death");
	this.hpValue = 0;
};

// .enter() method
// Causes the unit to enter the battlefield.
BattleUnit.prototype.enter = function()
{
	this.sprite.enter();
};

// .evade() method
// Applies evasion bonuses when an attack misses.
// Arguments:
//     attacker: The BattleUnit whose attack was evaded.
BattleUnit.prototype.evade = function(attacker)
{
	this.sprite.showMessage("miss", 'evade', true);
	Console.writeLine(this.name + " evaded " + attacker.name + "'s attack");
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
	this.invokeAllStatuses('healed', healEvent);
	if (healEvent.cancel) {
		return;
	}
	if (healEvent.amount >= 0) {
		this.hpValue = Math.min(this.hpValue + healEvent.amount, this.maxHP);
		this.sprite.showMessage(healEvent.amount, 'heal', true);
		Console.writeLine(this.name + " healed for " + healEvent.amount + " HP");
	} else {
		this.takeDamage(healEvent.amount, true);
	}
};

// .growSkill() method
// Adds experience to a party unit's existing skill or teaches it a new one.
// Arguments:
//     handle:     The technique handle for the skill to grow. If the unit doesn't already know the technique,
//                 it will be taught.
//     experience: The amount of experience to add to an existing skill.
BattleUnit.prototype.growSkill = function(handle, experience)
{
	var hasSkill = false;
	for (var i = 0; i < this.skills.length; ++i) {
		if (handle == this.skills[i].handle) {
			hasSkill = true;
			this.skills[i].experience += experience;
			Console.writeLine(this.name + "'s skill " + this.skills[i].name + " gained " + experience + " EXP");
		}
	}
	if (!hasSkill) {
		var skill = this.partyMember.learnSkill(handle);
		this.skills.push(skill);
		this.newSkills.push(skill);
		Console.writeLine(this.name + " learned " + skill.name);
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
			this.sprite.showMessage(this.statuses[i].name, 'dispel');
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
	if (health === undefined) { health = 100; }
	
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
	this.invokeAllStatuses('damaged', damageEvent);
	if (damageEvent.cancel) {
		return;
	}
	if (damageEvent.amount >= 0) {
		this.hpValue = Math.max(this.hpValue - damageEvent.amount, 0);
		Console.writeLine(this.name + " took " + damageEvent.amount + " HP damage - remaining: " + this.hpValue);
		this.sprite.showMessage(damageEvent.amount, 'damage', true);
		if (this.hpValue <= 0) {
			Console.writeLine(this.name + " died from lack of HP");
		}
	} else {
		this.heal(damageEvent.amount);
	}
};

// .tick() method
// Decrements the battler's CTB counter.
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
			if (this.isPartyMember) {
				// var move = this.moveMenu.show();
				
				/*ALPHA*/
				var weaponName = this.weapon != null ? this.weapon.name : "unarmed";
				var moveMenu = new MenuStrip(this.name + " " + this.hp + " HP " + weaponName, false);
				for (var i = 0; i < this.skills.length; ++i) {
					moveMenu.addItem(this.skills[i].name, this.skills[i]);
				}
				this.skillUsed = moveMenu.open();
				var growthRate = 'growthRate' in this.skillUsed.technique ? this.skillUsed.technique.growthRate : 1.0;
				var experience = Game.math.experience.skill(this, this.skillUsed.technique);
				this.skillUsed.experience += experience;
				Console.writeLine(this.name + " got " + experience + " EXP for " + this.skillUsed.name);
				Console.append("level: " + this.skillUsed.level);
				var move = {
					type: "technique",
					technique: this.skillUsed.technique,
					targets: [
						this.battle.enemiesOf(this)[0]
					]
				}
				
			} else {
				var move = this.enemyInfo.strategize.call(this.aiState, this, this.battle, this.battle.predictTurns(this, null));
				this.skillUsed = new Skill(move.technique, 100);
				move.technique = this.skillUsed.technique;
			}
			Console.writeLine(this.name + " is using " + move.technique.name);
			if (this.weapon != null && move.technique.weaponType != null) {
				Console.append("weaponLv: " + this.weapon.level);
			}
			this.moveTargets = move.targets;
			var action = move.technique.actions[0];
			for (var i = 1; i < move.technique.actions.length; ++i) {
				this.actionQueue.push(move.technique.actions[i]);
			}
			if (this.actionQueue.length > 0) {
				Console.writeLine("Queued " + this.actionQueue.length + " additional action(s) for " + this.name);
			}
		}
		this.battle.runAction(this, this.moveTargets, this.skillUsed, action);
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
//     turnIndex:   How many turns ahead to look. Zero means the next turn.
//     assumedRank: Optional. The action rank to assume when the exact move to be used isn't known.
//                  If this is not specified, the value of Game.defaultMoveRank is used.
//     nextActions: Optional. The action(s) the battler is to perform next.
// Returns:
//     The estimated number of ticks until the specified turn.
BattleUnit.prototype.timeUntilTurn = function(turnIndex, assumedRank, nextActions)
{
	if (assumedRank === undefined) { assumedRank = Game.defaultMoveRank; }
	if (nextActions === undefined) { nextActions = null; }
	
	var timeLeft = this.counter;
	for (var i = 1; i <= turnIndex; ++i) {
		var rank = assumedRank;
		if (nextActions !== null && i <= nextActions.length) {
			rank = nextActions[i].rank;
		}
		timeLeft += Game.math.timeUntilNextTurn(this, rank);
	}
	return timeLeft;
}
