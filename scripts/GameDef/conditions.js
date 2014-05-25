/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.conditions =
{
	// Blackout field condition
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
	
	// General Disarray field condition
	// Randomizes the move rank of any skill or item used.
	generalDisarray:
	{
		name: "G. Disarray",
		
		initialize: function(battle) {
			this.actionsLeft = 15;
		},
		
		actionTaken: function(battle, eventData) {
			eventData.action.rank = Math.min(Math.floor(Math.random() * 5 + 1), 5);
			--this.actionsLeft;
			if (this.actionsLeft > 0) {
				Console.writeLine("Gen. Disarray will expire after " + this.actionsLeft + " more action(s)");
			} else {
				Console.writeLine("Gen. Disarray has expired");
				battle.liftCondition('generalDisarray');
			}
		}
	},
	
	// Healing Aura field condition
	// Restores a small amount of health to all battlers each cycle.
	healingAura:
	{
		name: "Healing Aura",
		
		beginCycle: function(battle, eventData) {
			Link(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.each(function(unit)
			{
				var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
				unit.heal(0.25 * vit, [ 'reGen' ]);
			});
		}
	},
	
	// Inferno field condition
	// Inflicts a small amount of Fire damage on all battlers at the beginning of a
	// cycle. The effect diminishes over time, settling at half its original
	// damage output.
	inferno:
	{
		name: "Inferno",
		overrules: [ 'subzero' ],
		
		initialize: function(battle) {
			this.multiplier = 1.0;
		},
		
		beginCycle: function(battle, eventData) {
			Link(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.each(function(unit)
			{
				var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
				unit.takeDamage(0.5 * vit * this.multiplier, [ 'special', 'fire' ]);
			}.bind(this));
			this.multiplier = Math.max(this.multiplier - 0.05, 0.5);
		},
		
		unitDamaged: function(battle, eventData) {
			if (Link(eventData.tags).contains('ice') && eventData.unit.stance != BattleStance.guard) {
				eventData.amount *= Game.bonusMultiplier;
				Console.writeLine("Ice damage taken during Inferno, damage increased");
			}
		}
	},

	// Subzero field condition
	// Inflicts a small amount of Ice damage on all battlers at the end of their turns.
	// The effect intensifies over time per battler, maxing out at double its original
	// output.
	subzero:
	{
		name: "Subzero",
		overrules: [ 'inferno' ],
		
		initialize: function(battle) {
			this.multipliers = {};
		},
		
		endTurn: function(battle, eventData) {
			var unit = eventData.actingUnit;
			if (unit.isAlive()) {
				if (!(unit.id in this.multipliers)) {
					this.multipliers[unit.id] = 1.0;
				}
				var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
				unit.takeDamage(0.5 * vit * this.multipliers[unit.id], [ 'special', 'ice' ]);
				this.multipliers[unit.id] = Math.max(this.multipliers[unit.id] + 0.10, 2.0);
			}
		},
		
		unitDamaged: function(battle, eventData) {
			if (Link(eventData.tags).contains('fire') && eventData.unit.stance != BattleStance.guard) {
				eventData.amount *= Game.bonusMultiplier;
				Console.writeLine("Fire damage taken during Subzero, damage increased");
			}
		}
	},
	
	// Thunderstorm field condition
	// Strikes a battler every so often at the end of their turn, dealing a small amount
	// of lightning damage and inflicting Zombie status.
	thunderstorm:
	{
		name: "Thunderstorm",
		
		endTurn: function(battle, eventData) {
			if (0.1 > Math.random()) {
				var unit = eventData.actingUnit;
				var level = battle.getLevel();
				var attack = Game.math.statValue(100, level);
				var defense = Game.math.statValue(0, level);
				var damage = Game.math.damage.calculate(5, battle.getLevel(), unit.tier, attack, defense);
				unit.takeDamage(damage, [ 'special', 'lightning' ]);
				unit.addStatus('zombie');
			}
		}
	}
};
