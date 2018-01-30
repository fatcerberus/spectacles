/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { from, Random, Scene } from 'sphere-runtime';

import { AutoBattler } from '$/battle-system/auto-battler.mjs';
import { Stance } from '$/battle-system/battle-unit.mjs';

export default
class ScottTempleAI extends AutoBattler
{
	constructor(unit, battle)
	{
		super(unit, battle);

		this.definePhases([ 15000, 5000 ], 100);
		this.defaultSkill = 'heal';
		
	}

	strategize()
	{
		
	}

	on_phaseChanged(newPhase, lastPhase)
	{
		
	}
}
