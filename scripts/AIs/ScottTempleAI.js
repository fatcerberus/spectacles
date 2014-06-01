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
	this.phasePoints = [ 3000, 1000 ];
	for (var i = 0; i < this.phasePoints.length; ++i) {
		this.phasePoints[i] = Math.round(this.phasePoints[i] + 200 * (0.5 - Math.random()));
	}
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
		this.aic.unit.hp > this.phasePoints[0] ? 1
		: this.aic.unit.hp > this.phasePoints[1] ? 2
		: 3;
	this.phase = phaseToEnter > lastPhase ? phaseToEnter : lastPhase;
	switch (this.phase) {
		case 1:
			if (this.phase > lastPhase) {
				this.aic.queueSkill('omni', 'elysia');
				var spellID = RandomOf('inferno', 'subzero');
				this.phase2Opener = spellID != 'inferno' ? 'inferno' : 'subzero';
				this.aic.queueSkill(spellID);
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
				this.aic.queueSkill('rejuvenate');
				this.aic.queueSkill(this.phase2Opener);
				this.isQSComboStarted = false;
				this.movesTillReGen = 5 + Math.min(Math.floor(Math.random() * 3), 2);
			} else {
				if (this.isQSComboStarted) {
					var qsTurns = this.aic.predictSkillTurns('quickstrike');
					if (qsTurns[0].unit === this.aic.unit) {
						this.aic.queueSkill('quickstrike');
					} else {
						var skillToUse = RandomOf('flare', 'chill', 'lightning', 'quake')
						this.aic.queueSkill(this.aic.isSkillUsable(skillToUse) ? skillToUse : 'swordSlash');
					}
				} else if (this.movesTillReGen <= 0 && this.aic.isSkillUsable('rejuvenate')) {
					this.aic.queueSkill('rejuvenate');
					this.aic.queueSkill('chargeSlash');
					this.movesTillReGen = 5 + Math.min(Math.floor(Math.random() * 3), 2);
				} else {
					--this.movesTillReGen;
					var skillToUse = this.aic.unit.hasStatus('reGen')
						? RandomOf('hellfire', 'windchill', 'upheaval', 'quickstrike')
						: RandomOf('hellfire', 'windchill', 'upheaval', 'quickstrike', 'heal');
					skillToUse = this.aic.isSkillUsable(skillToUse) ? skillToUse : 'quickstrike';
					if (skillToUse != 'quickstrike') {
						this.aic.queueSkill(skillToUse);
					} else {
						var qsTurns = this.aic.predictSkillTurns(skillToUse);
						if (qsTurns[0].unit === this.aic.unit) {
							this.isQSComboStarted = true;
							this.aic.queueSkill(skillToUse);
						} else {
							this.aic.queueSkill('chargeSlash');
						}
					}
				}
			}
			break;
		case 3:
			if (this.phase > lastPhase) {
				this.aic.queueSkill(this.aic.isSkillUsable('renewal')
					? 'renewal' : 'chargeSlash');
				this.isQSComboStarted = false;
			} else {
				if (this.isQSComboStarted) {
					var qsTurns = this.aic.predictSkillTurns('quickstrike');
					this.aic.queueSkill(qsTurns[0].unit === this.aic.unit ? 'quickstrike' : 'swordSlash');
				} else if (!this.aic.battle.hasCondition('generalDisarray') && 0.5 > Math.random()) {
					this.aic.queueSkill('tenPointFive');
				} else {
					var skillToUse = RandomOf('quickstrike',
						'hellfire', 'windchill', 'electrocute', 'upheaval',
						'flare', 'chill', 'lightning', 'quake', 'heal');
					this.aic.queueSkill(this.aic.isSkillUsable(skillToUse) ? skillToUse
						: RandomOf('swordSlash', 'quickstrike', 'chargeSlash'));
					if (this.aic.isSkillQueued('quickstrike')) {
						var qsTurns = this.aic.predictSkillTurns('quickstrike');
						this.isQSComboStarted = qsTurns[0].unit === this.aic.unit;
					}
				}
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
		if (this.phase <= 1 && !this.aic.isSkillQueued('chargeSlash')) {
			this.aic.queueSkill('chargeSlash', targetIDs[0]);
		} else if (this.phase >= 2 && 0.25 > Math.random) {
			this.aic.queueSkill('necromancy', targetIDs[0]);
		}
	} else if (skillID == 'dispel' && Link(targetIDs).contains('scottTemple')
		&& this.aic.unit.hasStatus('reGen'))
	{
		this.aic.queueSkill('electrocute', userID);
		this.aic.queueSkill('heal', userID);
	}
};
