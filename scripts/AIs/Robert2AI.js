/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// Robert2AI() constructor
// Creates an AI to control Robert Spellbinder in the final battle.
// Arguments:
//     battle:    The battle session this AI is participating in.
//     unit:      The battle unit to be controlled by this AI.
//     aiContext: The AI context that this AI will execute under.
function Robert2AI(battle, unit, aiContext)
{
	this.battle = battle;
	this.unit = unit;
	this.ai = aiContext;
	this.isAlcoholPending = false;
	this.isAlcoholUsed = false;
	this.isFixingZombieHeal = false;
	this.isNecroTonicItemPending = false;
	this.isNecromancyPending = false;
	this.isScottZombie = false;
	this.necroTonicItem = null;
	this.necromancyChance = 0.0;
	this.nextElementalMove = null;
	this.phase = 0;
	this.rezombieChance = 0.0;
	this.scottStance = BattleStance.attack;
	this.scottImmuneTurnsLeft = 0;
	this.turnCount = {};
	this.zombieHealAlertLevel = 0;
	this.zombieHealFixState = null;
	this.phasePoints = [ 3000, 1500, 500 ];
	for (var i = 0; i < this.phasePoints.length; ++i) {
		this.phasePoints[i] = Math.round(this.phasePoints[i] + 200 * (0.5 - Math.random()));
	}
	
	this.battle.itemUsed.addHook(this, this.onItemUsed);
	this.battle.skillUsed.addHook(this, this.onSkillUsed);
	this.battle.stanceChanged.addHook(this, this.onStanceChanged);
	this.battle.unitReady.addHook(this, this.onUnitReady);
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
Robert2AI.prototype.dispose = function()
{
	this.battle.itemUsed.removeHook(this, this.onItemUsed);
	this.battle.skillUsed.removeHook(this, this.onSkillUsed);
	this.battle.stanceChanged.removeHook(this, this.onStanceChanged);
	this.battle.unitReady.removeHook(this, this.onUnitReady);
};

// .strategize() method
// Allows Robert to decide what he will do next when his turn arrives.
Robert2AI.prototype.strategize = function()
{				
	if ('maggie' in this.ai.enemies && this.ai.turnsTaken == 0) {
		new Scenario()
			.talk("Robert", true, 2.0, "Wait, hold on... what in Hades' name is SHE doing here?")
			.talk("maggie", true, 2.0, "The same thing I'm always doing, having stuff for dinner. Like you!")
			.call(function() { this.unit.takeDamage(this.unit.maxHP - 1); }.bind(this))
			.playSound('Munch.wav')
			.talk("Robert", true, 2.0, "HA! You missed! ...hold on, where'd my leg go? ...and my arm, and my other leg...")
			.talk("maggie", true, 2.0, "Tastes like chicken!")
			.talk("Robert", true, 2.0, "...")
			.run(true);
		this.ai.useItem('alcohol');
	}
	var lastPhase = this.phase;
	var phaseToEnter =
		this.unit.hp > this.phasePoints[0] ? 1 :
		this.unit.hp > this.phasePoints[1] ? 2 :
		this.unit.hp > this.phasePoints[2] ? 3 :
		4;
	if (this.isAlcoholUsed && !this.unit.hasStatus('drunk')) {
		phaseToEnter = 5;
	}
	this.phase = Math.max(phaseToEnter, lastPhase);
	this.zombieHealAlertLevel = Math.max(this.zombieHealAlertLevel, this.phase - 1);
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.ai.useSkill('omni');
				this.doChargeSlashNext = true;
				this.isComboStarted = false;
				this.isNecromancyPending = true;
			} else {
				if (this.doChargeSlashNext) {
					this.ai.useSkill('chargeSlash');
					this.doChargeSlashNext = false;
				} else if (this.scottStance == BattleStance.attack || this.isComboStarted) {
					qsTurns = this.ai.predictSkillTurns('quickstrike');
					if (qsTurns[0].unit === this.unit) {
						this.ai.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.ai.useSkill('quickstrike');
							this.doChargeSlashNext = true;
							this.isComboStarted = false;
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
							var skillID = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
							if (this.ai.isSkillUsable(skillID)) {
								this.ai.useSkill(skillID);
							} else if (this.ai.isItemUsable('redBull')) {
								this.ai.useItem('redBull');
							} else {
								this.ai.useSkill('chargeSlash');
							}
						}
					}
				} else {
					var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
					var skillID = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
					if (this.ai.isSkillUsable(skillID)) {
						this.ai.useSkill(skillID);
					} else {
						this.ai.useSkill('swordSlash');
					}
				}
			}
			break;
		case 2:
			if (this.phase > lastPhase) {
				this.ai.useSkill('upheaval');
				this.isComboStarted = false;
				this.isStatusHealPending = true;
				this.wasHolyWaterUsed = false;
				this.wasTonicUsed = false;
			} else {
				var qsTurns = this.ai.predictSkillTurns('quickstrike');
				this.isStatusHealPending = this.isStatusHealPending && (this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite'));
				var holyWatersLeft = this.ai.itemsLeft('holyWater');
				if (this.isStatusHealPending && !this.wasHolyWaterUsed && this.unit.hasStatus('zombie') && holyWatersLeft > 1) {
					var holyWaterTurns = this.ai.predictItemTurns('holyWater');
					if (holyWaterTurns[0].unit === this.unit && this.ai.isItemUsable('tonic')) {
						this.ai.useItem('holyWater');
						this.ai.useItem('tonic');
						this.wasTonicUsed = true;
					} else {
						this.ai.useItem('holyWater');
						this.wasTonicUsed = false;
					}
					this.wasHolyWaterUsed = true;
				} else if (this.isStatusHealPending && (this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite'))) {
					var skillID = this.unit.hasStatus('frostbite') ? 'flare' : 'chill';
					var spellTurns = this.ai.predictSkillTurns(skillID);
					var isTonicUsable = this.wasHolyWaterUsed && this.ai.isItemUsable('tonic');
					if (spellTurns[0].unit === this.unit && isTonicUsable || this.wasTonicUsed) {
						this.ai.useSkill(skillID, 'robert2');
						if (!this.wasTonicUsed && isTonicUsable) {
							this.ai.useItem('tonic');
						} else {
							this.ai.useSkill(this.nextElementalMove !== null ? this.nextElementalMove
								: skillID == 'chill' ? 'hellfire' : 'windchill');
						}
					} else if (!this.wasTonicUsed && isTonicUsable) {
						this.ai.useItem('tonic');
					} else {
						this.ai.useSkill(this.nextElementalMove !== null ? this.nextElementalMove
							: skillID == 'chill' ? 'hellfire' : 'windchill');
					}
					this.isStatusHealPending = false;
					this.wasHolyWaterUsed = false;
				} else if ((0.5 > Math.random() || this.isComboStarted) && qsTurns[0].unit === this.unit) {
					this.ai.useSkill('quickstrike');
					this.isComboStarted = true;
					this.wasHolyWaterUsed = false;
				} else if (this.isComboStarted) {
					var spells = [ 'flare', 'chill', 'lightning', 'quake' ];
					var skillToUse = 0.5 > Math.random()
						? spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)]
						: 'chargeSlash';
					if (!this.ai.isSkillUsable(skillToUse)) {
						skillToUse = 'swordSlash';
					}
					this.ai.useSkill(skillToUse);
					this.isComboStarted = false;
					this.wasHolyWaterUsed = false;
				} else {
					var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
					var moveToUse = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
					if (this.ai.isSkillUsable(moveToUse)) {
						this.ai.useSkill(moveToUse);
						this.isStatusHealPending = moveToUse == 'upheaval';
					} else if (this.ai.isItemUsable('redBull')) {
						this.ai.useItem('redBull');
					} else {
						this.ai.useSkill('chargeSlash');
					}
					this.wasHolyWaterUsed = false;
				}
			}
			break;
		case 3:
			if (this.phase > lastPhase) {
				this.ai.useSkill('protectiveAura');
				this.doChargeSlashNext = false;
				this.elementalsTillOmni = 3;
				this.isComboStarted = false;
			} else {
				var chanceOfCombo = 0.75 + 0.25 * this.isScottZombie;
				if (this.unit.mpPool.availableMP < 0.25 * this.unit.mpPool.capacity && this.ai.isItemUsable('redBull')) {
					this.ai.useItem('redBull');
				} else if ((this.unit.hasStatus('ignite') || this.unit.hasStatus('frostbite')) && this.elementalsTillOmni > 0) {
					--this.elementalsTillOmni;
					if (this.elementalsTillOmni <= 0) {
						if (this.ai.isSkillUsable('omni')) {
							this.ai.useSkill('omni');
						} else {
							this.ai.useSkill('chargeSlash');
						}
					} else {
						if (this.unit.hasStatus('ignite')) {
							this.ai.useSkill('chill', 'robert2');
						} else if (this.unit.hasStatus('frostbite')) {
							this.ai.useSkill('flare', 'robert2');
						}
					}
				} else if (chanceOfCombo > Math.random() || this.isComboStarted) {
					var forecast = this.ai.predictSkillTurns('chargeSlash');
					if ((forecast[0].unit === this.unit && !this.isComboStarted) || this.doChargeSlashNext) {
						this.isComboStarted = false;
						if (forecast[0].unit === this.unit) {
							this.ai.useSkill('chargeSlash');
						} else {
							if (0.25 > Math.random()) {
								var moves = [ 'upheaval', 'electrocute' ];
								var moveToUse = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
								this.ai.useSkill(moveToUse);
								this.necroTonicItem = moveToUse == 'electrocute' ? 'tonic' : null;
							} else {
								var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
								this.ai.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
							}
						}
					} else {
						this.isComboStarted = true;
						forecast = this.ai.predictSkillTurns('quickstrike');
						if (forecast[0].unit === this.unit) {
							this.ai.useSkill('quickstrike');
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
							var skillID = this.isScottZombie ? 'swordSlash'
								: moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
							if (0.5 > Math.random() && this.ai.isSkillUsable(skillID)) {
								this.ai.useSkill(skillID);
								this.isComboStarted = false;
							} else {
								this.ai.useSkill('swordSlash');
								this.doChargeSlashNext = true;
							}
						}
					}
				} else {
					var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
					this.ai.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
				}
			}
			break;
		case 4:
			if (this.phase > lastPhase) {
				this.ai.useSkill('electrocute');
				this.necroTonicItem = 'tonic';
				this.isAlcoholPending = true;
				this.isQSComboPending = true;
				this.isQSComboStarted = false;
				this.isVaccinePending = this.ai.isItemUsable('vaccine');
			} else {
				if (this.isAlcoholPending) {
					if (this.isVaccinePending && this.unit.hasStatus('zombie')) {
						this.ai.useItem('vaccine');
						this.isVaccinePending = false;
					} else if (this.unit.hasStatus('zombie')) {
						this.ai.useSkill('desperationSlash');
						this.ai.useSkill('omni');
						this.ai.useSkill('chargeSlash');
						this.isAlcoholPending = false;
					} else if (this.isQSComboPending) {
						this.isVaccinePending = false;
						this.isQSComboStarted = true;
						this.ai.useSkill('quickstrike');
					} else {
						this.ai.useItem('alcohol');
						this.ai.useSkill('omni');
					}
				} else {
					var forecast = this.ai.predictSkillTurns('omni');
					if ((forecast[0].unit === this.unit || forecast[1].unit === this.unit)
						&& this.ai.isSkillUsable('omni'))
					{
						this.ai.useSkill('omni');
					} else {
						var hellfireTurns = this.ai.predictSkillTurns('hellfire');
						if (hellfireTurns[0].unit === this.unit && this.nextElementalMove === null) {
							this.ai.useSkill('hellfire');
							this.ai.useSkill('windchill');
						} else if (0.5 > Math.random()) {
							this.ai.useSkill('chargeSlash');
						} else {
							var moves = [ 'hellfire', 'windchill', 'electrocute', 'upheaval' ];
							var moveID = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
							if (this.ai.isSkillUsable(moveID)) {
								this.ai.useSkill(moveID);
							} else if (!this.unit.hasStatus('disarray')) {
								var qsTurns = this.ai.predictSkillTurns('quickstrike');
								this.ai.useSkill(qsTurns[0].unit == this.unit ? 'quickstrike' : 'swordSlash');
							} else {
								this.ai.useSkill('swordSlash');
							}
						}
					}
				}
			}
			break;
		case 5:
			if (this.phase > lastPhase) {
				this.ai.useSkill('crackdown');
				this.isDesperate = false;
				this.isFinalTier2Used = false;
			} else {
				if (this.unit.hp <= 1500 && !this.isFinalTier2Used) {
					var moves = [ 'hellfire', 'windchill' ];
					var randomMoveID = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
					this.ai.useSkill(this.nextElementalMove !== null ? this.nextElementalMove : randomMoveID);
					this.isFinalTier2Used = true;
				} else if (this.unit.hp <= 500 && !this.isDesperate) {
					this.isDesperate = true;
					this.ai.useSkill('desperationSlash');
					if (this.ai.isSkillUsable('omni')) {
						this.ai.useSkill('omni');
					}
					this.ai.useSkill('chargeSlash');
				} else if (this.isDesperate) {
					if (!this.unit.hasStatus('disarray')) {
						var qsTurns = this.ai.predictSkillTurns('quickstrike');
						this.ai.useSkill(qsTurns[0].unit == this.unit ? 'quickstrike' : 'chargeSlash');
					} else {
						this.ai.useSkill('chargeSlash');
					}
				} else {
					var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
					var moveToTry = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
					if (this.ai.isSkillUsable(moveToTry)) {
						this.ai.useSkill(moveToTry);
					} else {
						this.ai.useSkill('chargeSlash');
					}
				}
			}
			break;
	}
};

// .onItemUsed() event handler
// Allows Robert to react when someone in the battle uses an item.
Robert2AI.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
	if (this.unit.hasStatus('drunk')) {
		return;
	}
	var curativeIDs = [ 'tonic', 'powerTonic' ];
	if (userID == 'robert2' && (itemID == 'tonic' || itemID == 'powerTonic') && this.unit.hasStatus('zombie')) {
		if (this.zombieHealFixState === null && this.phase >= 3 && this.ai.isItemUsable('holyWater')) {
			this.ai.useItem('holyWater');
		}
	} else if (userID == 'robert2' && itemID == 'alcohol') {
		new Scenario()
			.adjustBGM(0.5, 5.0)
			.talk("Scott", true, 2.0, "Robert! Tell me what we're accomplishing fighting like this! You have to "
				+ "realize by now that matter what any of us do, Amanda is the Primus. None of us--nothing can "
				+ "change that now.")
			.talk("Robert", true, 2.0, "What, you really believe I'm about to turn tail and run when I've "
				+ "already come this far? Believe what you want, but mark my words, so long as you continue to "
				+ "stand in my way, this will never be over!")
			.talk("Scott", true, 2.0, "If that's the way it has to be, Robert, fine. You think I haven't come "
				+ "just as far as you? Do you truly believe I chose ANY of this? Instead... well, if only "
				+ "it were that simple.",
				"None of us chose our lots, Robert. Not Bruce, or Lauren, or Amanda. Not even you or me. "
				+ "And yet, we all have to play with the hand we're dealt in the end, don't we?")
			.talk("Robert", true, 2.0, "What's your point, #11?")
			.fork()
				.adjustBGM(0.0, 5.0)
			.end()
			.talk("Scott", true, 1.0, "Let the cards fall how they may.")
			.synchronize()
			.pause(2.0)
			.playBGM("MyDreamsButADropOfFuel")
			.adjustBGM(1.0)
			.talk("Robert", true, 2.0, "If that's how you want it, then so be it.")
			.run(true);
		this.isAlcoholUsed = true;
		this.isAlcoholPending = false;
	} else if (userID == 'scott' && Link(targetIDs).contains('robert2')) {
		if (this.phase <= 4 && Link(curativeIDs).contains(itemID) && this.unit.hasStatus('zombie') && this.zombieHealFixState === null) {
			this.zombieHealAlertLevel = Math.max(this.zombieHealAlertLevel + 1, 4 - this.ai.itemsLeft('holyWater'));
			this.zombieHealFixState = this.zombieHealAlertLevel <= 2 ? 'fixStatus' : 'retaliate';
		}
	} else if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		if (itemID == 'vaccine' && this.scottImmuneTurnsLeft == 0) {
			this.isScottZombie = false;
			this.scottImmuneTurnsLeft = 4;
		} else if (itemID == 'holyWater' && this.isScottZombie) {
			if (this.phase <= 1 && this.rezombieChance > Math.random() && !this.isNecroTonicItemPending) {
				this.ai.useSkill('necromancy');
			} else {
				this.isScottZombie = false;
			}
		} else if (this.phase <= 3 && Link(curativeIDs).contains(itemID) && !this.isNecromancyPending
			&& !this.isScottZombie && !this.ai.isSkillQueued('necromancy') && this.zombieHealFixState === null)
		{
			this.necromancyChance += 0.25;
			if ((this.necromancyChance > Math.random()) && !this.isNecroTonicItemPending) {
				this.ai.useSkill(this.phase >= 3 ? 'electrocute' : 'necromancy');
				this.necroTonicItem = this.phase == 3 ? 'tonic' : null;
				this.necromancyChance = 0.0;
			}
		}
	}
};

// .onSkillUsed() event handler
// Allows Robert to react when someone in the battle uses an attack.
Robert2AI.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	if (this.unit.hasStatus('drunk')) {
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
			this.isScottZombie =
				(skillID == 'necromancy' || skillID == 'electrocute' && this.scottStance != BattleStance.guard)
				&& this.scottImmuneTurnsLeft <= 0;
			this.isNecroTonicItemPending = this.isScottZombie && this.necroTonicItem !== null;
			if (this.isScottZombie) {
				this.rezombieChance = 1.0;
			}
		} else if (skillID == 'protectiveAura') {
			if (this.unit.mpPool.availableMP < 0.5 * this.unit.mpPool.capacity) {
				this.ai.useItem('redBull');
			}
		}
	}
};

// .onStanceChanged() event handler
// Allows Robert to react when someone in the battle changes stance.
Robert2AI.prototype.onStanceChanged = function(unitID, stance)
{
	if (this.unit.hasStatus('drunk')) {
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
	if (this.unit.hasStatus('drunk')) {
		return;
	}
	this.rezombieChance /= 2;
	this.turnCount[unitID] = !(unitID in this.turnCount) ? 1 : this.turnCount[unitID] + 1;
	if (unitID != 'robert2' && this.phase == 4 && this.isQSComboStarted) {
		this.isQSComboPending = false;
	} else if (unitID == 'robert2' && !this.ai.hasMovesQueued()) {
		if (this.isNecromancyPending && this.scottImmuneTurnsLeft <= 0) {
			if (!this.isScottZombie) {
				this.ai.useSkill('necromancy');
			}
			this.isNecromancyPending = false;
		} else if (this.isNecroTonicItemPending) {
			if (this.ai.isItemUsable(this.necroTonicItem)) {
				var itemTarget = this.isScottZombie ? 'scott' : 'robert2';
				this.ai.useItem(this.necroTonicItem, itemTarget);
			}
			this.isNecroTonicItemPending = false;
			this.necroTonicItem = null;
		} else if (this.zombieHealFixState !== null) {
			switch (this.zombieHealFixState) {
				case 'fixStatus':
					this.ai.useItem('holyWater');
					this.zombieHealFixState = this.zombieHealAlertLevel <= 2 ? 'retaliate' : null;
					break;
				case 'retaliate':
					switch (this.zombieHealAlertLevel) {
						case 1:
							this.ai.useItem('tonic');
							this.zombieHealFixState = 'finish';
							break;
						case 2:
							if (!this.isScottZombie) {
								this.ai.useSkill('necromancy');
								this.ai.useItem('tonic', 'scott');
								this.zombieHealFixState = 'finish';
							} else {
								this.ai.useItem('tonic', 'scott');
								this.zombieHealFixState = 'finish';
							}
							break;
						case 3:
							this.ai.useSkill('electrocute');
							this.necroTonicItem = 'powerTonic';
							this.zombieHealFixState = 'fixStatus';
							break;
						case 4:
							if (this.ai.isItemUsable('vaccine') && !this.unit.hasStatus('immune')) {
								this.ai.useItem('vaccine');
								this.ai.useSkill('omni');
								this.zombieHealFixState = 'finish';
							} else {
								this.ai.useSkill('omni');
								this.zombieHealFixState = 'finish';
							}
							break;
					}
					break;
				case 'finish':
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
