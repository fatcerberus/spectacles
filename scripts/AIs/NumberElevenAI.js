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
	this.movePool = [
		{ id: 'omni', weight: 1 },
		{ id: 'necromancy', weight: 3 },
		{ id: 'crackdown', weight: 2 },
		{ id: 'inferno', weight: 5 },
		{ id: 'subzero', weight: 3 },
		{ id: 'zappyTimes', weight: 2 },
		{ id: 'tenPointFive', weight: 4 },
		{ id: 'hellfire', weight: 7 },
		{ id: 'windchill', weight: 5 },
		{ id: 'electrocute', weight: 3 },
		{ id: 'upheaval', weight: 5 },
		{ id: 'flare', weight: 6 },
		{ id: 'chill', weight: 6 },
		{ id: 'lightning', weight: 7 },
		{ id: 'quake', weight: 6 },
		{ id: 'berserkCharge', weight: 2 },
		{ id: 'swordSlash', weight: 15 },
		{ id: 'quickstrike', weight: 10 },
		{ id: 'chargeSlash', weight: 8 },
	];
	
	this.aic = aiContext;
	this.aic.battle.skillUsed.addHook(this, this.onSkillUsed);
	this.aic.battle.unitKilled.addHook(this, this.onUnitKilled);
	this.cadavers = [];
	this.isOpenerPending = true;
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
NumberElevenAI.prototype.dispose = function()
{
	this.aic.battle.skillUsed.removeHook(this, this.onSkillUsed);
	this.aic.battle.unitKilled.removeHook(this, this.onUnitKilled);
};

// .selectMove() method
// Selects a random move from Scott's move pool.
NumberElevenAI.prototype.selectMove = function()
{
	var weightSum = Link(this.movePool)
		.reduce(function(value, item)
	{
		return value + item.weight;
	}, 0);
	var selector = Math.min(Math.floor(Math.random() * weightSum), weightSum - 1);
	var move = Link(this.movePool).first(function(item) {
		selector -= item.weight;
		return selector < 0;
	});
	return move.id;
};

// .strategize() method
// Allows Scott to decide what he will do next when his turn arrives.
NumberElevenAI.prototype.strategize = function()
{
	if (this.isOpenerPending) {
		this.isOpenerPending = false;
		this.aic.queueSkill('berserkCharge');
	} else {
		var skillID = this.selectMove();
		this.aic.queueSkill(skillID);
	}
};

NumberElevenAI.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	
};

NumberElevenAI.prototype.onUnitKilled = function(unitID)
{
	this.cadavers.push(unitID);
};
