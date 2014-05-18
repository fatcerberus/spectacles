/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// NumberElevenAI() constructor
// Creates an AI to control Scott Starcross in the Spectacles III final battle.
// Arguments:
//     battle:    The battle session this AI is participating in.
//     unit:      The battle unit to be controlled by this AI.
//     aiContext: The AI context that this AI will execute under.
function NumberElevenAI(aiContext)
{
	this.aic = aiContext;
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
NumberElevenAI.prototype.dispose = function()
{
};

// .strategize() method
// Allows Scott to decide what he will do next when his turn arrives.
NumberElevenAI.prototype.strategize = function()
{
	this.aic.queueSkill('swordSlash');
};
