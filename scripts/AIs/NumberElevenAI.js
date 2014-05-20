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
	this.aic.battle.skillUsed.addHook(this, this.onSkillUsed);
	this.aic.battle.unitKilled.addHook(this, this.onUnitKilled);
	this.cadavers = [];
	this.isOmniPending = true;
	this.isOpenerPending = true;
	this.qsTarget = null;
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
NumberElevenAI.prototype.dispose = function()
{
	this.aic.battle.skillUsed.removeHook(this, this.onSkillUsed);
	this.aic.battle.unitKilled.removeHook(this, this.onUnitKilled);
};

// .strategize() method
// Allows Scott to decide what he will do next when his turn arrives.
NumberElevenAI.prototype.strategize = function()
{
	if (this.isOpenerPending) {
		this.isOpenerPending = false;
		this.aic.queueSkill('berserkCharge');
	} else {
		if (this.qsTarget !== null) {
			var qsTurns = this.aic.predictSkillTurns('quickstrike');
			var skillID = qsTurns[0].unit === this.aic.unit ? 'quickstrike' : 'swordSlash';
			this.aic.queueSkill(skillID, this.qsTarget);
			this.qsTarget = skillID == 'quickstrike' ? this.qsTarget : null;
		} else if (this.cadavers.length > 1 && this.isOmniPending) {
			this.isOmniPending = false;
			this.aic.queueSkill('omni');
		} else {
			this.aic.queueSkill('swordSlash');
		}
		if (this.cadavers.length < 2) {
			this.isOmniPending = true;
		}
	}
};

NumberElevenAI.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	if (this.aic.unit.hasStatus('offGuard')) {
		return;
	}
	if (Link(targetIDs).contains('numberEleven')) {
		if (skillID == 'omni') {
			if (this.qsTarget !== null) {
				this.qsTarget = userID;
			} else {
				this.aic.queueSkill('inferno');
			}
		} else if (skillID == 'sharpshooter') {
			this.qsTarget = userID;
		}
	}
};

NumberElevenAI.prototype.onUnitKilled = function(unitID)
{
	this.cadavers.push(unitID);
};
