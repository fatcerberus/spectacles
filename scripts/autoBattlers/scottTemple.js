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

		this.inQSCombo = false;
		this.nextSpell = null;
		this.spellTarget = null;
	}

	strategize()
	{
		const healChance = 0.15 * (this.phase - 1);
		if (this.nextSpell !== null) {
			this.queueSkill(this.nextSpell, Stance.Normal, this.spellTarget);
			this.nextSpell = null;
		}
		else if (!this.inQSCombo && Random.chance(healChance)) {
			this.queueSkill('heal');
		}
		else {
			const comboChance = this.phase < 3 ? 0.5 : 0.25;
			if (!this.inQSCombo && !this.hasStatus('crackdown') && Random.chance(comboChance))
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
				if (this.phase >= 3 && Random.chance(0.35)) {
					this.queueSkill('tenPointFive');
				}
				else {
					const usePowerSpell = Random.chance(0.25 * this.phase);
					const moveID = usePowerSpell
						? Random.sample([ 'hellfire', 'windchill' ])
						: Random.sample([ 'flare', 'chill', 'lightning', 'quake' ]);
					if (moveID === 'hellfire')
						this.nextSpell = 'windchill';
					else if (moveID === 'windchill')
						this.nextSpell = 'hellfire';
					this.spellTarget = Random.sample([ 'elysia', 'abigail', 'bruce' ]);
					this.queueSkill(moveID, Stance.Normal, this.spellTarget);
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
		}
	}

	on_unitReady(unitID)
	{
		if (unitID !== 'scottTemple')
			this.inQSCombo = false;
	}
}
