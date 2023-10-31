/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

// Beverly movepool:
// - Munch
// - Fat Slam
// - 10.5
// - Knock Back

import { from, Random, Scene } from 'sphere-runtime';

import { AutoBattler, Stance } from '../battleSystem/index.js';

export default
class BeverlyAI extends AutoBattler
{
	constructor(unit, battle)
	{
		super(unit, battle);

		this.defaultSkill = 'fatSlam';
	}

	strategize()
	{
		if (Random.chance(0.25))
			this.queueSkill('munch', Stance.Normal, 'lauren');
	}

	async on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
			case 1:
				this.queueSkill('tenPointFive');
				break;
		}
	}

	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		
	}

	on_unitDamaged(unit, amount, tags, actingUnit)
	{
		if (unit === this.unit && actingUnit !== null) {
			if (from(tags).anyIs('fire'))
				this.queueSkill('knockBack', Stance.Normal, actingUnit.id);
		}
	}
}
