/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('MoveMenu.js');
RequireScript('Skill.js');
RequireScript('Stat.js');
RequireScript('StatusEffect.js');

// BattleRow enumeration
// Specifies a BattleUnit's relative distance from its opponents.
var BattleRow =
{
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
	this.actionQueue = [];
	this.actor = null;
	this.aiData = { turnsTaken: 0 };
	this.battle = battle;
	this.counter = 0;
	this.hp = 0;
	this.moveMenu = new MoveMenu(battle, this);
	this.moveTargets = null;
	this.newSkills = [];
	this.partyMember = null;
	this.row = startingRow;
	this.skills = [];
	this.stats = {};
	this.statuses = [];
	this.weapon = null;
	
	if (basis instanceof PartyMember) {
		this.partyMember = basis;
		this.character = Game.characters[this.partyMember.characterID];
		var memberInfo = {
			characterID: this.partyMember.characterID
		};
		memberInfo.stats = {};
		for (var stat in Game.namedStats) {
			memberInfo.stats[stat] = this.partyMember.stats[stat].value;
		}
		this.maxHP = Math.min(Math.max(Game.math.partyMemberHP(memberInfo), 1), 9999);
		this.hp = this.maxHP;
		this.name = this.partyMember.name;
		var skills = this.partyMember.getUsableSkills();
		for (var i = 0; i < skills.length; ++i) {
			this.skills.push(skills[i]);
		}
		for (var name in Game.namedStats) {
			this.stats[name] = basis.stats[name];
		}
		this.weapon = Game.weapons[this.partyMember.weaponID];
	} else {
		this.enemyInfo = basis;
		this.name = this.enemyInfo.name;
		for (var name in Game.namedStats) {
			this.stats[name] = new Stat(this.enemyInfo.baseStats[name], battle.level, false);
		}
		this.maxHP = Math.max(Game.math.enemyHP(this.enemyInfo, battle.level), 1);
		this.hp = this.maxHP;
		this.weapon = Game.weapons[this.enemyInfo.weapon];
		if ('hasLifeBar' in this.enemyInfo && this.enemyInfo.hasLifeBar) {
			this.battle.ui.hud.createEnemyHPGauge(this.name, this.maxHP);
		}
	}
	this.actor = battle.ui.createActor(this.name, position, this.row, this.isPartyMember ? 'party' : 'enemy');
	if (this.isPartyMember) {
		this.battle.ui.hud.setPartyMember(position, this.name, this.hp, this.maxHP);
	}
	if (!this.isPartyMember) {
		this.actor.enter(true);
	}
	this.counter = Game.math.timeUntilNextTurn(this, Game.defaultMoveRank);
	var unitType = this.partyMember != null ? "party" : "AI";
	Console.writeLine("Created " + unitType + " unit '" + this.name + "'");
	Console.append("maxHP: " + this.maxHP);

	this.invokeStatuses = function(eventName, event) {
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
}

// .health property
// Gets the unit's remaining health as a percentage.
BattleUnit.prototype.health getter = function()
{
	return Math.floor(100 * this.hp / this.maxHP);
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
		return this.partyMember.getLevel();
	} else {
		return this.battle.level;
	}
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
	this.actor.showMessage("+", 'afflict');
	Console.writeLine(this.name + " afflicted with status " + statusEffect.name);
};

// .die() method
// Inflicts unconditional instant death on the battler.
BattleUnit.prototype.die = function()
{
	Console.writeLine(this.name + " afflicted with instant death");
	this.hp = 0;
	this.battle.ui.hud.setHP(this.name, this.hp);
};

// .evade() method
// Applies evasion bonuses when an attack misses.
// Arguments:
//     attacker: The BattleUnit whose attack was evaded.
BattleUnit.prototype.evade = function(attacker)
{
	this.actor.showMessage("miss", 'evade');
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
	this.invokeStatuses('healed', healEvent);
	if (healEvent.cancel) {
		return;
	}
	if (healEvent.amount >= 0) {
		this.hp = Math.min(this.hp + healEvent.amount, this.maxHP);
		this.actor.showMessage(healEvent.amount, 'heal');
		this.battle.ui.hud.setHP(this.name, this.hp);
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
// Nullifies a status effects's influence on the battler.
// Arguments:
//     handle: The status class handle of the status to remove.
BattleUnit.prototype.liftStatus = function(handle)
{
	for (var i = 0; i < this.statuses.length; ++i) {
		if (handle == this.statuses[i].statusID) {
			this.actor.showMessage("+", 'dispel');
			Console.writeLine(this.name + " stripped of status " + this.statuses[i].name);
			this.statuses.splice(i, 1);
			--i; continue;
		}
	}
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
	this.invokeStatuses('damaged', damageEvent);
	if (damageEvent.cancel) {
		return;
	}
	if (damageEvent.amount >= 0) {
		this.hp = Math.max(this.hp - damageEvent.amount, 0);
		Console.writeLine(this.name + " took " + damageEvent.amount + " HP damage - remaining: " + this.hp);
		if (this.lifeBar != null) {
			this.lifeBar.setReading(this.hp);
		}
		this.actor.showMessage(damageEvent.amount, 'damage');
		this.battle.ui.hud.setHP(this.name, this.hp);
		if (this.hp <= 0) {
			Console.writeLine(this.name + " died from lack of HP");
			this.actor.animate('die');
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
		this.invokeStatuses('beginTurn');
		var action = null;
		if (this.actionQueue.length > 0) {
			Console.writeLine("Robert still has " + this.actionQueue.length + " action(s) pending");
			action = this.actionQueue.shift();
		} else {
			if (this.isPartyMember) {
				this.skillUsed = this.moveMenu.open();
				var growthRate = 'growthRate' in this.skillUsed.technique ? this.skillUsed.technique.growthRate : 1.0;
				var experience = Game.math.experience.skill(this, this.skillUsed.technique);
				this.skillUsed.experience += experience;
				Console.writeLine(this.name + " got " + experience + " EXP for " + this.skillUsed.name);
				Console.append("level: " + this.skillUsed.level);
				var move = {
					type: 'technique',
					technique: this.skillUsed.technique,
					targets: [
						this.battle.enemiesOf(this)[0]
					]
				}
				
			} else {
				var move = this.enemyInfo.strategize.call(this.aiData, this, this.battle, this.battle.predictTurns(this, null));
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
