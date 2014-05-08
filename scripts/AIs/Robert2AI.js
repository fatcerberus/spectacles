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
	this.avengeP3Elementals = false;
	this.hasBeenZombieHealed = false;
	this.isAlcoholPending = false;
	this.isAlcoholUsed = false;
	this.isHolyWaterPending = false;
	this.isNecroTonicItemPending = false;
	this.isNecromancyPending = false;
	this.isScottZombie = false;
	this.necroTonicItem = null;
	this.necromancyChance = 0.0;
	this.nextElementalMove = null;
	this.phase = 0;
	this.rezombieChance = 0.0;
	this.scottStance = BattleStance.attack;
	this.turnCount = {};
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
	this.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter;
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.ai.useSkill('omni');
				this.doChargeSlashNext = true;
				this.isComboStarted = false;
				this.isNecromancyPending = true;
				this.turnsTillNecromancy = 0;
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
				this.isStatusHealPending = this.isStatusHealPending
					&& (this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite') || this.unit.hasStatus('zombie'));
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
					var isTonicUsable = this.wasHolyWaterUsed && this.ai.itemsLeft('tonic') > 5;
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
				this.elementalsTillOmni = 2;
				this.isComboStarted = false;
				this.movesTillNecroTonic = 5;
			} else {
				--this.movesTillNecroTonic;
				var chanceOfCombo = 0.5
					+ 0.25 * this.unit.hasStatus('crackdown')
					+ 0.25 * this.isScottZombie;
				if (this.unit.mpPool.availableMP < 0.25 * this.unit.mpPool.capacity && this.ai.isItemUsable('redBull')) {
					this.ai.useItem('redBull');
				} else if ((this.unit.hasStatus('ignite') || this.unit.hasStatus('frostbite')) && this.elementalsTillOmni > 0) {
					--this.elementalsTillOmni;
					if (this.elementalsTillOmni <= 0 && this.ai.isItemUsable('vaccine')) {
						var holyWatersLeft = this.ai.itemsLeft('holyWater');
						if (holyWatersLeft > 0) {
							this.ai.useItem('vaccine');
							this.avengeP3Elementals = true;
						} else {
							if (this.ai.isSkillUsable('omni')) {
								this.ai.useSkill('omni');
							} else {
								this.ai.useSkill('chargeSlash');
							}
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
								var moves = [ 'electrocute', 'upheaval' ];
								var moveToUse = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
								this.ai.useSkill(moveToUse);
								if (moveToUse == 'electrocute') {
									this.necroTonicItem = 'tonic';
									this.isNecroTonicItemPending = true;
								}
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
				if (this.nextElementalMove === null) {
					if (this.turnCount['scott'] > this.turnCount['robert2']) {
						this.ai.useSkill('windchill');
					} else {
						this.ai.useSkill('hellfire');
					}
				} else {
					this.ai.useSkill('electrocute');
				}
				this.isAlcoholPending = true;
				this.isHolyWaterPending = this.unit.hasStatus('zombie') && (this.ai.isItemUsable('holyWater') || this.ai.isItemUsable('vaccine'));
				this.isLastQSComboPending = true;
			} else {
				if (this.isAlcoholPending) {
					if (this.unit.hasStatus('zombie')) {
						if (this.isHolyWaterPending) {
							if (this.ai.isItemUsable('vaccine')) {
								this.ai.useItem('vaccine');
							} else {
								this.ai.useItem('holyWater');
							}
							this.isHolyWaterPending = false;
						} else {
							this.ai.useSkill('desperationSlash');
							this.ai.useSkill('omni');
							this.ai.useSkill('chargeSlash');
							this.isAlcoholPending = false;
						}
					} else if (this.isLastQSComboPending) {
						var qsTurns = this.ai.predictSkillTurns('quickstrike');
						this.ai.useSkill(this.unit.hasStatus('disarray') ? 'swordSlash' : 'quickstrike');
						if (qsTurns[0].unit !== this.unit || this.unit.hasStatus('disarray')) {
							this.isLastQSComboPending = false;
						}
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
					this.ai.useSkill(this.nextElementalMove);
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
	if (userID == 'robert2' && itemID == 'alcohol') {
		new Scenario()
			.adjustBGM(0.5, 5.0)
			.talk("Scott", true, 2.0, "Robert! Tell me what we're accomplishing fighting like this! No "
				+ "matter what any of us do, Amanda is the Primus. None of us can change that now.")
			.talk("Robert", true, 2.0, "Maybe not, but I'm certainly not about to turn tail and run "
				+ "when I've already come this far. Believe what you want, but mark my words, so long as "
				+ "you continue to stand in my way, this will never be over!")
			.talk("Scott", true, 2.0, "If that's the way it has to be, fine! You think I haven't come "
				+ "just as far as you? Do you truly believe I chose ANY of this? Instead... well, if only "
				+ "it were so simple.",
				"None of us chose our lots, Robert. Not Bruce, or Lauren, or Amanda. Not even you or me. "
				+ "Yet we all have to play with the hand we're dealt in the end, right?")
			.talk("Robert", true, 2.0, "What's your point, #11?")
			.fork()
				.adjustBGM(0.0, 5.0)
			.end()
			.talk("Scott", true, 2.0, "Let the cards fall how they may.")
			.synchronize()
			.pause(2.0)
			.playBGM("MyDreamsButADropOfFuel")
			.adjustBGM(1.0)
			.talk("Robert", true, 1.0, "If that's how you want it, then so be it.")
			.run(true);
		this.isAlcoholUsed = true;
		this.isAlcoholPending = false;
	} else if (userID == 'scott' && Link(targetIDs).contains('robert2')) {
		if (this.phase <= 4 && Link(curativeIDs).contains(itemID) && this.unit.hasStatus('zombie') && this.zombieHealFixState == null) {
			this.zombieHealFixState = this.phase < 4 ? 'cureStatus' : 'revenge';
		}
	} else if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		if (itemID == 'vaccine' && this.isNecromancyPending) {
			this.turnsTillNecromancy = 4;
		} else if ((itemID == 'holyWater' || itemID == 'vaccine') && this.isScottZombie) {
			var odds = this.phase >= 3 ? 0.5 : 1.0;
			if (this.phase <= 1 && this.rezombieChance * odds > Math.random() && itemID == 'holyWater'
				&& !this.isNecroTonicItemPending)
			{
				this.ai.useSkill('necromancy');
			} else {
				this.isScottZombie = false;
			}
		} else if (this.phase <= 4 && Link(curativeIDs).contains(itemID) && !this.isNecromancyPending
			&& !this.isScottZombie && !this.ai.isSkillQueued('necromancy'))
		{
			this.necromancyChance += 0.25;
			var oddsMultiplier = this.phase <= 3 ? 1.0 : 0.5;
			if (this.necromancyChance * oddsMultiplier > Math.random() && !this.isNecroTonicItemPending) {
				this.ai.useSkill('necromancy');
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
			this.isScottZombie = skillID == 'necromancy' || skillID == 'electrocute' && this.scottStance != BattleStance.guard;
			if (this.isScottZombie) {
				this.rezombieChance = 1.0;
			}
			if (skillID == 'necromancy' && this.phase >= 3 && this.necroTonicItem !== null) {
				this.necroTonicItem = 'tonic';
				this.isNecroTonicItemPending = true;
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
	if (unitID == 'robert2' && !this.ai.hasMovesQueued()) {
		if (this.isNecromancyPending && this.turnsTillNecromancy <= 0) {
			if (!this.isScottZombie) {
				this.ai.useSkill('necromancy');
			}
			this.isNecromancyPending = false;
		} else if (this.zombieHealFixState !== null) {
			switch (this.zombieHealFixState) {
				case 'cureStatus':
					if (this.ai.isItemUsable('holyWater')) {
						this.ai.useItem('holyWater');
						this.zombieHealFixState =
							this.phase == 2 ? 'healSelf'
							: this.phase >= 3 ? 'revenge'
							: null;
					} else {
						this.ai.useSkill('chargeSlash');
						this.zombieHealFixState = 'desperation';
					}
					break;
				case 'revenge':
					var moves = [ 'hellfire', 'windchill', 'electrocute', 'upheaval' ];
					var moveToUse = this.phase < 4
						? moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]
						: 'omni';
					if (this.ai.isSkillUsable(moveToUse)) {
						this.ai.useSkill(moveToUse);
						this.zombieHealFixState = null;
					} else {
						this.ai.useSkill('chargeSlash');
						this.zombieHealFixState = 'desperation'
					}
					break;
				case 'healSelf':
					if (this.ai.isItemUsable('powerTonic') && !this.unit.hasStatus('zombie')) {
						this.ai.useItem('powerTonic');
						this.zombieHealFixState = null;
					} else {
						if (this.ai.isSkillUsable('omni')) {
							this.ai.useSkill('omni');
							this.zombieHealFixState = null;
						} else {
							this.ai.useSkill('chargeSlash');
							this.zombieHealFixState = 'desperation'
						}
					}
					break;
				case 'desperation':
					this.zombieHealFixState = null;
					break;
			}
		} else if (this.avengeP3Elementals) {
			if (this.ai.isSkillUsable('omni')) {
				this.ai.useSkill('omni');
			}
			this.avengeP3Elementals = false;
		} else if (this.isNecroTonicItemPending) {
			if (this.ai.isItemUsable(this.necroTonicItem)) {
				var itemTarget = this.isScottZombie ? 'scott' : 'robert2';
				this.ai.useItem(this.necroTonicItem, itemTarget);
			}
			this.isNecroTonicItemPending = false;
			this.necroTonicItem = 'tonic';
		}
	} else if (unitID == 'scott') {
		if (this.isNecromancyPending) {
			--this.turnsTillNecromancy;
		} else {
			this.necromancyChance = Math.max(this.necromancyChance - 0.05, 0.0);
		}
	}
};
