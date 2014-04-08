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
	this.isAlcoholUsed = false;
	this.isDesperate = false;
	this.isFixingZombieHeal = false;
	this.isNecromancyReady = false;
	this.isScottZombie = false;
	this.necromancyChance = 0.0;
	this.rezombieChance = 0.0;
	this.turnCount = {};
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
	} else if (this.isNecromancyReady && this.necromancyTurns <= 0) {
		this.ai.useSkill('necromancy');
		this.isNecromancyReady = false;
	} else {
		var lastPhase = this.phase;
		var phaseToEnter =
			this.unit.getHealth() > 75 ? 1 :
			this.unit.getHealth() > 40 ? 2 :
			this.unit.getHealth() > 10 ? 3 :
			4;
		if (lastPhase == 4 && this.isAlcoholUsed && !this.unit.hasStatus('drunk')) {
			phaseToEnter = 5;
		}
		this.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter;
		switch (this.phase) {
			case 1:
				if (this.phase > lastPhase) {
					this.isComboStarted = false;
				}
				var forecast = this.ai.turnForecast('chargeSlash');
				if (forecast[0].unit === this.unit) {
					this.ai.useSkill('chargeSlash');
				} else {
					forecast = this.ai.turnForecast('quickstrike');
					if (forecast[0].unit === this.unit) {
						this.ai.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.ai.useSkill('swordSlash');
							this.isComboStarted = false;
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
					if (this.unit.hasStatus('frostbite')) {
						this.ai.useSkill('flare', 'robert2');
					} else if (this.unit.hasStatus('ignite')) {
						this.ai.useSkill('chill', 'robert2');
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
							if (moveToUse == 'upheaval') {
								if (this.unit.hasStatus('frostbite')) {
									if (!this.ai.isItemUsable('vaccine')) {
										this.ai.useItem('vaccine');
									}
									this.ai.useSkill('flare', 'robert2');
								} else if (this.unit.hasStatus('ignite')) {
									if (this.ai.isItemUsable('vaccine')) {
										this.ai.useItem('vaccine');
									}
									this.ai.useSkill('chill', 'robert2');
								} else {
									this.ai.useSkill(moveToUse);
								}
							} else {
								this.ai.useSkill(moveToUse);
							}
						}
					}
				}
				break;
			case 3:
				if (this.phase > lastPhase) {
					this.ai.useSkill('protectiveAura');
					this.doChargeSlashNext = false;
					this.isComboStarted = false;
				} else {
					var chanceOfCombo = 0.25 + this.unit.hasStatus('crackdown') * 0.25;
					if (this.unit.mpPool.availableMP < 0.25 * this.unit.mpPool.capacity && this.ai.isItemUsable('redBull')) {
						this.ai.useItem('redBull');
					} else if (0.5 > Math.random() && this.isScottZombie) {
						this.ai.useSkill('chargeSlash');
					} else if (chanceOfCombo > Math.random() || this.isComboStarted) {
						var forecast = this.ai.turnForecast('chargeSlash');
						if ((forecast[0] === this.unit && !this.isComboStarted) || this.doChargeSlashNext) {
							this.isComboStarted = false;
							if (forecast[0] === this.unit) {
								this.ai.useSkill('chargeSlash');
							} else {
								var moves = [ 'hellfire', 'windchill' ];
								this.ai.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
							}
						} else {
							this.isComboStarted = true;
							forecast = this.ai.turnForecast('quickstrike');
							if (forecast[0] === this.unit) {
								this.ai.useSkill('quickstrike');
							} else {
								if (this.unit.hasStatus('crackdown')
								    && this.ai.isSkillUsable('omni'))
								{
									this.ai.useSkill('omni');
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
					if (!this.unit.hasStatus('zombie')) {
						this.ai.useItem('alcohol');
						if (this.ai.isItemUsable('redBull')) {
							this.ai.useItem('redBull');
						}
						this.isAlcoholUsed = true;
					} else {
						this.ai.useSkill('desperationSlash');
						if (this.ai.isItemUsable('redBull') && this.unit.mpPool.availableMP < 0.5 * this.unit.mpPool.capacity) {
							this.ai.useItem('redBull');
						}
						this.ai.useSkill('electrocute');
					}
				} else {
					if (this.isScottZombie && 0.50 > Math.random()) {
						this.ai.useSkill('quickstrike');
					} else {
						var forecast = this.ai.turnForecast('omni');
						if ((forecast[0] === this.unit || forecast[1] === this.unit)
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
					if (this.ai.isSkillUsable('omni')) {
						this.ai.useSkill('omni');
					} else {
						this.ai.useSkill('swordSlash');
					}
				} else {
					var magics = [ 'flare', 'chill', 'lightning', 'quake' ];
					var spellToTry = magics[Math.min(Math.floor(Math.random() * magics.length), magics.length - 1)];
					if (this.unit.getHealth() <= 10 && !this.isDesperate) {
						this.isDesperate = true;
						this.ai.useSkill('desperationSlash');
					} else if (0.5 > Math.random()) {
						if (this.ai.isSkillUsable(spellToTry)) {
							this.ai.useSkill(spellToTry);
						} else if (!this.isDesperate) {
							this.isDesperate = true;
							this.ai.useSkill('desperationSlash');
						} else {
							this.ai.useSkill('swordSlash');
						}
					} else {
						if (this.turnCount['scott'] / this.turnCount['robert2'] > 1.25) {
							spellToTry = 'windchill';
						} else {
							spellToTry = 'hellfire';
						}
						if (0.5 > Math.random() && this.ai.isSkillUsable(spellToTry)) {
							this.ai.useSkill(spellToTry);
						} else {
							this.ai.useSkill('swordSlash');
						}
					}
				}
				break;
		}
	}
};

Robert2Strategy.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
	if (userID == 'robert2' && itemID == 'holyWater') {
		this.isFixingZombieHeal = false;
	} else if (userID == 'scott' && Link(targetIDs).contains('robert2')) {
		var curativeIDs = [ 'tonic', 'powerTonic' ];
		if (Link(curativeIDs).contains(itemID) && this.unit.hasStatus('zombie') && !this.isFixingZombieHeal) {
			if (this.ai.isSkillUsable('omni')) {
				this.ai.useSkill('omni');
			}
			if (this.ai.isItemUsable('holyWater')) {
				this.isFixingZombieHeal = true;
				this.ai.useItem('holyWater');
			}
		}
	} else if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		var curativeIDs = [ 'tonic', 'powerTonic' ];
		if (itemID == 'vaccine' && this.isNecromancyReady) {
			this.necromancyTurns = 4;
		} else if (itemID == 'holyWater' && this.isScottZombie) {
			if (this.phase <= 1 && this.rezombieChance > Math.random()) {
				this.ai.useSkill('necromancy');
			} else {
				this.isScottZombie = false;
			}
		} else if (this.phase <= 3 && Link(curativeIDs).contains(itemID) && !this.isNecromancyReady && !this.isScottZombie) {
			this.necromancyChance += 0.25;
			var oddsMultiplier = this.phase <= 2 ? 1.0 : 0.5;
			if (this.necromancyChance * oddsMultiplier > Math.random()) {
				this.ai.useSkill('necromancy');
				this.necromancyChance = 0.0;
			}
		}
	}
};

Robert2Strategy.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	if (userID == 'robert2') {
		if (skillID == 'necromancy') {
			this.isScottZombie = true;
			this.rezombieChance = 0.75;
		} else if (skillID == 'protectiveAura') {
			if (this.unit.mpPool.availableMP < 0.5 * this.unit.mpPool.capacity) {
				this.ai.useItem('redBull');
			} else {
				this.ai.useSkill('crackdown');
			}
		}
	}
};

Robert2Strategy.prototype.onUnitReady = function(unitID)
{
	this.turnCount[unitID] = !(unitID in this.turnCount) ? 1 : this.turnCount[unitID] + 1;
	if (unitID == 'robert2') {
		this.rezombieChance /= 2;
	} else if (unitID == 'scott') {
		if (this.isNecromancyReady) {
			--this.necromancyTurns;
		} else {
			this.necromancyChance = Math.max(this.necromancyChance - 0.05, 0.0);
		}
	}
};
