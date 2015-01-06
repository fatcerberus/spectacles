/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/



// LumisquirrelAI() constructor
// Creates an AI to control a Lumisquirrel in battle.
// Arguments:
//     aiContext: The AI context hosting this AI.
function LumisquirrelAI(aiContext)
{
	this.aic = aiContext;
	
	// AI state variables
	this.targetID = null;
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('bite');
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
LumisquirrelAI.prototype.dispose = function()
{
};

// .strategize() method
// Selects the enemy's next move.
LumisquirrelAI.prototype.strategize = function()
{
	if (targetID === null) {
		targetID = Link(this.aic.battle.enemiesOf(this.aic.unit)).random(1)[0].id;
		
	}
};
