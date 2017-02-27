/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// VictorAI() constructor
// Creates an AI to control Victor Spellbinder in battle at Temple Manor.
// Arguments:
//     aiContext: The AI context hosting this AI.
function VictorAI(aiContext)
{
	this.aic = aiContext;
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('swordSlash');
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
VictorAI.prototype.dispose = function()
{
	
};

// .strategize() method
// Decides what Victor will do next.
VictorAI.prototype.strategize = function(phase)
{				
};
