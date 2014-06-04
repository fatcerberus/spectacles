/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// ScottStarcrossAI() constructor
// Creates an AI to control Scott Starcross in the Spectacles III final battle.
// Arguments:
//     battle:    The battle session this AI is participating in.
//     unit:      The battle unit to be controlled by this AI.
//     aiContext: The AI context that this AI will execute under.
function ScottStarcrossAI(aiContext)
{
	this.aic = aiContext;
	
	// AI state variables
	this.comboStarter = null;
	this.isOpenerPending = true;
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
ScottStarcrossAI.prototype.dispose = function()
{
};

// .selectMove() method
// Selects a random move from Scott's move pool.
ScottStarcrossAI.prototype.selectMove = function()
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
ScottStarcrossAI.prototype.strategize = function()
{
	if (this.isOpenerPending) {
		this.isOpenerPending = false;
		this.aic.queueSkill('berserkCharge');
	} else {
		var health = this.aic.unit.getHealth();
		var skillToUse = health > 10 ? 'chargeSlash' : 'berserkCharge';
		var target1ID = RandomOf('bruce', 'robert');
		var target2ID = target1ID != 'bruce' ? 'bruce' : 'robert';
		if (skillToUse != 'berserkCharge') {
			this.aic.queueSkill(skillToUse, target1ID);
		} else {
			this.aic.queueSkill(skillToUse);
		}
		this.aic.queueSkill('omni', target1ID);
		var comboID = Math.min(Math.floor(Math.random() * 2), 1);
		switch (comboID) {
			case 0:
				this.aic.queueSkill(health > 60 ? 'necromancy' : this.health > 25 ? 'electrocute' : 'discharge', target1ID);
				this.aic.queueSkill(health > 50 ? 'flare' : 'hellfire', target2ID);
				this.aic.queueSkill(health > 50 ? 'chill' : 'windchill', target2ID);
				this.aic.queueSkill(health > 40 ? 'heal' : health > 10 ? 'rejuvenate' : 'renewal', target1ID);
				break;
			case 1:
				this.aic.queueSkill(health > 50 ? 'lightning' : 'electrocute', target2ID);
				this.aic.queueSkill('hellfire', target1ID);
				this.aic.queueSkill('windchill', target1ID);
				break;
		}
	}
};
