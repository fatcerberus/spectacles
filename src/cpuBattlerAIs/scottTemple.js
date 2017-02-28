/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2012 Power-Command
***/

// ScottTempleAI() constructor
// Creates an AI to control Scott Temple in battle in Spectacles III.
// Arguments:
//     aiContext: The AI context hosting this AI.
function ScottTempleAI(aiContext)
{
	this.aic = aiContext;
	this.aic.battle.itemUsed.add(this.onItemUsed, this);
	this.aic.battle.skillUsed.add(this.onSkillUsed, this);
	this.aic.phaseChanged.add(this.onPhaseChanged, this);
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('swordSlash');
	this.aic.definePhases([ 3000, 1000 ], 50);
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
ScottTempleAI.prototype.dispose = function()
{
	this.aic.battle.itemUsed.remove(this.onItemUsed, this);
	this.aic.battle.skillUsed.remove(this.onSkillUsed, this);
	this.aic.phaseChanged.remove(this.onPhaseChanged, this);
};

// .strategize() method
// Determines what Scott Temple will do when his turn arrives.
ScottTempleAI.prototype.strategize = function(stance, phase)
{
	switch (phase) {
		case 1:
			var qsTurns = this.aic.predictSkillTurns('quickstrike');
			if (qsTurns[0].unit === this.aic.unit) {
				this.aic.queueSkill('quickstrike');
			} else if (0.25 > Math.random()) {
				if (this.aic.battle.hasCondition('inferno')) {
					this.aic.queueSkill('hellfire');
				} else if (this.aic.battle.hasCondition('subzero')) {
					this.aic.queueSkill('windchill');
				} else {
					this.aic.queueSkill(random.sample([ 'inferno', 'subzero' ]));
				}
			} else {
				this.aic.queueSkill(random.sample([ 'flare', 'chill', 'lightning', 'quake', 'heal' ]));
			}
			break;
		case 2:
			if (this.isQSComboStarted) {
				var qsTurns = this.aic.predictSkillTurns('quickstrike');
				if (qsTurns[0].unit === this.aic.unit) {
					this.aic.queueSkill('quickstrike');
				} else {
					var skillToUse = random.sample([ 'flare', 'chill', 'lightning', 'quake' ])
					this.aic.queueSkill(this.aic.isSkillUsable(skillToUse) ? skillToUse : 'swordSlash');
				}
			} else if (this.movesTillReGen <= 0 && this.aic.isSkillUsable('rejuvenate')) {
				this.aic.queueSkill('rejuvenate');
				this.aic.queueSkill('chargeSlash');
				this.movesTillReGen = 3 + Math.min(Math.floor(Math.random() * 3), 2);
			} else {
				--this.movesTillReGen;
				var skillToUse = this.aic.unit.hasStatus('reGen')
					? random.sample([ 'hellfire', 'windchill', 'upheaval', 'quickstrike' ])
					: random.sample([ 'hellfire', 'windchill', 'upheaval', 'quickstrike', 'heal' ]);
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
			break;
		case 3:
			if (this.isQSComboStarted) {
				var qsTurns = this.aic.predictSkillTurns('quickstrike');
				this.aic.queueSkill(qsTurns[0].unit === this.aic.unit ? 'quickstrike' : 'swordSlash');
			} else if (!this.aic.battle.hasCondition('generalDisarray') && 0.5 > Math.random()) {
				this.aic.queueSkill('tenPointFive');
			} else {
				var skillToUse = random.sample([ 'quickstrike',
					'hellfire', 'windchill', 'electrocute', 'upheaval',
					'flare', 'chill', 'lightning', 'quake', 'heal' ]);
				this.aic.queueSkill(this.aic.isSkillUsable(skillToUse) ? skillToUse
					: random.sample([ 'swordSlash', 'quickstrike', 'chargeSlash' ]));
				if (this.aic.isSkillQueued('quickstrike')) {
					var qsTurns = this.aic.predictSkillTurns('quickstrike');
					this.isQSComboStarted = qsTurns[0].unit === this.aic.unit;
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
	if (from([ 'tonic', 'powerTonic' ]).anyIs(itemID) && !from(targetIDs).anyIs('scottTemple')
		&& random.chance(0.5))
	{
		this.aic.queueSkill('electrocute', targetIDs[0]);
	}
};

ScottTempleAI.prototype.onPhaseChanged = function(aiContext, newPhase, lastPhase)
{
	switch (newPhase) {
		case 1:
			this.aic.queueSkill('omni', 'elysia');
			var spellID = random.sample([ 'inferno', 'subzero' ]);
			this.phase2Opener = spellID != 'inferno' ? 'inferno' : 'subzero';
			this.aic.queueSkill(spellID);
			break;
		case 2:
			this.aic.queueSkill('rejuvenate');
			this.aic.queueSkill(this.phase2Opener);
			this.isQSComboStarted = false;
			this.movesTillReGen = 3 + Math.min(Math.floor(Math.random() * 3), 2);
			break;
		case 3:
			this.aic.queueSkill(this.aic.isSkillUsable('renewal')
				? 'renewal' : 'chargeSlash');
			this.isQSComboStarted = false;
			break;
	}
};

// .onSkillUsed() event handler
// Allows Temple to react when someone in the battle uses an attack.
ScottTempleAI.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
	if (this.aic.unit.hasStatus('offGuard')) {
		return;
	}
	if (skillID == 'rejuvenate' && userID != 'scottTemple' && !from(targetIDs).anyIs('scottTemple')) {
		if (this.aic.phase <= 1 && !this.aic.isSkillQueued('chargeSlash')) {
			this.aic.queueSkill('chargeSlash', targetIDs[0]);
		} else if (this.aic.phase >= 2 && 0.25 > Math.random) {
			this.aic.queueSkill('necromancy', targetIDs[0]);
		}
	} else if (skillID == 'dispel' && from(targetIDs).anyIs('scottTemple')
		&& this.aic.unit.hasStatus('reGen'))
	{
		this.aic.queueSkill('electrocute', userID);
		this.aic.queueSkill('heal', userID);
	}
};
