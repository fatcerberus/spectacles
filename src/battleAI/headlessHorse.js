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

		this.definePhases([ 500 ], 75);
		this.defaultSkill = 'flare';
	}

	on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
			case 1:
				this.queueSkill('trample', Stance.Attack, 'maggie');
				this.queueSkill('flareUp');
				break;
			case 2:
				this.queueSkill('spectralReversion');
				this.defaultSkill = 'flameBreath';
				break;
		}
	}

	on_skillUsed(userID, skillID, targetIDs)
	{
		if (from(targetIDs).anyIs('headlessHorse')
		    && this.unit.hasStatus('ignite')
		    && skillID === 'chill')
		{
			if (this.unit.hasStatus('ghost'))
				this.queueSkill('spectralKick', Stance.Charge, userID);
			else
				this.queueSkill('trample', Stance.Attack, userID);
		}
	}
}
