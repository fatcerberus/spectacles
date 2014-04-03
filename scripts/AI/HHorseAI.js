/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function HHorseAI(battle, unit, context)
{
	this.battle = battle;
	this.unit = unit;
	this.context = context;
	this.battle.unitTargeted.addHook(this, this.onUnitTargeted);
	this.phase = 1;
	this.usedGhost = false;
}

// .strategize() method
// Decides the enemy's next move(s).
HHorseAI.prototype.strategize = function()
{				
	var phaseToEnter = this.unit.getHealth() > 50 ? 1 : 2;
	this.phase = this.phase > phaseToEnter ? this.phase : phaseToEnter;
	if (this.phase == 1) {
		if (this.context.turnsTaken % 3 == 0) {
			if (this.context.turnsTaken == 0) {
				this.context.useSkill('rearingKick', 'maggie');
			}
		} else {
			this.context.useSkill('flare');
		}
	} else if (this.phase == 2) {
		if (!this.usedGhost) {
			this.usedGhost = true;
			this.context.useSkill('spectralDraw');
		} else {
			
		}
	}
};

// .onUnitTargeted() event handler
// Performs processing when unit in the battle is targeted by an action.
// Arguments:
//     unit:       The unit who was targeted.
//     action:     The action to be performed on the targeted unit.
//     actingUnit: The unit performing the action.
HHorseAI.prototype.onUnitTargeted = function(unit, action, actingUnit)
{
	if (unit === this.unit && this.phase == 1) {
		var isPhysical = Link(action.effects)
			.filterBy('type', 'damage')
			.pluck('damageType')
			.contains('physical');
		if (isPhysical && unit.hasStatus('rearing')) {
			this.context.useSkill('flameBreath');
		}
	}
};
