/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function Robert2Strategy(battle, unit, aiContext)
{
	this.battle = battle;
	this.unit = unit;
	this.ai = aiContext;
	this.battle.itemUsed.addHook(this, this.onItemUsed);
	this.battle.skillUsed.addHook(this, this.onSkillUsed);
	this.battle.stanceChanged.addHook(this, this.onStanceChanged);
	this.battle.unitReady.addHook(this, this.onUnitReady);
	this.avengeP3Elementals = false;
	this.elementHealState = null;
	this.isAlcoholPending = false;
	this.isAlcoholUsed = false;
	this.isHolyWaterPending = false;
	this.isNecroTonicItemReady = false;
	this.isNecromancyPending = false;
	this.isPhase4Started = false;
	this.isScottZombie = false;
	this.necroTonicItem = null;
	this.necromancyChance = 0.0;
	this.phase = 0;
	this.rezombieChance = 0.0;
	this.scottStance = BattleStance.attack;
	this.turnCount = {};
	this.zombieHealFixState = null;
	this.phasePoints = [ 3000, 1500, 500 ];
	for (var i = 0; i < this.phasePoints.length; ++i) {
		this.phasePoints[i] = Math.round(this.phasePoints[i] + 360 * (0.5 - Math.random()));
	}
}

Robert2Strategy.prototype.strategize = function()
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
				this.isComboStarted = false;
				this.isNecromancyPending = true;
				this.turnsTillNecromancy = 0;
			} else {
				var csTurns = this.ai.turnForecast('chargeSlash');
				if (0.25 > Math.random() && csTurns[0].unit === this.unit) {
					this.ai.useSkill('chargeSlash');
				} else if (this.scottStance == BattleStance.attack || this.isComboStarted) {
					qsTurns = this.ai.turnForecast('quickstrike');
					if (qsTurns[0].unit === this.unit) {
						this.ai.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.ai.useSkill(0.5 > Math.random() ? 'chargeSlash' : 'swordSlash');
							this.isComboStarted = false;
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
				if (0.75 > Math.random() && this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite')) {
					if (this.unit.hasStatus('frostbite')) {
						this.ai.useSkill('flare', 'robert2');
					} else if (this.unit.hasStatus('ignite')) {
						this.ai.useSkill('chill', 'robert2');
					}
					if (this.ai.isItemUsable('tonic')) {
						this.ai.useItem('tonic');
					}
				}
				this.doChargeSlashNext = false;
				this.isComboStarted = false;
				this.isNecromancyPending = false;
			} else {
				var qsTurns = this.ai.turnForecast('quickstrike');
				var csTurns = this.ai.turnForecast('chargeSlash');
				if (this.doChargeSlashNext) {
					this.ai.useSkill('chargeSlash');
					this.doChargeSlashNext = false;
				} else if (0.5 > Math.random() && csTurns[0].unit === this.unit) {
					this.ai.useSkill('chargeSlash');
				} else if ((0.5 > Math.random() || this.isComboStarted) && qsTurns[0].unit === this.unit) {
					this.ai.useSkill('quickstrike');
					this.isComboStarted = true;
				} else {
					if (this.isComboStarted) {
						var spells = [ 'flare', 'chill', 'lightning', 'quake' ];
						var skillToUse = 0.25 > Math.random()
							? spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)]
							: 'swordSlash';
						if (!this.ai.isSkillUsable(skillToUse)) {
							skillToUse = 'swordSlash';
						}
						this.ai.useSkill(skillToUse);
						this.isComboStarted = false;
						this.doChargeSlashNext = 0.25 > Math.random();
					} else {
						var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
						var moveToUse = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
						this.ai.useSkill(moveToUse);
						if (moveToUse == 'upheaval' && 0.5 > Math.random()
						    && (this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite')))
						{
							if (this.unit.hasStatus('frostbite')) {
								this.ai.useSkill('flare', 'robert2');
							} else if (this.unit.hasStatus('ignite')) {
								this.ai.useSkill('chill', 'robert2');
							}
							if (0.5 > Math.random() && this.ai.isItemUsable('tonic')) {
								this.ai.useItem('tonic');
							}
						}
					}
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
				} else if (this.movesTillNecroTonic <= 0 && this.ai.isItemUsable('tonic')) {
					this.ai.useSkill('electrocute');
					this.necroTonicItem = 'tonic';
					this.isNecroTonicItemReady = true;
					this.movesTillNecroTonic = Infinity;
				} else if (this.unit.hasStatus('ignite') || this.unit.hasStatus('frostbite')) {
					--this.elementalsTillOmni;
					if (this.elementalsTillOmni <= 0 && this.ai.isItemUsable('vaccine')) {
						this.ai.useItem('vaccine');
						this.avengeP3Elementals = true;
					} else {
						if (this.unit.hasStatus('ignite')) {
							this.ai.useSkill('chill', 'robert2');
						} else if (this.unit.hasStatus('frostbite')) {
							this.ai.useSkill('flare', 'robert2');
						}
					}
				} else if (chanceOfCombo > Math.random() || this.isComboStarted) {
					var forecast = this.ai.turnForecast('chargeSlash');
					if ((forecast[0].unit === this.unit && !this.isComboStarted) || this.doChargeSlashNext) {
						this.isComboStarted = false;
						if (forecast[0].unit === this.unit) {
							this.ai.useSkill('chargeSlash');
						} else {
							if (0.25 > Math.random()) {
								var moves = [ 'hellfire', 'windchill' ];
								this.ai.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
							} else {
								var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
								this.ai.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
							}
						}
					} else {
						this.isComboStarted = true;
						forecast = this.ai.turnForecast('quickstrike');
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
				if (this.turnCount['scott'] > this.turnCount['robert2']) {
					this.ai.useSkill('windchill');
					this.nextElementalMove = 'hellfire';
				} else {
					this.ai.useSkill('hellfire');
					this.nextElementalMove = 'windchill';
				}
				this.isAlcoholPending = true;
				this.isHolyWaterPending = this.unit.hasStatus('zombie') && this.ai.isItemUsable('holyWater');
			} else {
				if (this.isAlcoholPending) {
					if (this.unit.hasStatus('zombie')) {
						if (this.isHolyWaterPending) {
							this.ai.useItem('holyWater');
							this.isHolyWaterPending = false;
						} else {
							this.ai.useSkill('desperatonSlash');
							this.ai.useSkill('omni');
							this.ai.useSkill('chargeSlash');
						}
					} else {
						this.ai.useItem('alcohol');
						this.ai.useSkill('omni');
					}
				} else {
					var forecast = this.ai.turnForecast('omni');
					if ((forecast[0].unit === this.unit || forecast[1].unit === this.unit)
						&& this.ai.isSkillUsable('omni'))
					{
						this.ai.useSkill('omni');
					} else {
						if (0.5 > Math.random()) {
							this.ai.useSkill('chargeSlash');
						} else {
							var moves = [ 'hellfire', 'windchill', 'electrocute', 'upheaval' ];
							var moveID = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
							if (this.ai.isSkillUsable(moveID)) {
								this.ai.useSkill(moveID);
							} else if (!this.unit.hasStatus('disarray')) {
								var qsTurns = this.ai.turnForecast('quickstrike');
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
						var qsTurns = this.ai.turnForecast('quickstrike');
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

Robert2Strategy.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
	if (this.unit.hasStatus('drunk')) {
		return;
	}
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
			var avengeZombieOdds = itemID == 'powerTonic' ? 0.5 : 0.25;
			if (avengeZombieOdds > Math.random()) {
				this.zombieHealFixState = 'cureStatus';
			}
		}
	} else if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		var curativeIDs = [ 'tonic', 'powerTonic' ];
		if (itemID == 'vaccine' && this.isNecromancyPending) {
			this.turnsTillNecromancy = 4;
		} else if ((itemID == 'holyWater' || itemID == 'vaccine') && this.isScottZombie) {
			var odds = this.phase >= 3 ? 0.5 : 1.0;
			if (this.phase <= 1 && this.rezombieChance * odds > Math.random() && itemID == 'holyWater'
				&& !this.isNecroTonicItemReady)
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
			if (this.necromancyChance * oddsMultiplier > Math.random() && !this.isNecroTonicItemReady) {
				this.ai.useSkill('necromancy');
				this.necromancyChance = 0.0;
			}
		}
	}
};

Robert2Strategy.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	if (this.unit.hasStatus('drunk')) {
		return;
	}
	if (userID == 'robert2') {
		if (skillID == 'necromancy' || skillID == 'electrocute') {
			this.isScottZombie = skillID == 'necromancy' || skillID == 'electrocute' && this.scottStance != BattleStance.guard;
			if (this.isScottZombie) {
				this.rezombieChance = 1.0;
			}
			if (skillID == 'necromancy' && this.phase >= 3 && this.necroTonicItem !== null) {
				this.necroTonicItem = 'tonic';
				this.isNecroTonicItemReady = true;
			}
		} else if (skillID == 'protectiveAura') {
			if (this.unit.mpPool.availableMP < 0.5 * this.unit.mpPool.capacity) {
				this.ai.useItem('redBull');
			}
		}
	}
};

Robert2Strategy.prototype.onStanceChanged = function(unitID, stance)
{
	if (this.unit.hasStatus('drunk')) {
		return;
	}
	if (unitID == 'scott') {
		this.scottStance = stance;
	}
};

Robert2Strategy.prototype.onUnitReady = function(unitID)
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
						this.zombieHealFixState = 'healSelf';
					} else {
						this.ai.useSkill('desperationSlash');
						this.zombieHealFixState = 'desperation';
					}
					break;
				case 'healSelf':
					if (this.ai.isItemUsable('powerTonic') && !this.unit.hasStatus('zombie')) {
						this.ai.useItem('powerTonic');
						this.zombieHealFixState = 'revenge';
					} else {
						this.ai.useSkill('desperationSlash');
						this.zombieHealFixState = 'desperation';
					}
					break;
				case 'revenge':
					if (this.ai.isSkillUsable('electrocute')) {
						this.ai.useSkill('electrocute');
						this.zombieHealFixState = null;
					} else {
						this.ai.useSkill('desperationSlash');
						this.zombieHealFixState = 'desperation'
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
		} else if (this.elementHealState !== null) {
			if (this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite')) {
				if (this.elementHealState == 'prep') {
					if (!this.unit.hasStatus('zombie') && this.ai.isItemUsable('tonic')) {
						this.ai.useItem('tonic', 'robert2');
					} else {
						this.elementHealState = 'cureNext';
					}
				}
				if (this.elementHealState == 'cureNext') {
					if (this.unit.hasStatus('frostbite')) {
						this.ai.useSkill('flare', 'robert2');
					} else if (this.unit.hasStatus('ignite')) {
						this.ai.useSkill('chill', 'robert2');
					}
					this.elementHealState = null;
				} else {
					this.elementHealState = 'cureNext';
				}
			} else {
				if (this.elementHealState == 'cureNext') {
					this.ai.useSkill('swordSlash');
				}
				this.elementHealState = null;
			}
		} else if (this.isNecroTonicItemReady) {
			if (this.ai.isItemUsable(this.necroTonicItem)) {
				var itemTarget = this.isScottZombie ? 'scott' : 'robert2';
				this.ai.useItem(this.necroTonicItem, itemTarget);
			}
			this.isNecroTonicItemReady = false;
			this.necroTonicItem = 'tonic';
		} else if (this.isAlcoholPending && !this.isPhase4Started) {
			if (!this.unit.hasStatus('zombie')) {
				this.ai.useItem('alcohol');
				this.ai.useSkill('electrocute');this.isPhase4Started = true;
			}
		}
	} else if (unitID == 'scott') {
		if (this.isNecromancyPending) {
			--this.turnsTillNecromancy;
		} else {
			this.necromancyChance = Math.max(this.necromancyChance - 0.05, 0.0);
		}
	}
};
