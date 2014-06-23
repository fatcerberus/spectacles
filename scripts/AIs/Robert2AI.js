/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// Robert2AI() constructor
// Creates an AI to control Robert Spellbinder in the final battle.
// Arguments:
//     aiContext: The AI context hosting this AI.
function Robert2AI(aiContext)
{
	this.aic = aiContext;
	this.aic.battle.itemUsed.addHook(this, this.onItemUsed);
	this.aic.battle.skillUsed.addHook(this, this.onSkillUsed);
	this.aic.battle.stanceChanged.addHook(this, this.onStanceChanged);
	this.aic.battle.unitReady.addHook(this, this.onUnitReady);
	
	// HP thresholds for phase transitions
	this.phasePoints = Link([ 3000, 2000, 1000, 500 ])
		.map(function(value) { return Math.round(RNG.fromNormal(value, 50)); })
		.toArray();
	
	// AI state variables
	this.phase = 0;
	this.hasZombieHealedSelf = false;
	this.isAlcoholPending = false;
	this.isAlcoholUsed = false;
	this.isNecroTonicItemPending = false;
	this.isNecromancyPending = false;
	this.isScottZombie = false;
	this.necroTonicItem = null;
	this.necromancyChance = 0.0;
	this.nextElementalMove = null;
	this.rezombieChance = 0.0;
	this.scottStance = BattleStance.attack;
	this.scottImmuneTurnsLeft = 0;
	this.turnCount = {};
	this.zombieHealAlertLevel = 0.0;
	this.zombieHealFixState = null;
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('quickstrike');
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
Robert2AI.prototype.dispose = function()
{
	this.aic.battle.itemUsed.removeHook(this, this.onItemUsed);
	this.aic.battle.skillUsed.removeHook(this, this.onSkillUsed);
	this.aic.battle.stanceChanged.removeHook(this, this.onStanceChanged);
	this.aic.battle.unitReady.removeHook(this, this.onUnitReady);
};

// .strategize() method
// Allows Robert to decide what he will do next when his turn arrives.
Robert2AI.prototype.strategize = function()
{				
	if ('maggie' in this.aic.enemies && this.aic.turnsTaken == 0) {
		new Scenario()
			.talk("Robert", true, 2.0, Infinity, "Wait, hold on... what in Hades' name is SHE doing here?")
			.talk("maggie", true, 2.0, Infinity, "The same thing I'm always doing, having stuff for dinner. Like you!")
			.call(function() { this.aic.unit.takeDamage(this.aic.unit.hp - 1); }.bind(this))
			.playSound('Munch.wav')
			.talk("Robert", true, 2.0, Infinity, "HA! You missed! ...hold on, where'd my leg go? ...and my arm, and my other leg...")
			.talk("maggie", true, 2.0, Infinity, "Tastes like chicken!")
			.talk("Robert", true, 2.0, Infinity, "...")
			.run(true);
		this.aic.queueItem('alcohol');
	}
	var milestone = Link(this.phasePoints)
		.where(function(value) { return value >= this.aic.unit.hp; }.bind(this))
		.last()[0];
	var phaseToEnter = 2 + Link(this.phasePoints).indexOf(milestone);
	var lastPhase = this.phase;
	this.phase = Math.max(phaseToEnter, this.phase);
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('omni');
				this.doChargeSlashNext = true;
				this.isComboStarted = false;
				this.isNecromancyPending = true;
			} else {
				if (this.doChargeSlashNext) {
					this.aic.queueSkill('chargeSlash');
					this.doChargeSlashNext = false;
				} else if (this.scottStance == BattleStance.attack || this.isComboStarted) {
					qsTurns = this.aic.predictSkillTurns('quickstrike');
					if (qsTurns[0].unit === this.aic.unit) {
						this.aic.queueSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.aic.queueSkill('swordSlash');
							this.doChargeSlashNext = true;
							this.isComboStarted = false;
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
							var skillID = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
							if (this.aic.isSkillUsable(skillID)) {
								this.aic.queueSkill(skillID);
							} else {
								this.aic.queueSkill('swordSlash');
							}
						}
					}
				} else {
					var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
					var skillID = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
					if (this.aic.isSkillUsable(skillID)) {
						this.aic.queueSkill(skillID);
					} else {
						this.aic.queueSkill('swordSlash');
					}
				}
			}
			break;
		case 2:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('upheaval');
				this.isComboStarted = false;
				this.isStatusHealPending = true;
				this.wasHolyWaterUsed = false;
				this.wasTonicUsed = false;
			} else {
				this.isStatusHealPending =
					(this.aic.unit.hasStatus('frostbite') || this.aic.unit.hasStatus('ignite'))
					&& this.isStatusHealPending;
				var qsTurns = this.aic.predictSkillTurns('quickstrike');
				if (this.isStatusHealPending && this.hasZombieHealedSelf
				    && !this.wasHolyWaterUsed && this.aic.unit.hasStatus('zombie') && this.aic.isItemUsable('holyWater'))
				{
					var holyWaterTurns = this.aic.predictItemTurns('holyWater');
					if (holyWaterTurns[0].unit === this.aic.unit && this.aic.isItemUsable('tonic')) {
						this.aic.queueItem('holyWater');
						this.aic.queueItem('tonic');
						this.wasTonicUsed = true;
					} else {
						this.aic.queueItem('holyWater');
						this.wasTonicUsed = false;
					}
					this.wasHolyWaterUsed = true;
				} else if (this.isStatusHealPending && (this.aic.unit.hasStatus('frostbite') || this.aic.unit.hasStatus('ignite'))) {
					var skillID = this.aic.unit.hasStatus('frostbite') ? 'flare' : 'chill';
					var spellTurns = this.aic.predictSkillTurns(skillID);
					var isTonicUsable = (!this.aic.unit.hasStatus('zombie') || this.wasHolyWaterUsed || !this.hasZombieHealedSelf)
						&& this.aic.isItemUsable('tonic');
					if (spellTurns[0].unit === this.aic.unit && isTonicUsable || this.wasTonicUsed) {
						this.aic.queueSkill(skillID, 'robert2');
						if (!this.wasTonicUsed && isTonicUsable) {
							this.aic.queueItem('tonic');
						} else {
							this.aic.queueSkill(this.nextElementalMove !== null ? this.nextElementalMove
								: skillID == 'chill' ? 'hellfire' : 'windchill');
						}
					} else if (!this.wasTonicUsed && isTonicUsable) {
						this.aic.queueItem('tonic');
					} else {
						this.aic.queueSkill(this.nextElementalMove !== null ? this.nextElementalMove
							: skillID == 'chill' ? 'hellfire' : 'windchill');
					}
					this.isStatusHealPending = false;
					this.wasHolyWaterUsed = false;
				} else if ((0.5 > Math.random() || this.isComboStarted) && qsTurns[0].unit === this.aic.unit) {
					this.aic.queueSkill('quickstrike');
					this.isComboStarted = true;
					this.wasHolyWaterUsed = false;
				} else if (this.isComboStarted) {
					var spells = [ 'flare', 'chill', 'lightning', 'quake' ];
					var skillToUse = 0.5 > Math.random()
						? spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)]
						: 'chargeSlash';
					this.aic.queueSkill(skillToUse);
					if (skillToUse == 'quake') {
						this.aic.queueSkill('upheaval');
					}
					this.isComboStarted = false;
					this.isStatusHealPending = skillToUse == 'quake';
					this.wasHolyWaterUsed = false;
				} else {
					var spells = [ 'flare', 'chill', 'lightning', 'quake' ];
					var skillToUse = spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)];
					this.aic.queueSkill(skillToUse);
					if (skillToUse == 'quake') {
						this.aic.queueSkill('upheaval');
					}
					this.isStatusHealPending = skillToUse == 'quake';
					this.wasHolyWaterUsed = false;
				}
			}
			break;
		case 3:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('protectiveAura');
				this.aic.queueSkill(this.nextElementalMove !== null ? this.nextElementalMove : 'electrocute');
				this.necroTonicItem = this.nextElementalMove === null ? 'tonic' : null;
				this.doChargeSlashNext = false;
				this.elementalsTillRevenge = 2;
				this.isChargeSlashPending = true;
				this.isComboStarted = false;
			} else {
				var holyWaterTurns = this.aic.predictItemTurns('holyWater');
				if (this.isChargeSlashPending && !this.aic.unit.hasStatus('protect')) {
					this.aic.queueSkill('chargeSlash');
					this.isChargeSlashPending = false;
				} else if (this.aic.unit.hasStatus('zombie') && this.hasZombieHealedSelf
				    && this.aic.isItemUsable('holyWater') && this.aic.isItemUsable('tonic')
				    && holyWaterTurns[0].unit === this.aic.unit)
				{
					this.aic.queueItem('holyWater');
					this.aic.queueItem('tonic');
				} else if ((this.aic.unit.hasStatus('ignite') || this.aic.unit.hasStatus('frostbite')) && this.elementalsTillRevenge > 0) {
					--this.elementalsTillRevenge;
					if (this.elementalsTillRevenge <= 0) {
						this.aic.queueSkill('electrocute');
						this.necroTonicItem = 'powerTonic';
					} else {
						if (this.aic.unit.hasStatus('ignite')) {
							this.aic.queueSkill('chill', 'robert2');
						} else if (this.aic.unit.hasStatus('frostbite')) {
							this.aic.queueSkill('flare', 'robert2');
						}
					}
				} else if (0.5 > Math.random() || this.isComboStarted) {
					var forecast = this.aic.predictSkillTurns('chargeSlash');
					if ((forecast[0].unit === this.aic.unit && !this.isComboStarted) || this.doChargeSlashNext) {
						this.isComboStarted = false;
						if (forecast[0].unit === this.aic.unit) {
							this.aic.queueSkill('chargeSlash');
						} else {
							var spells = [ 'hellfire', 'windchill' ];
							var randomSkillID = spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)];
							this.aic.queueSkill(this.nextElementalMove !== null ? this.nextElementalMove : randomSkillID);
						}
					} else {
						this.isComboStarted = true;
						forecast = this.aic.predictSkillTurns('quickstrike');
						if (forecast[0].unit === this.aic.unit) {
							this.aic.queueSkill('quickstrike');
						} else {
							var skillToUse = 0.5 > Math.random() ? 'quake' : 'swordSlash';
							if (this.aic.isSkillUsable(skillToUse)) {
								this.aic.queueSkill(skillToUse);
								if (skillToUse == 'quake') {
									this.aic.queueSkill('upheaval');
								}
								this.doChargeSlashNext = skillID == 'swordSlash';
								this.isComboStarted = false;
							} else {
								this.aic.queueSkill('swordSlash');
								this.doChargeSlashNext = true;
								this.isComboStarted = false;
							}
						}
					}
				} else {
					var spells = [ 'flare', 'chill', 'lightning', 'quake' ];
					var skillID = spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)];
					this.aic.queueSkill(skillID);
					if (skillID == 'quake') {
						this.aic.queueSkill('upheaval');
					}
				}
			}
			break;
		case 4:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('crackdown');
			} else {
				var spells = [ 'hellfire', 'windchill', 'electrocute', 'upheaval' ];
				var skillID = spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)];
				var finisherID = this.aic.isSkillUsable(skillID) ? skillID : 'swordSlash';
				var qsTurns = this.aic.predictSkillTurns('quickstrike');
				this.aic.queueSkill(qsTurns[0].unit == this.aic.unit ? 'quickstrike' : finisherID);
				if (this.aic.isSkillQueued(finisherID) && this.scottStance == BattleStance.guard) {
					this.aic.queueSkill('chargeSlash');
				}
			}
			break;
		case 5:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('desperationSlash');
				if (this.aic.unit.hasStatus('zombie') && this.aic.isItemUsable('vaccine')) {
					this.aic.queueItem('vaccine');
				}
				this.isAlcoholPending = true;
				this.isDesperate = false;
				this.isComboStarted = false;
			} else {
				if (this.isAlcoholPending) {
					if (this.aic.unit.hasStatus('zombie')) {
						if (this.aic.isSkillUsable('omni')) {
							this.aic.queueSkill('omni');
						}
						this.aic.queueSkill('chargeSlash');
						this.isAlcoholPending = false;
						this.isDesperate = true;
					} else {
						this.isAlcoholPending = false;
						this.aic.queueItem('alcohol');
						this.aic.queueSkill('chargeSlash');
						this.aic.queueSkill('hellfire');
						this.aic.queueSkill('upheaval');
						this.aic.queueSkill('windchill');
						this.aic.queueSkill('electrocute');
					}
				} else if ((this.aic.unit.hp <= 500 || this.aic.unit.mpPool.availableMP < 200) && !this.isDesperate) {
					this.isDesperate = true;
					this.aic.queueSkill('omni');
				} else {
					var qsTurns = this.aic.predictSkillTurns('quickstrike');
					var moves = this.aic.unit.mpPool.availableMP >= 200
						? [ 'flare', 'chill', 'lightning', 'quake', 'quickstrike', 'chargeSlash' ]
						: [ 'quickstrike', 'chargeSlash' ];
					var skillID = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
					if (skillID == 'quickstrike' || this.isComboStarted) {
						skillID = qsTurns[0].unit === this.aic.unit ? 'quickstrike' : 'swordSlash';
						this.isComboStarted = skillID == 'quickstrike';
						this.aic.queueSkill(skillID);
					} else {
						this.aic.queueSkill(skillID);
					}
				}
			}
	}
};

// .onItemUsed() event handler
// Allows Robert to react when someone in the battle uses an item.
Robert2AI.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
	if (this.aic.unit.hasStatus('drunk') || this.aic.unit.hasStatus('offGuard')) {
		return;
	}
	var curativeIDs = [ 'tonic', 'powerTonic' ];
	if (userID == 'robert2' && (itemID == 'tonic' || itemID == 'powerTonic') && this.aic.unit.hasStatus('zombie')
	    && Link(targetIDs).contains('robert2') && this.phase <= 4)
	{
		if (this.zombieHealFixState === null && this.aic.isItemUsable('holyWater')) {
			this.aic.queueItem('holyWater');
			this.hasZombieHealedSelf = true;
		}
	} else if (userID == 'robert2' && itemID == 'alcohol' && Link(targetIDs).contains('robert2')) {
		this.aic.unit.addStatus('finalStand');
		new Scenario()
			.adjustBGM(0.5, 5.0)
			.talk("Scott", true, 2.0, Infinity,
				"Robert! Tell me what we're accomplishing fighting like this! You HAVE to "
				+ "realize by now that no matter what any of us do, Amanda is the Primus! None of us--nothing can "
				+ "change that now!")
			.talk("Robert", true, 2.0, Infinity, "...")
			.talk("Scott", true, 2.0, Infinity,
				"You think I haven't come just as far as you? Is that it, Robert? You believe I "
				+ "chose to be in the position I'm in? No... instead I can only stand here wishing it were so simple.",
				"None of us chose our lots, Robert, not one. Not Bruce, Lauren, Amanda... not even you or me. All of us, "
				+ "in the end, left with no choice but to try to play with the absurd hand we're dealt.")
			.talk("Robert", true, 1.0, Infinity, "...")
			.fork()
				.adjustBGM(0.0, 5.0)
			.end()
			.talk("Scott", true, 2.0, Infinity, "Let the cards fall how they may. I'm not backing down now. I owe myself far too much.")
			.synchronize()
			.pause(1.0)
			.playBGM("BasicInstinct")
			.adjustBGM(1.0)
			.talk("Robert", true, 2.0, Infinity, "If that's what you want, then so be it.")
			.run(true);
		this.isAlcoholUsed = true;
	} else if (userID == 'scott' && Link(targetIDs).contains('robert2')) {
		if (Link(curativeIDs).contains(itemID) && this.aic.unit.hasStatus('zombie')
		    && !this.aic.isSkillQueued('electrocute'))
		{
			if (this.phase <= 4 && this.zombieHealFixState === null) {
				this.zombieHealFixState = 'fixStatus';
				if (this.zombieHealAlertLevel > 1.0 || !this.aic.isItemUsable('vaccine') && !this.aic.isItemUsable('holyWater')) {
					this.zombieHealFixState = 'retaliate';
				}
			} else if (this.phase == 5 && !this.aic.hasMovesQueued()) {
				if ((this.aic.isItemUsable('powerTonic') || this.aic.isItemUsable('tonic'))
				    && this.aic.unit.mpPool.availableMP >= 300)
				{
					this.aic.queueSkill('electrocute');
					this.aic.queueItem(this.aic.isItemUsable('powerTonic') ? 'powerTonic' : 'tonic', 'scott');
				}
			}
		}
	} else if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		if (itemID == 'vaccine' && this.scottImmuneTurnsLeft == 0) {
			this.isScottZombie = false;
			this.scottImmuneTurnsLeft = 6;
		} else if (itemID == 'holyWater' && this.isScottZombie) {
			if (this.phase <= 3 && this.rezombieChance > Math.random() && !this.isNecroTonicItemPending) {
				this.aic.queueSkill('necromancy');
			} else {
				this.isScottZombie = false;
			}
		} else if (this.phase <= 3 && Link(curativeIDs).contains(itemID) && !this.isNecromancyPending
			&& !this.isScottZombie && !this.aic.isSkillQueued('necromancy') && !this.aic.isSkillQueued('electrocute')
			&& this.zombieHealFixState === null)
		{
			this.necromancyChance += 0.25;
			if ((this.necromancyChance > Math.random()) && !this.isNecroTonicItemPending) {
				this.aic.queueSkill(this.phase <= 2 ? 'necromancy' : 'electrocute');
				this.necromancyChance = 0.0;
			}
		}
	}
};

// .onSkillUsed() event handler
// Allows Robert to react when someone in the battle uses an attack.
Robert2AI.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	if (this.aic.unit.hasStatus('drunk') || this.aic.unit.hasStatus('offGuard')) {
		return;
	}
	if (userID == 'robert2') {
		if (skillID == this.nextElementalMove) {
			this.nextElementalMove = null;
		} else if (skillID == 'hellfire') {
			this.nextElementalMove = 'windchill';
		} else if (skillID == 'windchill') {
			this.nextElementalMove = 'hellfire';
		} else if (skillID == 'necromancy' || skillID == 'electrocute') {
			this.isScottZombie = (skillID == 'necromancy' || skillID == 'electrocute' && this.scottStance != BattleStance.guard)
				&& this.scottImmuneTurnsLeft <= 0;
			this.isNecroTonicItemPending = this.isScottZombie && this.necroTonicItem !== null
				&& this.aic.isItemUsable(this.necroTonicItem);
			if (this.isScottZombie) {
				this.rezombieChance = 1.0;
			}
		}
	} else if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		if (((skillID == 'flare' || skillID == 'hellfire') && this.nextElementalMove == 'hellfire')
			|| ((skillID == 'chill' || skillID == 'windchill') && this.nextElementalMove == 'windchill'))
		{
			this.nextElementalMove = null;
		}
	}
};

// .onStanceChanged() event handler
// Allows Robert to react when someone in the battle changes stance.
Robert2AI.prototype.onStanceChanged = function(unitID, stance)
{
	if (this.aic.unit.hasStatus('drunk')) {
		return;
	}
	if (unitID == 'scott') {
		this.scottStance = stance;
	}
};

// .onUnitReady() event handler
// Allows Robert to react when a new turn arrives during the battle.
Robert2AI.prototype.onUnitReady = function(unitID)
{
	if (this.aic.unit.hasStatus('drunk')) {
		return;
	}
	this.rezombieChance /= 2;
	if (this.zombieHealFixState === null) {
		this.zombieHealAlertLevel = Math.max(0.0, this.zombieHealAlertLevel - 0.1);
	}
	this.turnCount[unitID] = !(unitID in this.turnCount) ? 1 : this.turnCount[unitID] + 1;
	if (unitID == 'robert2' && !this.aic.hasMovesQueued()) {
		if (this.isNecromancyPending && this.scottImmuneTurnsLeft <= 0) {
			if (!this.isScottZombie) {
				this.aic.queueSkill('necromancy');
			}
			this.isNecromancyPending = false;
		} else if (this.aic.unit.mpPool.availableMP < 0.25 * this.aic.unit.mpPool.capacity && this.aic.isItemUsable('redBull') && this.phase <= 4) {
			this.aic.queueItem('redBull');
		} else if (this.isNecroTonicItemPending) {
			if (this.aic.isItemUsable(this.necroTonicItem)) {
				var itemTarget = this.isScottZombie ? 'scott' : 'robert2';
				this.aic.queueItem(this.necroTonicItem, itemTarget);
			}
			this.isNecroTonicItemPending = false;
			this.necroTonicItem = null;
		} else if (this.zombieHealFixState !== null) {
			switch (this.zombieHealFixState) {
				case 'fixStatus':
					var itemID = (this.zombieHealAlertLevel > 0.0 || !this.aic.isItemUsable('holyWater')) && this.aic.isItemUsable('vaccine')
						? 'vaccine' : 'holyWater';
					this.aic.queueItem(itemID);
					this.zombieHealFixState = 'retaliate';
					break;
				case 'retaliate':
					switch (Math.ceil(this.zombieHealAlertLevel)) {
						case 0.0:
							if (this.aic.isSkillUsable('electrocute')) {
								this.aic.queueSkill('electrocute');
								this.necroTonicItem = 'tonic';
							}
							break;
						case 1.0:
							if (this.nextElementalMove === null) {
								this.aic.queueSkill('hellfire');
								this.aic.queueSkill('windchill');
							} else {
								var firstMoveID = this.nextElementalMove != 'hellfire' ? 'hellfire' : 'windchill'
								this.aic.queueSkill(firstMoveID);
								this.aic.queueSkill(this.nextElementalMove);
							}
							break;
						default:
							if (this.aic.isItemUsable('redBull')) {
								this.aic.queueItem('redBull');
							}
							this.aic.queueSkill('omni');
							break;
					}
					this.zombieHealFixState = 'finish';
					break;
				case 'finish':
					this.zombieHealAlertLevel += 1.0;
					this.zombieHealFixState = null;
					break;
			}
		}
	} else if (unitID == 'scott') {
		if (this.scottImmuneTurnsLeft > 0) {
			--this.scottImmuneTurnsLeft;
		}
		this.necromancyChance = Math.max(this.necromancyChance - 0.05, 0.0);
	}
};
