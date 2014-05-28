/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.conditions =
{
	// Blackout field condition
	// Lowers accuracy and sometimes retargets attacks. Wears off after 10 actions.
	blackout:
	{
		name: "Blackout",
		
		initialize: function(battle) {
			this.actionsLeft = 10;
		},
		
		actionTaken: function(battle, eventData) {
			if (eventData.targets.length == 1 && 0.5 > Math.random()) {
				var target = eventData.targets[0];
				var newTargets = Math.random() < 0.5
					? battle.alliesOf(target)
					: battle.enemiesOf(target);
				var targetID = Math.min(Math.floor(Math.random() * newTargets.length), newTargets.length - 1);
				eventData.targets = [ newTargets[targetID] ];
			}
			--this.actionsLeft;
			if (this.actionsLeft <= 0) {
				Console.writeLine("Blackout has expired");
				battle.liftCondition('blackout');
			} else {
				Console.writeLine("Blackout will expire in " + this.actionsLeft + " more action(s)");
			}
		}
	},
	
	// General Disarray field condition
	// Randomizes the move rank of any skill or item used. Wears off after
	// 15 actions.
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
				Console.writeLine("G. Disarray will expire in " + this.actionsLeft + " more action(s)");
			} else {
				Console.writeLine("G. Disarray has expired");
				battle.liftCondition('generalDisarray');
			}
		}
	},
	
	// Healing Aura field condition
	// Restores a small amount of health to a random battler at the beginning of
	// each cycle. Wears off after 25 healings.
	healingAura:
	{
		name: "Healing Aura",
		
		initialize: function(battle) {
			this.cyclesLeft = 25;
		},
		
		beginCycle: function(battle, eventData) {
			var units = Link(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.toArray();
			var unit = units[Math.min(Math.floor(Math.random() * units.length), units.length - 1)];
			var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.heal(vit, [ 'reGen' ]);
			--this.cyclesLeft;
			if (this.cyclesLeft <= 0) {
				Console.writeLine("Healing Aura has expired");
				battle.liftCondition('healingAura');
			} else {
				Console.writeLine("Healing Aura will expire in " + this.cyclesLeft + " more cycle(s)");
			}
		}
	},
	
	// Inferno field condition
	// Inflicts a small amount of Fire damage on all battlers at the beginning of a
	// cycle and boosts any Fire attacks performed. Residual damage from Inferno diminishes
	// over time, eventually settling at half the original output.
	inferno:
	{
		name: "Inferno",
		
		initialize: function(battle) {
			this.multiplier = 1.0;
			Link(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.each(function(unit)
			{
				if (unit.hasStatus('frostbite')) {
					Console.writeLine(unit.name + "'s Frostbite nullified by Inferno installation");
					unit.liftStatus('frostbite');
				}
			});
		},
		
		actionTaken: function(battle, eventData) {
			Link(eventData.action.effects)
				.filterBy('type', 'damage')
				.filterBy('element', 'fire')
				.each(function(effect)
			{
				var oldPower = effect.power;
				effect.power = Math.round(effect.power * Game.bonusMultiplier);
				Console.writeLine("Inferno in effect, POW of Fire attack boosted to " + effect.power);
				Console.append("was: " + oldPower);
			});
		},
		
		beginCycle: function(battle, eventData) {
			var units = Link(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.toArray();
			var unit = units[Math.min(Math.floor(Math.random() * units.length), units.length - 1)];
			var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.takeDamage(vit * this.multiplier, [ 'special', 'fire' ]);
			this.multiplier = Math.max(this.multiplier - 0.05, 0.5);
		},
		
		conditionInstalled: function(battle, eventData) {
			if (eventData.conditionID == 'subzero') {
				Console.writeLine("Inferno canceled by Subzero installation, both suppressed");
				eventData.cancel = true;
				battle.liftCondition('inferno');
				Link(battle.battleUnits)
					.where(function(unit) { return unit.isAlive(); })
					.each(function(unit)
				{
					unit.addStatus('zombie');
				});
			}
		},
		
		unitAfflicted: function(battle, eventData) {
			if (eventData.statusID == 'frostbite') {
				eventData.cancel = true;
				Console.writeLine("Frostbite incompatible with Inferno, infliction canceled");
			} else if (eventData.statusID == 'ignite') {
				eventData.cancel = true;
				Console.writeLine("Ignite impossible under Subzero, infliction canceled");
			}
		}
	},

	// Subzero field condition
	// Inflicts a small amount of Ice damage on a battler at the end of his turn.
	// The effect intensifies over time per battler, maxing out at double its original
	// output.
	subzero:
	{
		name: "Subzero",
		
		initialize: function(battle) {
			this.multiplier = 1.0;
			Link(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.each(function(unit)
			{
				if (unit.hasStatus('frostbite')) {
					Console.writeLine(unit.name + "'s Frostbite overruled by Subzero installation");
					unit.liftStatus('frostbite');
				}
				if (unit.hasStatus('ignite')) {
					Console.writeLine(unit.name + "'s Ignite nullified by Subzero installation");
					unit.liftStatus('ignite');
				}
			});
		},
		
		actionTaken: function(battle, eventData) {
			Link(eventData.action.effects)
				.filterBy('type', 'damage')
				.filterBy('element', 'ice')
				.each(function(effect)
			{
				var oldPower = effect.power;
				effect.power = Math.round(effect.power * Game.bonusMultiplier);
				Console.writeLine("Subzero in effect, POW of Ice attack boosted to " + effect.power);
				Console.append("was: " + oldPower);
			});
		},
		
		conditionInstalled: function(battle, eventData) {
			if (eventData.conditionID == 'inferno') {
				Console.writeLine("Subzero canceled by Inferno installation, both suppressed");
				eventData.cancel = true;
				battle.liftCondition('subzero');
				Link(battle.battleUnits)
					.where(function(unit) { return unit.isAlive(); })
					.each(function(unit)
				{
					unit.addStatus('zombie');
				});
			}
		},
		
		endTurn: function(battle, eventData) {
			var unit = eventData.actingUnit;
			if (unit.isAlive()) {
				var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
				unit.takeDamage(vit * this.multiplier, [ 'special', 'ice' ]);
				this.multiplier = Math.max(this.multiplier + 0.10, 2.0);
			}
		},
		
		unitAfflicted: function(battle, eventData) {
			if (eventData.statusID == 'frostbite') {
				eventData.cancel = true;
				Console.writeLine("Frostbite overruled by Subzero, infliction canceled");
			} else if (eventData.statusID == 'ignite') {
				eventData.cancel = true;
				Console.writeLine("Ignite incompatible with Subzero, infliction canceled");
			}
		}
	},
	
	// Thunderstorm field condition
	// Strikes a battler every so often at the end of their turn, dealing a small amount
	// of lightning damage and inflicting Zombie status. Wears off after 10 strikes.
	thunderstorm:
	{
		name: "Thunderstorm",
		
		initialize: function(battle) {
			this.strikesLeft = 10;
		},
		
		endTurn: function(battle, eventData) {
			if (0.1 > Math.random()) {
				var unit = eventData.actingUnit;
				Console.writeLine(unit.name + " struck by lightning from Thunderstorm");
				var level = battle.getLevel();
				var attack = Game.math.statValue(100, level);
				var defense = Game.math.statValue(0, level);
				var damage = Game.math.damage.calculate(5, battle.getLevel(), unit.tier, attack, defense);
				unit.takeDamage(damage, [ 'special', 'lightning' ]);
				unit.addStatus('zombie');
				--this.strikesLeft;
				if (this.strikesLeft <= 0) {
					Console.writeLine("Thunderstorm has expired");
					battle.liftCondition('thunderstorm');
				} else {
					Console.writeLine("Thunderstorm will expire in " + this.strikesLeft + " more strike(s)");
				}
			}
		}
	}
};
