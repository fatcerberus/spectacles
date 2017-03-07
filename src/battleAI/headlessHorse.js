/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleEngine/battleAI.js');

class HeadlessHorseAI extends BattleAI
{
	constructor(unit, battle)
	{
		super(unit, battle);
		this.definePhases([ 500 ], 10);
		this.defaultSkill = 'flare';
	}

	strategize()
	{
	}

	on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
			case 1:
				this.queueSkill('trample', Stance.Attack, 'maggie');
				this.queueSkill('flareUp');
				break;
		}
	}
}
