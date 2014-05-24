/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.conditions =
{
	// "Blackout" field condition
	// Lowers accuracy and sometimes retargets attacks.
	blackout:
	{
		name: "Blackout",
		
		actionTaken: function(battle, eventData) {
			if (eventData.targets.length == 1 && 0.5 > Math.random()) {
				var target = eventData.targets[0];
				var newTargets = Math.random() < 0.5
					? battle.alliesOf(target)
					: battle.enemiesOf(target);
				var targetID = Math.min(Math.floor(Math.random() * newTargets.length), newTargets.length - 1);
				eventData.targets = [ newTargets[targetID] ];
			}
		}
	},
	
	// "General Disarray" field condition
	// Randomizes the move rank of any skill or item used.
	generalDisarray:
	{
		name: "G. Disarray",
		
		actionTaken: function(battle, eventData) {
			eventData.action.rank = Math.floor(Math.min(Math.random() * 5 + 1, 5));
		}
	},
	
	// "Healing Aura" field condition
	// Restores a small amount of health to all battlers each cycle.
	healingAura:
	{
		name: "Healing Aura",
		
		beginCycle: function(battle, eventData) {
			Link(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.each(function(unit)
			{
				unit.heal(0.01 * unit.maxHP / unit.tier, [ 'reGen' ]);
			});
		}
	}
};
