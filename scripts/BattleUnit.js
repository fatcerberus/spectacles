/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Stat.js");
RequireScript("BattleUnitActionMenu.js");

// BattleUnit() constructor
// Creates an object representing an active battler.
// Arguments:
//     battle:      The battle in which the battler is participating.
//     partyMember: The party member the unit is to represent.
function BattleUnit(battle, partyMember)
{
	// .addStatus() method
	// Inflicts a status on the battler.
	// Arguments:
	//     status: The status to inflict.
	this.addStatus = function(status)
	{
		this.statuses.push(status);
	};
	
	// .die() method
	// Inflicts instant death on the battler.
	// Remarks:
	//     This is implemented by inflicting non-piercing damage on the unit equal to its Max HP.
	//     As such, defending will reduce this damage. This is intended.
	this.die = function()
	{
		this.takeDamage(this.maxHP);
	};
	
	// .heal() method
	// Restores a specified amount of the battler's HP.
	// Arguments:
	//     amount: The number of hit points to restore.
	this.heal = function(amount)
	{
		if (amount >= 0) {
			this.hpValue = Math.min(this.hpValue + Math.floor(amount), this.maxHP);
			this.healed.invoke(this, amount);
		} else {
			this.takeDamage(amount, true);
		}
	};
	
	// .liftStatus() method
	// Removes a status effect from the battler.
	// Arguments:
	//     statusType: The status to remove.
	this.liftStatus = function(statusType)
	{
		for (var i = 0; i < this.statuses.length; ++i) {
			if (this.statuses[i] instanceof StatusType) {
				this.statuses.splice(i, 1);
				--i;
			}
		}
	};
	
	// .queueAction() method
	// Queues an action to be performed on the unit's next turn.
	// Arguments:
	//     action: Required. The action to be performed.
	this.queueAction = function(action)
	{
		this.actionQueue.push(action);
	};
	
	// .resetCTBTimer() method
	// Resets the unit's CTB timer after performing a move.
	// Arguments:
	//     rank: Required. The rank of the move performed.
	this.resetCTBTimer = function(rank)
	{
		this.ctbTimer = Game.math.timeUntilNextTurn(this, rank);
	};
	
	// .revive() method
	// Revives the battler from KO and restores HP.
	// Arguments:
	//     health: The percentage of the battler's HP to restore. Must be greater than zero.
	//             Defaults to 100.
	this.revive = function(health)
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
	this.takeDamage = function(amount, ignoreDefend)
	{
		if (ignoreDefend === undefined) ignoreDefend = false;
		
		amount = Math.floor(amount);
		if (this.isDefending && !ignoreDefend) {
			amount = Math.ceil(amount / 2);
		}
		if (amount >= 0) {
			this.hpValue = Math.max(this.hpValue - amount, 0);
			this.damaged.invoke(this, amount);
		} else {
			this.heal(amount);
		}
	};
	
	// .tick() method
	// Advances the battler's CTB timer.
	this.tick = function()
	{
		--this.ctbTimer;
		if (this.ctbTimer == 0) {
			this.battle.suspend();
			if (myBattlerInfo.isAIControlled) {
				var move = this.battlerInfo.move(this.battle, this);
			} else {
				var move = this.moveMenu.show();
			}
			this.battle.runAction(this, move.targets, move.action);
			this.initializeTimer(move.action.rank);
			this.battle.resume();
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
	this.timeUntilTurn = function(turnIndex, assumedRank, nextMoves)
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
	
	// .health property
	// Gets the unit's remaining health as a percentage.
	this.health getter = function()
	{
		return Math.floor(100 * this.hpValue / this.maxHP);
	};
	
	// .hp property
	// Gets the unit's remaining hit points.
	this.hp getter = function()
	{
		return this.hpValue;
	};
	
	// .timeUntilNextTurn property
	// Returns the number of ticks until the battler can act.
	this.timeUntilNextTurn = function()
	{
		return this.ctbTimer;
	};
	
	// .damaged event
	// Invoked when the unit takes damage.
	// Arguments for event handler:
	//     sender: The BattleUnit that caused the event.
	//     amount: The number of hit points lost.
	this.damaged = new MultiDelegate();
	
	// .healed event
	// Invoked when the unit recovers HP.
	// Arguments for event handler:
	//     sender: The BattleUnit that caused the event.
	//     amount: The number of hit points recovered.
	this.healed = new MultiDelegate();

	
	// Construct the object.
	this.battle = battle;
	this.partyMember = partyMember;
	this.name = partyMember.name;
	this.stats = {};
	for (var name in Game.namedStats) {
		this.stats[name] = partyMember.stats[name];
	}
	this.maxHPValue = Game.math.partyMemberHP(partyMember);
	this.hpValue = this.maxHPValue;
	this.statuses = [];
	this.ctbTimer = null;
	this.actionQueue = [];
	this.resetCTBTimer(2);
}
