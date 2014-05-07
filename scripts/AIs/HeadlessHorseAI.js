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
function HeadlessHorseAI(battle, unit, aiContext)
{
	this.battle = battle;
	this.unit = unit;
	this.ai = aiContext;
	this.damageTaken = {};
	this.phase = 0;
	this.phaseThreshold = Math.round(500 + 100 * (0.5 - Math.random()));
	this.spectralDrawPending = true;
	this.trampleTarget = null;
	
	this.battle.itemUsed.addHook(this, this.onItemUsed);
	this.battle.unitDamaged.addHook(this, this.onUnitDamaged);
	this.battle.unitTargeted.addHook(this, this.onUnitTargeted);
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
HeadlessHorseAI.prototype.dispose = function()
{
	this.battle.itemUsed.removeHook(this, this.onItemUsed);
	this.battle.unitDamaged.removeHook(this, this.onUnitDamaged);
	this.battle.unitTargeted.removeHook(this, this.onUnitTargeted);
};

// .strategize() method
// Decides the enemy's next move(s).
HeadlessHorseAI.prototype.strategize = function()
{				
	var lastPhase = this.phase;
	var phaseToEnter = this.unit.hp > this.phaseThreshold ? 1 : 2;
	this.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter;
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.ai.useSkill('flameBreath');
			} else {
				var kickTurns = this.ai.predictSkillTurns('rearingKick');
				var hellfireTurns = this.ai.predictSkillTurns('hellfire');
				if (this.trampleTarget !== null && this.unit.hasStatus('ignite')) {
					this.ai.useSkill('trample', this.trampleTarget);
				} else if (!this.unit.hasStatus('ignite')) {
					this.ai.useSkill('hellfire', 'headlessHorse');
					if (Link(hellfireTurns).pluck('unit').pluck('id').contains('elysia')) {
						this.ai.useSkill('spectralDraw', 'elysia');
					}
				} else {
					if (0.5 > Math.random()) {
						this.ai.useSkill('rearingKick');
					} else {
						this.ai.useSkill('flare');
					}
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
				this.ai.useSkill('spectralDraw', this.ghostTargetID);
				this.spectralDrawPending = false;
				this.trampleTarget = null;
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
	if (skillID == 'flareShot' && Link(targetIDs).contains('headlessHorse')) {
		this.ai.trampleTarget = userID;
	}
};

// .onUnitDamaged() event handler
// Allows the Headless Horse to react when someone takes damage.
HeadlessHorseAI.prototype.onUnitDamaged = function(unit, amount, attacker)
{
	if (unit === this.unit && attacker !== null) {
		if (!(attacker.id in this.damageTaken)) {
			this.damageTaken[attacker.id] = 0;
		}
		this.damageTaken[attacker.id] += amount;
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
	if (unit === this.unit) {
		var isMagic = Link(action.effects).filterBy('type', 'damage').pluck('damageType').contains('magic');
		var isPhysical = Link(action.effects).filterBy('type', 'damage').pluck('damageType').contains('physical');
		if (isPhysical && unit.hasStatus('rearing')) {
			this.ai.useSkill('flameBreath');
		} else if (isMagic && this.unit.hasStatus('ghost') && actingUnit.id != this.ghostTargetID) {
			this.ai.useSkill('spectralKick', actingUnit.id);
		}
	}
};
