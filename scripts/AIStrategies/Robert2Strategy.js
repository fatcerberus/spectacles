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
	this.battle.unitReady.addHook(this, this.onUnitReady);
	this.elementHealState = null;
	this.isAlcoholPending = false;
	this.isFinalTier2Used = false;
	this.isNecromancyReady = false;
	this.isPhase4Started = false;
	this.isScottZombie = false;
	this.isNecroTonicItemReady = false;
	this.necroTonicItem = 'powerTonic';
	this.necromancyChance = 0.0;
	this.rezombieChance = 0.0;
	this.turnCount = {};
	this.zombieHealFixState = null;
}

Robert2Strategy.prototype.strategize = function()
{				
	if ('maggie' in this.ai.enemies && this.ai.turnsTaken == 0) {
		var me = this.unit;
		new Scenario()
			.talk("Robert", true, 2.0, "Wait, hold on... what in Hades' name is SHE doing here?")
			.talk("maggie", true, 2.0, "The same thing I'm always doing, having stuff for dinner. Like you!")
			.call(function() { me.takeDamage(me.maxHP - 1); })
			.playSound('Munch.wav')
			.talk("Robert", true, 2.0, "HA! You missed! ...hold on, where'd my leg go? ...and my arm, and my other leg...")
			.talk("maggie", true, 2.0, "Tastes like chicken!")
			.talk("Robert", true, 2.0, "...")
			.run(true);
		this.ai.useItem('alcohol');
	}
	if (this.ai.turnsTaken == 0) {
		this.phase = 0;
		this.ai.useSkill('omni');
		this.isNecromancyReady = true;
		this.necromancyTurns = 0;
	} else {
		var lastPhase = this.phase;
		var phaseToEnter =
			this.unit.hp > 2500 ? 1 :
			this.unit.hp > 1500 ? 2 :
			this.unit.hp > 500 ? 3 :
			4;
		this.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter;
		switch (this.phase) {
			case 1:
				if (this.phase > lastPhase) {
					this.doChargeSlashNext = false;
					this.isComboStarted = false;
				}
				var forecast = this.ai.turnForecast('chargeSlash');
				if (this.doChargeSlashNext || forecast[0].unit === this.unit) {
					this.ai.useSkill('chargeSlash');
					this.doChargeSlashNext = false;
				} else {
					forecast = this.ai.turnForecast('quickstrike');
					if (forecast[0].unit === this.unit) {
						this.ai.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.ai.useSkill('swordSlash');
							this.isComboStarted = false;
							this.doChargeSlashNext = true;
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
							this.ai.useSkill(moves[Math.min(Math.floor(Math.random() * 4), 3)]);
						}
					}
				}
				break;
			case 2:
				if (this.phase > lastPhase) {
					this.ai.useSkill('upheaval');
					if (this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite')) {
						this.elementHealState = 'prep';
					}
					this.isComboStarted = false;
				} else {
					var forecast = this.ai.turnForecast('quickstrike');
					if ((0.5 > Math.random() || this.isComboStarted) && forecast[0].unit === this.unit) {
						this.ai.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.ai.useSkill('swordSlash');
							this.isComboStarted = false;
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
							var moveToUse = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
							this.ai.useSkill(moveToUse);
							if (moveToUse == 'upheaval' && (this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite'))) {
								this.elementHealState = 'prep';
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
					} else if (this.movesTillNecroTonic <= 0 && this.ai.isItemUsable('powerTonic')) {
						this.ai.useSkill('necromancy');
						this.movesTillNecroTonic = Infinity;
					} else if (this.unit.hasStatus('ignite') || this.unit.hasStatus('frostbite')) {
						--this.elementalsTillOmni;
						if (this.elementalsTillOmni <= 0 && this.ai.isItemUsable('vaccine')) {
							this.ai.useItem('vaccine');
						} else {
							if (this.unit.hasStatus('ignite')) {
								this.ai.useSkill('chill', 'robert2');
							} else if (this.unit.hasStatus('frostbite')) {
								this.ai.useSkill('flare', 'robert2');
							}
						}
						if (this.elementalsTillOmni <= 0) {
							this.ai.useSkill('omni');
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
								var crackdownMove = this.isScottZombie ? 'swordSlash'
									: moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
								if (this.unit.hasStatus('crackdown') && this.ai.isSkillUsable(crackdownMove)) {
									this.ai.useSkill(crackdownMove);
									this.isComboStarted = false;
								} else {
									this.ai.useSkill('quickstrike');
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
					this.ai.useSkill('desperationSlash');
				} else {
					if (!this.isPhase4Started) {
						if (!this.unit.hasStatus('zombie') && !this.isAlcoholPending) {
							this.ai.useItem('alcohol');
						} else {
							if (!this.isAlcoholPending && this.ai.isItemUsable('holyWater')) {
								this.ai.useItem('holyWater');
								this.isAlcoholPending = true;
							} else {
								if (this.ai.isItemUsable('redBull') && this.unit.mpPool.availableMP < 0.5 * this.unit.mpPool.capacity) {
									this.ai.useItem('redBull');
								}
								this.ai.useSkill('electrocute');
								this.isPhase4Started = true;
							}
						}
					} else if (this.isScottZombie && 0.25 > Math.random()) {
						this.ai.useSkill('quickstrike');
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
								this.ai.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
							}
						}
					}
				}
				break;
			case 5:
				if (this.phase > lastPhase) {
					this.ai.useSkill('omni');
					this.ai.useSkill('crackdown');
				} else {
					if (this.unit.hp <= 2000 && !this.isFinalTier2Used) {
						if (this.turnCount['scott'] > this.turnCount['robert2']) {
							this.ai.useSkill('windchill');
						} else {
							this.ai.useSkill('hellfire');
						}
						this.isFinalTier2Used = true;
					} else if (0.5 > Math.random()) {
						var magics = [ 'flare', 'chill', 'lightning', 'quake' ];
						var spellToTry = magics[Math.min(Math.floor(Math.random() * magics.length), magics.length - 1)];
						if (this.ai.isSkillUsable(spellToTry)) {
							this.ai.useSkill(spellToTry);
						} else {
							this.ai.useSkill('chargeSlash');
						}
					} else {
						this.ai.useSkill('swordSlash');
					}
				}
				break;
		}
	}
};

Robert2Strategy.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
	if (this.unit.hasStatus('drunk')) {
		return;
	}
	if (userID == 'robert2' && itemID == 'alcohol') {
		this.phase = 5;
	} else if (userID == 'scott' && Link(targetIDs).contains('robert2')) {
		var curativeIDs = [ 'tonic', 'powerTonic' ];
		if (this.phase <= 4 && Link(curativeIDs).contains(itemID) && this.unit.hasStatus('zombie') && this.zombieHealFixState == null) {
			this.zombieHealFixState = 'cureStatus';
		}
	} else if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		var curativeIDs = [ 'tonic', 'powerTonic' ];
		if (itemID == 'vaccine' && this.isNecromancyReady) {
			this.necromancyTurns = 4;
		} else if ((itemID == 'holyWater' || itemID == 'vaccine') && this.isScottZombie) {
			var odds = this.phase >= 3 ? 0.5 : 1.0;
			if (this.phase <= 1 && this.rezombieChance * odds > Math.random() && itemID == 'holyWater') {
				this.ai.useSkill('necromancy');
			} else {
				this.isScottZombie = false;
			}
		} else if (this.phase <= 4 && Link(curativeIDs).contains(itemID) && !this.isNecromancyReady && !this.isScottZombie) {
			this.necromancyChance += 0.25;
			var oddsMultiplier = this.phase <= 3 ? 1.0 : 0.5;
			if (this.necromancyChance * oddsMultiplier > Math.random()) {
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
			this.isScottZombie = true;
			this.rezombieChance = 1.0;
			if (skillID == 'necromancy' && this.phase >= 3) {
				this.isNecroTonicItemReady = true;
			}
		} else if (skillID == 'protectiveAura') {
			if (this.unit.mpPool.availableMP < 0.5 * this.unit.mpPool.capacity) {
				this.ai.useItem('redBull');
			}
		}
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
		if (this.isNecromancyReady && this.necromancyTurns <= 0) {
			if (!this.isScottZombie) {
				this.ai.useSkill('necromancy');
			}
			this.isNecromancyReady = false;
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
			}
		}
	} else if (unitID == 'scott') {
		if (this.isNecromancyReady) {
			--this.necromancyTurns;
		} else {
			this.necromancyChance = Math.max(this.necromancyChance - 0.05, 0.0);
		}
	}
};
