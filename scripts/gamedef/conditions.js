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
			if (eventData.targets.length == 1 && random.chance(0.5)) {
				var target = eventData.targets[0];
				var newTargets = random.chance(0.5) ? battle.alliesOf(target) : battle.enemiesOf(target);
				eventData.targets = [ random.sample(newTargets) ];
			}
			--this.actionsLeft;
			if (this.actionsLeft <= 0) {
				term.print("Blackout has expired");
				battle.liftCondition('blackout');
			} else {
				term.print("Blackout will expire in " + this.actionsLeft + " more action(s)");
			}
		}
	},
	
	// General Disarray field condition
	// Randomizes the move rank of any skill or item used. Wears off after
	// 15 actions have been taken.
	generalDisarray:
	{
		name: "G. Disarray",
		
		initialize: function(battle) {
			this.actionsLeft = 15;
		},
		
		actionTaken: function(battle, eventData) {
			var oldRank = eventData.action.rank
			eventData.action.rank = random.discrete(1, 5);
			if (eventData.action.rank != oldRank) {
				term.print("Rank of action changed by G. Disarray to " + eventData.action.rank,
					"was: " + oldRank);
			}
			--this.actionsLeft;
			if (this.actionsLeft > 0) {
				term.print("G. Disarray will expire in " + this.actionsLeft + " more action(s)");
			} else {
				term.print("G. Disarray has expired");
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
			var units = from(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.select();
			var unit = random.sample(units);
			var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.heal(vit, [ 'cure' ]);
			--this.cyclesLeft;
			if (this.cyclesLeft <= 0) {
				term.print("Healing Aura has expired");
				battle.liftCondition('healingAura');
			} else {
				term.print("Healing Aura will expire in " + this.cyclesLeft + " more cycle(s)");
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
			from(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.each(function(unit)
			{
				if (unit.hasStatus('frostbite')) {
					term.print(unit.name + "'s Frostbite nullified by Inferno installation");
					unit.liftStatus('frostbite');
				}
			});
		},
		
		actionTaken: function(battle, eventData) {
			from(eventData.action.effects)
				.where(function(x) { return x.type === 'damage'; })
				.each(function(effect)
			{
				if (effect.element == 'fire') {
					var oldPower = effect.power;
					effect.power = Math.round(effect.power * Game.bonusMultiplier);
					term.print("Fire attack strengthened by Inferno to " + effect.power + " POW",
						"was: " + oldPower);
				} else if (effect.element == 'ice') {
					var oldPower = effect.power;
					effect.power = Math.round(effect.power / Game.bonusMultiplier);
					term.print("Ice attack weakened by Inferno to " + effect.power + " POW",
						"was: " + oldPower);
				}
			});
		},
		
		beginCycle: function(battle, eventData) {
			var units = from(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.select();
			var unit = random.sample(units);
			var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.takeDamage(vit, [ 'special', 'fire' ]);
		},
		
		conditionInstalled: function(battle, eventData) {
			if (eventData.conditionID == 'subzero') {
				term.print("Inferno canceled by Subzero installation, both suppressed");
				eventData.cancel = true;
				battle.liftCondition('inferno');
				from(battle.battleUnits)
					.where(function(unit) { return unit.isAlive(); })
					.each(function(unit)
				{
					unit.addStatus('zombie', true);
				});
			}
		},
		
		unitAfflicted: function(battle, eventData) {
			if (eventData.statusID == 'frostbite') {
				eventData.cancel = true;
				term.print("Frostbite is incompatible with Inferno");
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
			this.rank = 0;
			from(battle.battleUnits)
				.where(function(unit) { return unit.isAlive(); })
				.each(function(unit)
			{
				if (unit.hasStatus('frostbite')) {
					term.print(unit.name + "'s Frostbite overruled by Subzero installation");
					unit.liftStatus('frostbite');
				}
				if (unit.hasStatus('ignite')) {
					term.print(unit.name + "'s Ignite nullified by Subzero installation");
					unit.liftStatus('ignite');
				}
			});
		},
		
		actionTaken: function(battle, eventData) {
			this.rank = eventData.action.rank;
			from(eventData.action.effects)
				.where(function(x) { return x.type === 'damage'; })
				.where(function(x) { return x.element === 'ice'; })
				.each(function(effect)
			{
				if (effect.element == 'ice') {
					var oldPower = effect.power;
					effect.power = Math.round(effect.power * Game.bonusMultiplier);
					term.print("Ice attack strengthened by Subzero to " + effect.power + " POW",
						"was: " + oldPower);
				} else if (effect.element == 'fire') {
					var oldPower = effect.power;
					effect.power = Math.round(effect.power / Game.bonusMultiplier);
					term.print("Fire attack weakened by Subzero to " + effect.power + " POW",
						"was: " + oldPower);
				}
			});
		},
		
		conditionInstalled: function(battle, eventData) {
			if (eventData.conditionID == 'inferno') {
				term.print("Subzero canceled by Inferno installation, both suppressed");
				eventData.cancel = true;
				battle.liftCondition('subzero');
				from(battle.battleUnits)
					.where(function(unit) { return unit.isAlive(); })
					.each(function(unit)
				{
					unit.addStatus('zombie', true);
				});
			}
		},
		
		endTurn: function(battle, eventData) {
			var unit = eventData.actingUnit;
			if (unit.isAlive() && this.rank != 0) {
				var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
				unit.takeDamage(this.rank * vit * this.multiplier / 5, [ 'special', 'ice' ]);
				var increment = 0.1 * this.rank / 5;
				this.multiplier = Math.min(this.multiplier + increment, 2.0);
			}
			this.rank = 0;
		},
		
		unitAfflicted: function(battle, eventData) {
			if (eventData.statusID == 'frostbite') {
				eventData.cancel = true;
				term.print("Frostbite infliction overruled by Subzero");
			} else if (eventData.statusID == 'ignite') {
				eventData.cancel = true;
				term.print("Ignite is incompatible with Subzero");
			}
		}
	},
	
	// Thunderstorm field condition
	// Sometimes drops a lightning bolt on a unit at the end of their turn, dealing a small amount
	// of lightning damage and inflicting Zombie status. Wears off after 10 strikes.
	thunderstorm:
	{
		name: "Thunderstorm",
		
		initialize: function(battle) {
			this.strikesLeft = 10;
		},
		
		endTurn: function(battle, eventData) {
			if (random.chance(0.5)) {
				var unit = eventData.actingUnit;
				term.print(unit.name + " struck by lightning from Thunderstorm");
				var level = battle.getLevel();
				var attack = Game.math.statValue(100, level);
				var defense = Game.math.statValue(0, level);
				var damage = Game.math.damage.calculate(5, battle.getLevel(), unit.tier, attack, defense);
				unit.takeDamage(damage, [ 'special', 'lightning' ]);
				unit.liftStatusTags('buff');
				--this.strikesLeft;
				if (this.strikesLeft <= 0) {
					term.print("Thunderstorm has expired");
					battle.liftCondition('thunderstorm');
				} else {
					term.print("Thunderstorm will expire in " + this.strikesLeft + " more strike(s)");
				}
			}
		}
	}
};
