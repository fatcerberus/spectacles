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
	this.strategy = RNG.fromArray([ 'zombify', 'delude' ]);
	this.targetID = null;
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('tackle');
	
	// Additional initialization
	switch (this.strategy) {
		case 'zombify':
			this.deathBiteUsed = false;
			this.wasZombieCured = false;
			break;
		case 'delude':
			this.delusionUsed = false;
			break;
	}
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
LumisquirrelAI.prototype.dispose = function()
{
};

// .strategize() method
// Selects the Lumisquirrel's next move.
// Arguments:
//     stance: The Lumisquirrel's current battling stance.
LumisquirrelAI.prototype.strategize = function(stance)
{
	if (stance !== BattleStance.counter) {
		if (this.targetID === null) {
			this.targetID = Link(this.aic.battle.enemiesOf(this.aic.unit))
				.random(1)[0].id;
		}
		switch (this.strategy) {
			case 'zombify':
				var skillID;
				if (!this.deathBiteUsed) {
					skillID = 'deathBite';
					this.deathBiteUsed = true;
				} else if (this.wasZombieCured) {
					skillID = 'tackle';
					this.deathBiteUsed = false;
					this.wasZombieCured = false;
				} else {
					skillID = 'lightning';
				}
				this.aic.queueSkill(skillID, this.targetID);
				break;
			case 'delude':
				var skillID;
				if (!this.delusionUsed) {
					this.aic.queueSkill('delusion', this.targetID);
				} else {
					this.aic.setGuard();
				}
				break;
		}
	} else {
		this.aic.queueSkill('bite');
	}
};
