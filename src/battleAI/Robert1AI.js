/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// Robert1AI() constructor
// Creates an AI to control Robert Spellbinder in battle at Temple Manor.
// Arguments:
//     aiContext: The AI context hosting this AI.
function Robert1AI(aiContext)
{
	this.aic = aiContext;
	
	// HP thresholds for phase transitions
	this.phasePoints = from([2000, 1500]).select(function (v) {
		return Math.round(random.normal(v, 50));
	});
	
	// AI state variables
	this.phase = 0;
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('chargeSlash');
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
Robert1AI.prototype.dispose = function()
{
	
};

// .strategize() method
// Allows Robert to decide what he will do next when his turn arrives.
Robert1AI.prototype.strategize = function()
{				
	var milestone = from(this.phasePoints)
		.where(function(v) { return v >= this.aic.unit.hp; }.bind(this))
		.last();
	var phaseToEnter = 2 + this.phasePoints.indexOf(milestone);
	var lastPhase = this.phase;
	this.phase = Math.max(phaseToEnter, this.phase);
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('flare', 'lauren');
				this.aic.queueSkill('quake', 'lauren');
				this.aic.queueSkill('chill', 'lauren');
				this.aic.queueSkill('lightning', 'lauren');
				this.aic.queueSkill('crackdown', 'scott');
			} else {
			}
			break;
	}
};
