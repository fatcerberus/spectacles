/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// ScottTempleAI() constructor
// Creates an AI to control Scott Temple in battle in Spectacles III.
// Arguments:
//     aiContext: The AI context hosting this AI.
function ScottTempleAI(aiContext)
{
	this.aic = aiContext;
	this.phase = 0;
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
ScottTempleAI.prototype.dispose = function()
{
	
};

// .strategize() method
// Determines what Scott Temple will do when his turn arrives.
ScottTempleAI.prototype.strategize = function()
{
	var lastPhase = this.phase;
	var phaseToEnter =
		this.aic.unit.getHealth() > 50 ? 1
		: 2;
	this.phase = phaseToEnter > lastPhase ? phaseToEnter : lastPhase;
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('omni');
				this.aic.queueSkill(RandomOf('inferno', 'subzero', 'discharge', 'tenPointFive'));
			} else {
				
			}
			break;
		case 2:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('rejuvenate');
			} else {
				
			}
	}
};
