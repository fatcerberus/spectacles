/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function HeadlessHorseAI(battle, unit, aiContext)
{
	this.battle = battle;
	this.unit = unit;
	this.ai = aiContext;
	this.damageTaken = {};
	this.phase = 0;
	this.usedGhost = false;
	
	this.battle.unitDamaged.addHook(this, this.onUnitDamaged);
	this.battle.unitTargeted.addHook(this, this.onUnitTargeted);
}

HeadlessHorseAI.prototype.dispose = function()
{
	this.battle.unitDamaged.removeHook(this, this.onUnitDamaged);
	this.battle.unitTargeted.removeHook(this, this.onUnitTargeted);
};

// .strategize() method
// Decides the enemy's next move(s).
HeadlessHorseAI.prototype.strategize = function()
{				
	var lastPhase = this.phase;
	var phaseToEnter = this.unit.getHealth() > 50 ? 1 
		: this.unit.getHealth() > 10 ? 2
		: 3;
	this.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter;
	if (this.phase == 1) {
		if (this.phase > lastPhase) {
			this.ai.useSkill('flameBreath');
		} else {
			var kickTurns = this.ai.predictSkillTurns('rearingKick');
			var isThePigUpSoon = Link(kickTurns).pluck('unit').pluck('id').first(3).contains('maggie');
			this.ai.useSkill(isThePigUpSoon ? 'flare' : 'rearingKick')
		}
	} else if (this.phase == 2) {
		if (!this.usedGhost) {
			this.usedGhost = true;
			this.ai.useSkill('spectralDraw');
		} else {
			this.ai.useSkill('spectralKick');
		}
	} else if (this.phase == 3) {
		if (this.phase > lastPhase) {
			this.ai.useSkill('hellfire', 'headlessHorse');
		} else {
			this.ai.useSkill('flare');
		}
	}
};

// .onUnitDamaged() event handler
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
// Performs processing when unit in the battle is targeted by an action.
// Arguments:
//     unit:       The unit who was targeted.
//     action:     The action to be performed on the targeted unit.
//     actingUnit: The unit performing the action.
HeadlessHorseAI.prototype.onUnitTargeted = function(unit, action, actingUnit)
{
	if (unit === this.unit && this.phase == 1) {
		var isPhysical = Link(action.effects)
			.filterBy('type', 'damage')
			.pluck('damageType')
			.contains('physical');
		if (isPhysical && unit.hasStatus('rearing')) {
			this.ai.useSkill('trample', actingUnit.id);
		}
	}
};
