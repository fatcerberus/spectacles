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
	var moveSet = [
		'necromancy', 'crackdown',
		'swordSlash', 'quickstrike', 'chargeSlash',
		'flare', 'chill', 'lightning', 'quake',
		'hellfire', 'windchill', 'electrocute', 'upheaval',
		'inferno', 'subzero', 'storm', 'tenFive',
		'omni' ];
	this.movePool = Link.create(moveSet.length, function(index) {
		return { skillID: moveSet[index], weight: 50 };
	});
	this.isOpenerPending = true;
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
NumberElevenAI.prototype.dispose = function()
{
};

NumberElevenAI.prototype.selectAttack = function()
{
	var weightTotal = 0;
	Link(this.movePool).each(function(move) {
		weightTotal += move.weight;
	});
	var selector = Math.min(Math.floor(Math.random() * weightTotal), weightTotal - 1);
	
};

// .strategize() method
// Allows Scott to decide what he will do next when his turn arrives.
NumberElevenAI.prototype.strategize = function()
{
	this.aic.queueSkill(this.aic.isSkillUsable('omni') ? 'omni' : 'swordSlash');
};
