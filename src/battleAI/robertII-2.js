/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleEngine/battleAI.js');

class Robert2AI extends BattleAI
{
	constructor(unit, battle)
	{
		super(unit, battle);

		this.definePhases([ 9000, 6000, 3000, 1000 ], 50);
		this.defaultSkill = 'swordSlash';

		this.immuneTurns = 0;
		this.scottIsZombie = false;
	}
	
	strategize()
	{
	}
	
	on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
			case 1:
				this.queueSkill('omni');
				break;
			case 2:
				this.queueSkill('upheaval', Stance.Charge);
				break;
			case 3:
				this.queueSkill('protectiveAura');
				this.queueSkill('electrocute', Stance.Charge);
				break;
			case 4:
				this.queueSkill('crackdown');
				break;
			case 5:
				this.queueSkill('desperationSlash');
		}
	}
	
	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		if (userID === 'robert2' && from(targetIDs).anyIs('scott')) {
			if ((skillID === 'electrocute' && stance === Stance.Charge)
				|| skillID === 'bolt' || skillID === 'necromancy')
			{
				if (this.immuneTurns <= 0)
					this.scottIsZombie = true;
			}
		}
	}
	
	on_itemUsed(userID, itemID, targetIDs)
	{
		const Curatives = [ 'tonic', 'powerTonic', 'fullTonic' ];

		if (itemID === 'holyWater' && from(targetIDs).anyIs('scott'))
			this.scottIsZombie = false;

		if (itemID === 'vaccine' && from(targetIDs).anyIs('scott')) {
			this.immuneTurns = 5;
			this.scottIsZombie = false;
		}

		if (userID === 'scott' && from(targetIDs).anyIs('scott')) {
			if (from(Curatives).anyIs(itemID)) {
				let zombieChance = this.phase <= 2 ? 1.0
					: this.phase === 3 ? 0.5
					: 0.0;
				let skill = this.phase < 2 ? 'necromancy' : 'bolt';
				if (Random.chance(zombieChance) && !this.hasMovesQueued())
					this.queueSkill(skill);
			}
		}

		if (userID === 'scott' && from(targetIDs).anyIs('robert2') && from(Curatives).anyIs(itemID)
		    && this.unit.hasStatus('zombie'))
		{
			if (this.isItemUsable('vaccine'))
				this.queueItem('vaccine');
			else {
				this.queueSkill('bolt');
				this.queueItem('tonic', 'scott');
			}
		}
	}
}
