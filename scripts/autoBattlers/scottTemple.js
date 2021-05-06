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

		this.definePhases([ 9000, 3000 ], 100);
		this.defaultSkill = 'swordSlash';

		this.inQSCombo = false;
		this.healingItems = from([ 'tonic', 'powerTonic' ]);
		this.zapChance = 0.0;
		this.zapTarget = null;
	}

	strategize(stance, phase)
	{
		if (this.zapTarget !== null) {
			this.queueSkill('electrocute', Stance.Normal, this.zapTarget);
			this.zapTarget = null;
			this.zapChance = 0.0;
		}
		else {
			const healChance = 0.15 * (phase - 1);
			const moveSet = [ 'flare', 'chill', 'lightning', 'quake' ];
			if (!this.inQSCombo && Random.chance(healChance)) {
				this.queueSkill('heal');
			}
			else {
				if (!this.inQSCombo && !this.hasStatus('crackdown') && Random.chance(0.5))
					this.inQSCombo = true;
				if (this.inQSCombo) {
					const turns = this.predictSkillTurns('quickstrike');
					if (turns[0].unit === this.unit) {
						this.queueSkill('quickstrike');
					}
					else {
						this.queueSkill('swordSlash');
						this.inQSCombo = false;
					}
				}
				else {
					this.queueSkill(Random.sample(moveSet));
				}
			}
		}
	}

	on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
		case 1:
			this.queueSkill('omni', Stance.Normal, 'elysia');
			break;
		case 2:
			this.queueSkill('rejuvenate');
			break;
		case 3:
			this.queueGuard();
			break;
		}
	}

	on_itemUsed(userID, itemID, targetIDs)
	{
		if (this.healingItems.anyIs(itemID))
			this.zapTarget = targetIDs[0];
	}
	
	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		// if someone gets healed, zombify the target. in case of Renewal, retaliate with Discharge.
		if ((skillID === 'heal' || skillID === 'rejuvenate') && userID !== 'scottTemple') {
			this.zapChance += (skillID === 'rejuvenate' ? 0.25 : 0.15);
			if (Random.chance(this.zapChance))
				this.zapTarget = targetIDs[0];
		}
		else if (skillID === 'renewal' && userID !== 'scottTemple') {
			this.queueSkill('discharge');
		}
	}
}
