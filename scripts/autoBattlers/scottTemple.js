/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { from, Random } from 'sphere-runtime';

import { AutoBattler, Stance } from '../battleSystem/index.js';

export default
class ScottTempleAI extends AutoBattler
{
	constructor(unit, battle)
	{
		super(unit, battle);

		this.definePhases([ 4000, 1500 ], 100);
		this.defaultSkill = 'swordSlash';

		this.omniCounter = 'tenPointFive';
		this.inQSCombo = false;
		this.nextSpell = null;
		this.spellTarget = null;
	}

	strategize()
	{
		const spellID = Random.sample([ 'hellfire', 'windchill', 'upheaval' ]);
		if (this.inQSCombo || Random.chance(0.50)) {
			const turns = this.predictSkillTurns('quickstrike');
			this.inQSCombo = turns[0].unit === this.unit;
			this.queueSkill(this.inQSCombo ? 'quickstrike' : 'swordSlash');
		}
		else {
			const turns = this.predictSkillTurns('heal');
			if (turns[0].unit === this.unit)
				this.queueSkill('heal');
			this.queueSkill(spellID);
		}
	}

	on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
		case 1:
			this.queueSkill('omni', Stance.Normal, 'elysia');
			break;
		}
	}
	
	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		if (skillID === 'salve' && userID !== 'scottTemple')
			this.omniCounter = 'discharge';
		if (skillID === 'omni' && userID !== 'scottTemple' && this.turnsTaken > 0) {
			if (Random.chance(0.50 + 0.125 * this.phase))
				this.queueSkill(this.omniCounter);
		}
	}

	on_unitReady(unitID)
	{
		if (unitID !== 'scottTemple')
			this.inQSCombo = false;
	}
}
