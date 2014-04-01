/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function HHorseAI(context)
{
	this.context = context;
	this.unit = this.context.unit;
	this.unit.targeted.addHook(this, this.onTargeted);
	this.phase = 1;
	this.usedGhost = false;
};

// .strategize() method
// Queues up the enemy's next move(s).
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

// .onTargeted() event handler
// Performs processing when the controlled unit is targeted with an action.
HHorseAI.prototype.onTargeted = function(unit, action, actingUnit)
{
	var isPhysical = Link(action.effects)
		.filterBy('type', 'damage')
		.pluck('damageType')
		.contains('physical');
	if (isPhysical && unit.hasStatus('rearing')) {
		this.context.useSkill('flameBreath');
	}
};
