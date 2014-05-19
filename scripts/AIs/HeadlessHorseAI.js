/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// HeadlessHorseAI() constructor
// Creates an AI to control the Headless Horse in battle.
// Arguments:
//     battle:    The battle session this AI is participating in.
//     unit:      The battle unit to be controlled by this AI.
//     aiContext: The AI context that this AI will execute under.
function HeadlessHorseAI(aiContext)
{
	this.aic = aiContext;
	this.damageTaken = {};
	this.phase = 0;
	this.phaseThreshold = Math.round(500 + 100 * (0.5 - Math.random()));
	this.spectralDrawPending = true;
	this.trampleTarget = null;
	
	this.aic.battle.itemUsed.addHook(this, this.onItemUsed);
	this.aic.battle.skillUsed.addHook(this, this.onSkillUsed);
	this.aic.battle.unitDamaged.addHook(this, this.onUnitDamaged);
	this.aic.battle.unitReady.addHook(this, this.onUnitReady);
	this.aic.battle.unitTargeted.addHook(this, this.onUnitTargeted);
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
HeadlessHorseAI.prototype.dispose = function()
{
	this.aic.battle.itemUsed.removeHook(this, this.onItemUsed);
	this.aic.battle.skillUsed.removeHook(this, this.onSkillUsed);
	this.aic.battle.unitDamaged.removeHook(this, this.onUnitDamaged);
	this.aic.battle.unitReady.removeHook(this, this.onUnitReady);
	this.aic.battle.unitTargeted.removeHook(this, this.onUnitTargeted);
};

// .strategize() method
// Decides the enemy's next move(s).
HeadlessHorseAI.prototype.strategize = function()
{				
	var lastPhase = this.phase;
	var phaseToEnter = this.aic.unit.hp > this.phaseThreshold ? 1 : 2;
	this.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter;
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('flameBreath');
			} else {
				var kickTurns = this.aic.predictSkillTurns('rearingKick');
				var hellfireTurns = this.aic.predictSkillTurns('hellfire');
				if (!this.aic.unit.hasStatus('ignite')) {
					this.aic.queueSkill('hellfire', 'headlessHorse');
					if (Link(hellfireTurns).pluck('unit').pluck('id').contains('elysia')) {
						this.aic.queueSkill('spectralDraw', 'elysia');
					}
				} else {
					this.aic.queueSkill('rearingKick');
				}
			}
			break;
		case 2:
			if (this.spectralDrawPending) {
				this.ghostTargetID = null;
				var maxValue = 0;
				for (unitID in this.damageTaken) {
					if (this.damageTaken[unitID] > maxValue) {
						this.ghostTargetID = unitID;
						maxValue = this.damageTaken[unitID];
					} else if (this.damageTaken[unitID] == maxValue && 0.5 > Math.random()) {
						this.ghostTargetID = unitID;
					}
				}
				this.aic.queueSkill('spectralDraw', this.ghostTargetID);
				this.spectralDrawPending = false;
				this.trampleTarget = null;
			} else {
				this.aic.queueSkill('flare');
			}
			break;
	}
};

// .onItemUsed() event handler
// Allows the Headless Horse to react when someone uses an item.
HeadlessHorseAI.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
};

// .onSkillUsed() event handler
// Allows the Headless Horse to react when someone attacks.
HeadlessHorseAI.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	if (Link(targetIDs).contains('headlessHorse')) {
		var iceSkills = [ 'chillShot', 'chill', 'windchill' ];
		if (Link(iceSkills).contains(skillID) && (this.aic.unit.hasStatus('ignite') || this.aic.unit.hasStatus('rearing'))) {
			this.trampleTarget = userID;
		}
	}
};

// .onUnitDamaged() event handler
// Allows the Headless Horse to react when someone takes damage.
HeadlessHorseAI.prototype.onUnitDamaged = function(unit, amount, tags, attacker)
{
	if (unit === this.aic.unit && attacker !== null) {
		if (!(attacker.id in this.damageTaken)) {
			this.damageTaken[attacker.id] = 0;
		}
		this.damageTaken[attacker.id] += amount;
	}
};

// .onUnitReady() event handler
// Allows the Headless Horse to react when a battler's turn arrives.
HeadlessHorseAI.prototype.onUnitReady = function(unitID)
{
	if (unitID == 'headlessHorse' && !this.aic.hasMovesQueued() && this.phase > 0) {
		if (this.trampleTarget !== null) {
			this.aic.queueSkill('trample', this.trampleTarget);
			this.trampleTarget = null;
		}
	}
};

// .onUnitTargeted() event handler
// Allows the Headless Horse to react when someone is targeted by a battler action.
// Arguments:
//     unit:       The unit who was targeted.
//     action:     The action to be performed on the targeted unit.
//     actingUnit: The unit performing the action.
HeadlessHorseAI.prototype.onUnitTargeted = function(unit, action, actingUnit)
{
	if (unit === this.aic.unit) {
		var isPhysical = Link(action.effects).filterBy('type', 'damage').pluck('damageType').contains('physical')
		                 || Link(action.effects).filterBy('type', 'damage').pluck('element').contains('earth');
		if (isPhysical && this.aic.unit.hasStatus('rearing')) {
			if (this.trampleTarget === null) {
				this.aic.queueSkill('flameBreath');
			} else if (this.trampleTarget !== null) {
				this.trampleTarget = actingUnit.id;
			}
		}
		var isMagic = Link(action.effects).filterBy('type', 'damage').pluck('damageType').contains('magic');
		if (isMagic && this.aic.unit.hasStatus('ghost') && actingUnit.id != this.ghostTargetID) {
			this.aic.queueSkill('spectralKick', actingUnit.id);
		}
	}
};
