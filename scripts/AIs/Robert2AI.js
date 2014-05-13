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
	this.hasBeenZombieHealed = false;
	this.hasZombieHealedSelf = false;
	this.isAlcoholPending = false;
	this.isAlcoholUsed = false;
	this.isNecroTonicItemPending = false;
	this.isNecromancyPending = false;
	this.isScottZombie = false;
	this.necroTonicItem = null;
	this.necroTonicItemTarget = null
	this.necromancyChance = 0.0;
	this.nextElementalMove = null;
	this.phase = 0;
	this.rezombieChance = 0.0;
	this.scottStance = BattleStance.attack;
	this.scottImmuneTurnsLeft = 0;
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
	if (this.isAlcoholUsed) {
		phaseToEnter = 5;
	}
	this.phase = Math.max(phaseToEnter, lastPhase);
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
							this.ai.useSkill('swordSlash');
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
				this.isStatusHealPending =
					(this.unit.hasStatus('frostbite') || this.unit.hasStatus('ignite'))
					&& this.isStatusHealPending;
				var qsTurns = this.ai.predictSkillTurns('quickstrike');
				if (this.isStatusHealPending && this.hasZombieHealedSelf
				    && !this.wasHolyWaterUsed && this.unit.hasStatus('zombie') && this.ai.isItemUsable('holyWater'))
				{
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
					var isTonicUsable = (!this.unit.hasStatus('zombie') || this.wasHolyWaterUsed || !this.hasZombieHealedSelf)
						&& this.ai.isItemUsable('tonic');
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
					this.ai.useSkill(skillToUse);
					if (skillToUse == 'quake') {
						this.ai.useSkill('upheaval');
					}
					this.isComboStarted = false;
					this.isStatusHealPending = skillToUse == 'quake';
					this.wasHolyWaterUsed = false;
				} else {
					var spells = [ 'flare', 'chill', 'lightning', 'quake' ];
					var skillToUse = spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)];
					this.ai.useSkill(skillToUse);
					if (skillToUse == 'quake') {
						this.ai.useSkill('upheaval');
					}
					this.isStatusHealPending = skillToUse == 'quake';
					this.wasHolyWaterUsed = false;
				}
			}
			break;
		case 3:
			if (this.phase > lastPhase) {
				this.ai.useSkill('protectiveAura');
				if (this.ai.isItemUsable('vaccine')) {
					this.ai.useItem('vaccine');
				}
				this.doChargeSlashNext = false;
				this.elementalsTillRevenge = 2;
				this.isComboStarted = false;
			} else {
				var holyWaterTurns = this.ai.predictItemTurns('holyWater');
				if (this.unit.hasStatus('zombie') && this.hasZombieHealedSelf
				    && this.ai.isItemUsable('holyWater') && this.ai.isItemUsable('tonic')
				    && holyWaterTurns[0].unit === this.unit)
				{
					this.ai.useItem('holyWater');
					this.ai.useItem('tonic');
				} else if (this.unit.mpPool.availableMP < 0.25 * this.unit.mpPool.capacity && this.ai.isItemUsable('redBull')) {
					this.ai.useItem('redBull');
				} else if ((this.unit.hasStatus('ignite') || this.unit.hasStatus('frostbite')) && this.elementalsTillRevenge > 0) {
					--this.elementalsTillRevenge;
					if (this.elementalsTillRevenge <= 0) {
						if (this.ai.isSkillUsable('electrocute')) {
							this.ai.useSkill('electrocute');
							this.necroTonicItem = 'tonic';
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
				} else if (0.5 > Math.random() || this.isComboStarted) {
					var forecast = this.ai.predictSkillTurns('chargeSlash');
					if ((forecast[0].unit === this.unit && !this.isComboStarted) || this.doChargeSlashNext) {
						this.isComboStarted = false;
						if (forecast[0].unit === this.unit) {
							this.ai.useSkill('chargeSlash');
						} else {
							var spells = [ 'hellfire', 'windchill' ];
							var randomSkillID = spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)];
							this.ai.useSkill(this.nextElementalMove !== null ? this.nextElementalMove : randomSkillID);
						}
					} else {
						this.isComboStarted = true;
						forecast = this.ai.predictSkillTurns('quickstrike');
						if (forecast[0].unit === this.unit) {
							this.ai.useSkill('quickstrike');
						} else {
							var skillToUse = 0.5 > Math.random() ? 'quake' : 'swordSlash';
							if (this.ai.isSkillUsable(skillToUse)) {
								this.ai.useSkill(skillToUse);
								if (skillToUse == 'quake') {
									this.ai.useSkill('upheaval');
								}
								this.doChargeSlashNext = skillID == 'swordSlash';
								this.isComboStarted = false;
							} else {
								this.ai.useSkill('swordSlash');
								this.doChargeSlashNext = true;
								this.isComboStarted = false;
							}
						}
					}
				} else {
					var spells = [ 'flare', 'chill', 'lightning', 'quake' ];
					var skillID = spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)]
					this.ai.useSkill(skillID);
					if (skillID == 'quake') {
						this.ai.useSkill('upheaval');
					}
				}
			}
			break;
		case 4:
			if (this.phase > lastPhase) {
				this.ai.useSkill('desperationSlash');
				this.isAlcoholPending = true;
				this.isHolyWaterPending = this.ai.isItemUsable('holyWater');
			} else {
				if (this.isAlcoholPending) {
					if (this.isHolyWaterPending && this.unit.hasStatus('zombie')) {
						this.ai.useItem('holyWater');
						this.isHolyWaterPending = false;
					} else if (this.unit.hasStatus('zombie')) {
						if (this.ai.isItemUsable('redBull')) {
							this.ai.useItem('redBull');
						}
						this.ai.useSkill('hellfire');
						this.ai.useSkill('upheaval');
						this.ai.useSkill('windchill');
						this.ai.useSkill('electrocute');
						this.ai.useSkill('omni');
						this.ai.useSkill('chargeSlash');
						this.isAlcoholPending = false;
					} else {
						this.ai.useItem('alcohol');
					}
				} else {
					if (0.5 > Math.random()) {
						this.ai.useSkill('chargeSlash');
					} else {
						var spells = [ 'hellfire', 'windchill', 'electrocute', 'upheaval' ];
						var skillID = spells[Math.min(Math.floor(Math.random() * spells.length), spells.length - 1)];
						if (0.5 > Math.random() && this.ai.isSkillUsable(skillID)) {
							this.ai.useSkill(skillID);
						} else if (!this.unit.hasStatus('disarray')) {
							var qsTurns = this.ai.predictSkillTurns('quickstrike');
							this.ai.useSkill(qsTurns[0].unit == this.unit ? 'quickstrike' : 'swordSlash');
						} else {
							this.ai.useSkill('swordSlash');
						}
					}
				}
			}
			break;
		case 5:
			if (this.phase > lastPhase) {
				this.ai.useSkill('chargeSlash');
				this.ai.useSkill('flare');
				this.ai.useSkill('quake');
				this.ai.useSkill('chill');
				this.ai.useSkill('lightning');
				this.ai.useSkill('swordSlash');
				this.ai.useSkill('hellfire');
				this.ai.useSkill('upheaval');
				this.ai.useSkill('windchill');
				this.ai.useSkill('electrocute');
				this.ai.useSkill('swordSlash');
				this.ai.useSkill('omni');
				this.ai.useSkill('chargeSlash');
			} else {
				var qsTurns = this.ai.predictSkillTurns('quickstrike');
				this.ai.useSkill(qsTurns[0].unit === this.unit ? 'quickstrike' : 'swordSlash');
			}
	}
};

// .onItemUsed() event handler
// Allows Robert to react when someone in the battle uses an item.
Robert2AI.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
	if (this.unit.hasStatus('drunk') || this.unit.hasStatus('offGuard')) {
		return;
	}
	var curativeIDs = [ 'tonic', 'powerTonic' ];
	if (userID == 'robert2' && (itemID == 'tonic' || itemID == 'powerTonic') && this.unit.hasStatus('zombie')
	    && Link(targetIDs).contains('robert2') && this.phase <= 4)
	{
		if (this.zombieHealFixState === null && this.ai.isItemUsable('holyWater')) {
			this.ai.useItem('holyWater');
			this.hasZombieHealedSelf = true;
		}
	} else if (userID == 'robert2' && itemID == 'alcohol' && Link(targetIDs).contains('robert2')) {
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
			.playBGM("BasicInstinct")
			.adjustBGM(1.0)
			.talk("Robert", true, 2.0, "If that's how you want it, then so be it.")
			.run(true);
		this.isAlcoholUsed = true;
		this.isAlcoholPending = false;
	} else if (userID == 'scott' && Link(targetIDs).contains('robert2')) {
		if (this.phase <= 4 && Link(curativeIDs).contains(itemID) && this.unit.hasStatus('zombie') && this.zombieHealFixState === null) {
			this.zombieHealFixState = 'fixStatus';
			if (this.hasBeenZombieHealed && this.ai.itemsLeft('alcohol') <= 1
			    || !this.ai.isItemUsable('vaccine') && !this.ai.isItemUsable('holyWater'))
			{
				this.zombieHealFixState = 'retaliate';
			}
		}
	} else if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		if (itemID == 'vaccine' && this.scottImmuneTurnsLeft == 0) {
			this.isScottZombie = false;
			this.scottImmuneTurnsLeft = 6;
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
				this.ai.useSkill(this.phase <= 2 ? 'necromancy' : 'electrocute');
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
			this.isScottZombie = (skillID == 'necromancy' || skillID == 'electrocute' && this.scottStance != BattleStance.guard)
				&& this.scottImmuneTurnsLeft <= 0;
			this.isNecroTonicItemPending = this.isScottZombie && this.necroTonicItem !== null
				&& this.ai.isItemUsable(this.necroTonicItem);
			if (this.isScottZombie) {
				this.rezombieChance = 1.0;
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
					this.ai.useItem(this.hasBeenZombieHealed && this.ai.isItemUsable('vaccine') ? 'vaccine' : 'holyWater');
					this.zombieHealFixState = 'retaliate';
					break;
				case 'retaliate':
					var alcoholLeft = this.ai.itemsLeft('alcohol');
					if (!this.hasBeenZombieHealed && this.ai.isSkillUsable('electrocute')
					    && this.ai.isItemUsable('tonic'))
					{
						this.ai.useSkill('electrocute');
						this.necroTonicItem = 'tonic';
					} else if (this.ai.itemsLeft('alcohol') > 1) {
						this.ai.useItem('alcohol', 'scott');
						this.ai.useSkill('upheaval');
					} else {
						if (this.ai.isItemUsable('redBull')) {
							this.ai.useItem('redBull');
						}
						this.ai.useSkill('omni');
					}
					this.zombieHealFixState = 'finish';
					break;
				case 'finish':
					this.hasBeenZombieHealed = true;
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
