/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('BattleAI.js');
RequireScript('ItemUsable.js');
RequireScript('MoveMenu.js');
RequireScript('MPPool.js');
RequireScript('SkillUsable.js');
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
//     mpPool:      Optional. The MP pool the battler should draw from. If not provided, a designated
//                  MP pool will be created for the unit.
function BattleUnit(battle, basis, position, startingRow, mpPool)
{
	this.invokeStatuses = function(eventID, event) {
		event = event !== void null ? event : null;
		
		for (var i = 0; i < this.statuses.length; ++i) {
			this.statuses[i].invoke(eventID, event);
		}
	};
	this.resetCounter = function(rank) {
		this.counter = Game.math.timeUntilNextTurn(this, rank);
		Console.writeLine(this.name + "'s CV reset to " + this.counter);
		Console.append("rank: " + rank);
	};
	
	this.actionQueue = [];
	this.actor = null;
	this.ai = null;
	this.battle = battle;
	this.counter = 0;
	this.hp = 0;
	this.moveMenu = new MoveMenu(this, battle);
	this.moveTargets = null;
	this.mpPool = null;
	this.newSkills = [];
	this.partyMember = null;
	this.row = startingRow;
	this.skills = [];
	this.stats = {};
	this.statuses = [];
	this.weapon = null;
	
	if (basis instanceof PartyMember) {
		this.partyMember = basis;
		this.id = this.partyMember.characterID;
		this.character = Game.characters[this.partyMember.characterID];
		this.maxHP = Math.floor(Math.max(Game.math.hp.partyMember(this.character, this.partyMember.getLevel()), 1));
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
		this.ai = new BattleAI(this, battle, this.enemyInfo.strategize);
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
		this.maxHP = Math.floor(Math.max(Game.math.hp.enemy(this.enemyInfo, battle.getLevel()), 1));
		this.hp = this.maxHP;
		this.weapon = Game.weapons[this.enemyInfo.weapon];
		if ('hasLifeBar' in this.enemyInfo && this.enemyInfo.hasLifeBar) {
			this.battle.ui.hud.createEnemyHPGauge(this.name, this.maxHP);
		}
	}
	this.mpPool = mpPool !== void null ? mpPool
		: new MPPool(Math.floor(Math.max(Game.math.mp.capacity(this.getInfo()), 0)));
	this.actor = battle.ui.createActor(this.name, position, this.row, this.isPartyMember() ? 'party' : 'enemy');
	if (this.isPartyMember()) {
		this.battle.ui.hud.setPartyMember(position, this.name, this.hp, this.maxHP);
	}
	if (!this.isPartyMember()) {
		this.actor.enter(true);
	}
	this.counter = Game.math.timeUntilNextTurn(this, Game.defaultMoveRank);
	var unitType = this.partyMember != null ? "party" : "AI";
	Console.writeLine("Created " + unitType + " unit '" + this.name + "'");
	Console.append("maxHP: " + this.maxHP);
}

// .addStatus() method
// Inflicts a status effect on the battler.
// Arguments:
//     statusID: The ID of the status to inflict.
BattleUnit.prototype.addStatus = function(statusID)
{
	var effect = new StatusEffect(statusID, this);
	this.statuses.push(effect);
	this.actor.showMessage("+", 'afflict');
	Console.writeLine(this.name + " afflicted with status " + effect.name);
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

// .getHealth() method
// Calculates the unit's remaining health as a percentage.
BattleUnit.prototype.getHealth = function()
{
	return Math.ceil(100 * this.hp / this.maxHP);
};

// .getInfo() method
// Compiles information about the battler.
// Returns:
//     An object containing information about the battler.
BattleUnit.prototype.getInfo = function()
{
	var info = {};
	info.name = this.name;
	info.health = Math.ceil(100 * this.hp / this.maxHP);
	info.level = this.getLevel();
	info.baseStats = {};
	info.stats = {};
	for (var stat in Game.namedStats) {
		info.baseStats[stat] = this.isPartyMember() ?
			this.character.baseStats[stat] :
			this.enemyInfo.baseStats[stat];
		info.stats[stat] = this.stats[stat].getValue();
	}
	return info;
}

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

// .growAsAttacker() method
// Grants the unit battle experience for successfully performing an attack.
// Arguments:
//     action:    The action performed by the unit.
//     skillUsed: The skill used in performing the action.
BattleUnit.prototype.growAsAttacker = function(action, skillUsed)
{
	if (!this.isPartyMember()) {
		return;
	}
	var proficiency = Math.floor(skillUsed.getLevel() * this.getLevel() / 100);
	for (var stat in Game.namedStats) {
		var experience = Math.max(Game.math.experience.userStat(this, stat, action, proficiency), 0);
		if (experience > 0) {
			this.stats[stat].grow(experience);
			Console.writeLine(this.name + " got " + experience + " EXP for " + Game.namedStats[stat]);
			Console.append("statVal: " + this.stats[stat].getValue());
		}
	}
};

// .growAsDefender() method
// Grants the unit battle experience for surviving an attack.
// Arguments:
//     action:    The action performed by the attacking unit.
//     skillUsed: The skill used in performing the action.
//     user:      The unit originating the attack.
BattleUnit.prototype.growAsDefender = function(action, skillUsed, user)
{
	if (!this.isPartyMember()) {
		return;
	}
	var proficiency = Math.floor(skillUsed.getLevel() * user.getLevel() / 100);
	for (var stat in Game.namedStats) {
		var experience = Math.max(Game.math.experience.targetStat(this, stat, action, proficiency), 0);
		if (experience > 0) {
			this.stats[stat].grow(experience);
			Console.writeLine(this.name + " got " + experience + " EXP for " + Game.namedStats[stat]);
			Console.append("statVal: " + this.stats[stat].getValue());
		}
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
			Console.writeLine(this.name + "'s " + this.skills[i].name + " gained " + experience + " EXP");
		}
	}
	if (!hasSkill) {
		var skill = this.partyMember.learnSkill(skillID);
		this.skills.push(skill);
		this.newSkills.push(skill);
		Console.writeLine(this.name + " learned " + skill.name);
	}
};

// .hasStatus() method
// Determines whether the unit is under the effects of a specified status.
// Arguments:
//     statusID: The ID of the status to test for, as defined in the gamedef.
BattleUnit.prototype.hasStatus = function(statusID)
{
	for (var i = 0; i < this.statuses.length; ++i) {
		if (statusID == this.statuses[i].statusID) {
			return true;
		}
	}
	return false;
};

// .heal() method
// Restores a specified amount of the battler's HP.
// Arguments:
//     amount:     The number of hit points to restore.
//     isPriority: Optional. If true, specifies priority healing. Statuses handling healing events can check
//                 for the priority flag to determine how to act on the event. (default: false)
BattleUnit.prototype.heal = function(amount, isPriority)
{
	isPriority = isPriority !== void null ? isPriority : false;
	
	var eventData = {
		amount: Math.floor(amount),
		isPriority: isPriority
	};
	this.invokeStatuses('healed', eventData);
	eventData.amount = Math.floor(eventData.amount);
	if (eventData.amount > 0) {
		this.hp = Math.min(this.hp + eventData.amount, this.maxHP);
		this.actor.showMessage(eventData.amount, 'heal');
		this.battle.ui.hud.setHP(this.name, this.hp);
		Console.writeLine(this.name + " healed for " + eventData.amount + " HP");
	} else if (eventData.amount < 0) {
		this.takeDamage(-eventData.amount, true);
	}
};

// .isAlive() method
// Determines whether the unit is still able to battle.
BattleUnit.prototype.isAlive = function()
{
	return this.hp > 0;
};

// .isPartyMember() method
// Determines whether the unit represents a party member.
BattleUnit.prototype.isPartyMember = function()
{
	return this.partyMember != null;
};

// .liftStatus() method
// Nullifies a status effects's influence on the battler.
// Arguments:
//     statusID: The status ID of the status effect to remove.
BattleUnit.prototype.liftStatus = function(statusID)
{
	for (var i = 0; i < this.statuses.length; ++i) {
		if (statusID == this.statuses[i].statusID) {
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
//     amount:     The amount of damage to inflict.
//     isPriority: Optional. If true, specifies priority damage. Statuses handling damage events can check
//                 for the priority flag to determine how to act on the event. (default: false)
BattleUnit.prototype.takeDamage = function(amount, isPriority)
{
	isPriority = isPriority !== void null ? isPriority : false;
	
	amount = Math.floor(amount);
	var eventData = {
		amount: amount,
		isPriority: isPriority
	};
	this.invokeStatuses('damaged', eventData);
	eventData.amount = Math.floor(eventData.amount);
	if (eventData.amount > 0) {
		this.hp = Math.max(this.hp - eventData.amount, 0);
		Console.writeLine(this.name + " took " + eventData.amount + " HP damage - remaining: " + this.hp);
		if (this.lifeBar != null) {
			this.lifeBar.setReading(this.hp);
		}
		this.actor.showMessage(eventData.amount, 'damage');
		this.battle.ui.hud.setHP(this.name, this.hp);
		if (this.hp <= 0) {
			Console.writeLine(this.name + " died from lack of HP");
			this.actor.animate('die');
		}
	} else if (eventData.amount < 0) {
		this.heal(-eventData.amount, true);
	}
};

// .tick() method
// Decrements the battler's CTB counter.
BattleUnit.prototype.tick = function()
{
	if (!this.isAlive()) {
		return false;
	}
	--this.counter;
	if (this.counter == 0) {
		this.battle.suspend();
		Console.writeLine("");
		Console.writeLine(this.name + "'s turn is up");
		this.invokeStatuses('beginTurn');
		if (!this.isAlive()) {
			return false;
		}
		var action = null;
		if (this.actionQueue.length > 0) {
			Console.writeLine(this.name + " still has " + this.actionQueue.length + " action(s) pending");
			action = this.actionQueue.shift();
		} else {
			if (this.ai == null) {
				this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this));
				this.moveUsed = this.moveMenu.open();
			} else {
				this.moveUsed = this.ai.getNextMove();
			}
			
			this.skillUsed = this.moveUsed.usable instanceof SkillUsable ? this.moveUsed.usable : null;
			if (this.skillUsed !== null) {
				var eventData = {
					skill: this.skillUsed.skillInfo
				};
				this.invokeStatuses('useSkill', eventData);
			}
			var nextActions = this.moveUsed.usable.use(this);
			this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this, nextActions));
			var action = nextActions[0];
			for (var i = 1; i < nextActions.length; ++i) {
				this.actionQueue.push(nextActions[i]);
			}
			if (this.actionQueue.length > 0) {
				Console.writeLine("Queued " + this.actionQueue.length + " additional action(s) for " + this.name);
			}
		}
		if (this.isAlive()) {
			var eventData = { action: action };
			this.invokeStatuses('takeAction', eventData);
			var unitsHit = this.battle.runAction(action, this, this.moveUsed.targets);
			if (unitsHit.length > 0 && this.skillUsed != null) {
				this.growAsAttacker(action, this.skillUsed);
				for (var i = 0; i < unitsHit.length; ++i) {
					unitsHit[i].growAsDefender(action, this.skillUsed, this);
				}
			}
			this.resetCounter(action.rank);
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
	return this.counter;
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
	
	var timeLeft = this.counter;
	for (var i = 1; i <= turnIndex; ++i) {
		var rank = assumedRank;
		if (nextActions !== null && i <= nextActions.length) {
			rank = nextActions[i - 1].rank;
		}
		timeLeft += Game.math.timeUntilNextTurn(this, rank);
	}
	return timeLeft;
}
