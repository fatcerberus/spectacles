/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2012 Power-Command
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
	this.aic.battle.itemUsed.add(this.onItemUsed, this);
	this.aic.battle.skillUsed.add(this.onSkillUsed, this);
	this.aic.battle.unitDamaged.add(this.onUnitDamaged, this);
	this.aic.battle.unitReady.add(this.onUnitReady, this);
	this.aic.battle.unitTargeted.add(this.onUnitTargeted, this);

	// HP thresholds for phase transitions
	this.phasePoints = [ 500 ];  // (starting with P2)
	for (let i = 0; i < this.phasePoints.length; ++i) {
		this.phasePoints[i] = Math.round(this.phasePoints[i] + 100 * (0.5 - Math.random()));
	}
	
	// AI state variables
	this.phase = 0;
	this.damageTaken = {};
	this.ghosts = [];
	this.spectralDrawPending = true;
	this.trampleTarget = null;
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('trample');
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
HeadlessHorseAI.prototype.dispose = function()
{
	this.aic.battle.itemUsed.remove(this.onItemUsed, this);
	this.aic.battle.skillUsed.remove(this.onSkillUsed, this);
	this.aic.battle.unitDamaged.remove(this.onUnitDamaged, this);
	this.aic.battle.unitReady.remove(this.onUnitReady, this);
	this.aic.battle.unitTargeted.remove(this.onUnitTargeted, this);
};

// .strategize() method
// Decides the enemy's next move(s).
HeadlessHorseAI.prototype.strategize = function()
{				
	var lastPhase = this.phase;
	var phaseToEnter = this.aic.unit.hp > this.phasePoints[0] ? 1 : 2;
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
					if (from(hellfireTurns)
						.mapTo(it => it.unit.id)
						.anyIs('elysia'))
					{
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
	if (from(targetIDs).anyIs('headlessHorse')) {
		var iceSkills = [ 'chillShot', 'chill', 'windchill' ];
		if (from(iceSkills).anyIs(skillID) && (this.aic.unit.hasStatus('ignite') || this.aic.unit.hasStatus('rearing'))) {
			this.trampleTarget = userID;
		}
	}
};

// .onUnitDamaged() event handler
// Allows the Headless Horse to react when someone takes damage.
HeadlessHorseAI.prototype.onUnitDamaged = function(unit, amount, tags, actingUnit)
{
	if (unit === this.aic.unit && actingUnit !== null) {
		if (from(tags).anyIs('magic') && from(this.ghosts).anyIs(actingUnit.id)) {
			this.aic.queueSkill('spectralKick', actingUnit.id);
		}
		if (!(actingUnit.id in this.damageTaken)) {
			this.damageTaken[actingUnit.id] = 0;
		}
		this.damageTaken[actingUnit.id] += amount;
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
		var isPhysical = from(action.effects)
			.where(it => it.type === 'damage')
			.any(it => it.damageType === 'physical' || it.element === 'earth')
		if (isPhysical && this.aic.unit.hasStatus('rearing')) {
			if (this.trampleTarget === null) {
				this.aic.queueSkill('flameBreath');
			} else if (this.trampleTarget !== null) {
				this.trampleTarget = actingUnit.id;
			}
		}
		var isMagic = from(action.effects)
			.where(it => it.type === 'damage')
			.mapTo(it => it.damageType)
			.anyIs('magic');
		if (isMagic && this.aic.unit.hasStatus('ghost') && actingUnit.id != this.ghostTargetID) {
			this.aic.queueSkill('spectralKick', actingUnit.id);
		}
	}
};