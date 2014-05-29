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
	this.aic.battle.itemUsed.addHook(this, this.onItemUsed);
	this.aic.battle.skillUsed.addHook(this, this.onSkillUsed);
	this.phase = 0;
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
ScottTempleAI.prototype.dispose = function()
{
	this.aic.battle.itemUsed.removeHook(this, this.onItemUsed);
	this.aic.battle.skillUsed.removeHook(this, this.onSkillUsed);
};

// .strategize() method
// Determines what Scott Temple will do when his turn arrives.
ScottTempleAI.prototype.strategize = function()
{
	var lastPhase = this.phase;
	var phaseToEnter =
		this.aic.unit.getHealth() > 65 ? 1
		: this.aic.unit.getHealth() > 25 ? 2
		: 3;
	this.phase = phaseToEnter > lastPhase ? phaseToEnter : lastPhase;
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('omni');
				this.aic.queueSkill(RandomOf('inferno', 'subzero'));
				this.aic.queueSkill('chargeSlash');
			} else {
				var qsTurns = this.aic.predictSkillTurns('quickstrike');
				if (qsTurns[0].unit === this.aic.unit) {
					this.aic.queueSkill('quickstrike');
				} else if (0.25 > Math.random()) {
					if (this.aic.battle.hasCondition('inferno')) {
						this.aic.queueSkill('hellfire');
					} else if (this.aic.battle.hasCondition('subzero')) {
						this.aic.queueSkill('windchill');
					} else {
						this.aic.queueSkill(RandomOf('inferno', 'subzero'));
					}
				} else {
					this.aic.queueSkill(RandomOf('flare', 'chill', 'lightning', 'quake', 'heal'));
				}
			}
			break;
		case 2:
			if (this.phase > lastPhase) {
				if (this.aic.battle.hasCondition('inferno')) {
					this.aic.queueSkill('subzero');
				} else {
					this.aic.queueSkill('inferno');
				}
				this.aic.queueSkill('rejuvenate');
			} else {
				if (!this.aic.battle.hasCondition('generalDisarray')
					&& !this.aic.battle.hasCondition('thunderstorm')
					&& 0.25 > Math.random())
				{
					this.aic.queueSkill(RandomOf('discharge', 'tenPointFive'));
				} else {
					var skillToUse = RandomOf('hellfire', 'windchill', 'electrocute', 'upheaval', 'heal', 'rejuvenate');
					this.aic.queueSkill(skillToUse);
					if (skillToUse == 'rejuvenate') {
						this.aic.queueSkill('chargeSlash');
					}
				}
			}
			break;
		case 3:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('renewal');
			} else {
				
			}
			break;
	}
};

// .onItemUsed() event handler
// Allows Temple to react when someone in the battle uses an item.
ScottTempleAI.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
	if (this.aic.unit.hasStatus('offGuard')) {
		return;
	}
	if (Link([ 'tonic', 'powerTonic' ]).contains(itemID) && !Link(targetIDs).contains('scottTemple')
		&& 0.5 > Math.random())
	{
		this.aic.queueSkill('electrocute', targetIDs[0]);
	}
};

// .onSkillUsed() event handler
// Allows Temple to react when someone in the battle uses an attack.
ScottTempleAI.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	if (this.aic.unit.hasStatus('offGuard')) {
		return;
	}
	if (skillID == 'rejuvenate' && userID != 'scottTemple' && !Link(targetIDs).contains('scottTemple')) {
		if (this.phase <= 1) {
			this.aic.queueSkill('chargeSlash');
		} else if (this.phase >= 2 && 0.25 > Math.random) {
			this.aic.queueSkill('necromancy', targetIDs[0]);
		}
	}
};
