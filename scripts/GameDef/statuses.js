/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.statuses =
{
	// Crackdown status
	// Progressively lowers the efficacy of attacks when the same type of
	// attack is used in succession.
	crackdown: {
		name: "Crackdown",
		tags: [ 'debuff' ],
		initialize: function(unit) {
			this.lastSkillType = null;
			this.multiplier = 1.0;
		},
		acting: function(unit, eventData) {
			Link(eventData.action.effects)
				.filterBy('type', 'damage')
				.each(function(effect)
			{
				var oldPower = effect.power;
				effect.power = Math.max(Math.round(effect.power * this.multiplier), 1);
				if (effect.power != oldPower) {
					Console.writeLine("Outgoing POW modified by Crackdown to " + effect.power);
					Console.append("was: " + oldPower);
				}
			}.bind(this));
		},
		useSkill: function(unit, eventData) {
			var oldMultiplier = this.multiplier;
			this.multiplier = eventData.skill.category == this.lastSkillType
				? this.multiplier / Math.sqrt(Game.bonusMultiplier)
				: 1.0;
			this.lastSkillType = eventData.skill.category;
			if (this.multiplier != oldMultiplier) {
				if (this.multiplier < 1.0) {
					Console.writeLine("Crackdown POW modifier dropped to ~" + Math.round(this.multiplier * 100) + "%");
				} else {
					Console.writeLine("Crackdown POW modifier reset to 100%");
				}
			}
		}
	},
	
	// Disarray status
	// Randomizes the rank of any action, excluding stance changes, taken by the affected unit.
	// Lasts for 3 attacks.
	disarray: {
		name: "Disarray",
		tags: [ 'acute', 'ailment' ],
		initialize: function(unit) {
			this.actionsTaken = 0;
		},
		acting: function(unit, eventData) {
			var oldRank = eventData.action.rank;
			eventData.action.rank = Math.floor(Math.min(Math.random() * 5 + 1, 5));
			if (eventData.action.rank != oldRank) {
				Console.writeLine("Rank modified by Disarray to " + eventData.action.rank);
				Console.append("was: " + oldRank);
			}
			++this.actionsTaken;
			Console.writeLine(this.actionsTaken < 3
				? "Disarray will expire after " + (3 - this.actionsTaken) + " more action(s)"
				: "Disarray has expired");
			if (this.actionsTaken >= 3) {
				unit.liftStatus('disarray');
			}
		}
	},
	
	// Drunk status
	// Increases attack power, but reduces the affected unit's speed and accuracy and
	// creates a weakness to Earth damage.
	drunk: {
		name: "Drunk",
		tags: [ 'acute' ],
		overrules: [ 'immune' ],
		statModifiers: {
			agi: 1 / Game.bonusMultiplier
		},
		ignoreEvents: [
			'itemUsed',
			'skillUsed',
			'unitDamaged',
			'unitHealed',
			'unitTargeted'
		],
		initialize: function(unit) {
			this.turnsLeft = 10 - Math.round(5 * unit.battlerInfo.baseStats.vit / 100) + 1;
		},
		acting: function(unit, eventData) {
			Link(eventData.action.effects)
				.filterBy('targetHint', 'selected')
				.filterBy('type', 'damage')
				.each(function(effect)
			{
				var oldPower = effect.power;
				effect.power = Math.round(Game.bonusMultiplier * effect.power);
				if (effect.power != oldPower) {
					Console.writeLine("Outgoing POW modified by Drunk to " + effect.power);
					Console.append("was: " + oldPower);
				}
			}.bind(this));
		},
		aiming: function(unit, eventData) {
			eventData.aimRate /= Math.sqrt(Game.bonusMultiplier);
		},
		beginTurn: function(unit, eventData) {
			--this.turnsLeft;
			if (this.turnsLeft <= 0) {
				unit.liftStatus('drunk');
			}
		},
		damaged: function(unit, eventData) {
			if (Link(eventData.tags).contains('earth')) {
				eventData.amount *= Game.bonusMultiplier;
			}
		},
	},
	
	// Final Stand status
	// Progressively weakens the affected unit and causes knockback delay when an
	// attack is countered.
	finalStand: {
		name: "Final Stand",
		tags: [ 'special' ],
		overrules: [ 'crackdown', 'disarray' ],
		initialize: function(unit) {
			this.fatigue = 1.0;
			this.knockback = 5;
		},
		acting: function(unit, eventData) {
			Link(eventData.action.effects)
				.filterBy('targetHint', 'selected')
				.filterBy('type', 'damage')
				.each(function(effect)
			{
				var oldPower = effect.power;
				effect.power = Math.round(effect.power / this.fatigue);
				if (effect.power != oldPower) {
					Console.writeLine("Outgoing POW modified by Final Stand to " + effect.power);
					Console.append("was: " + oldPower);
				}
			}.bind(this));
		},
		attacked: function(unit, eventData) {
			if (eventData.stance == BattleStance.counter) {
				this.fatigue *= Math.sqrt(Game.bonusMultiplier);
				unit.resetCounter(this.knockback);
				++this.knockback;
			}
		},
		damaged: function(unit, eventData) {
			if (!Link(eventData.tags).contains('zombie')) {
				eventData.amount *= this.fatigue;
			}
		}
	},
	
	// Frostbite status
	// Inflicts a small amount of Ice damage at the end of the affected unit's turn.
	// The effect progressively worsens, up to double its original severity.
	frostbite: {
		name: "Frostbite",
		tags: [ 'ailment', 'damage' ],
		overrules: [ 'ignite' ],
		initialize: function(unit) {
			this.multiplier = 1.0;
		},
		attacked: function(unit, eventData) {
			Link(eventData.action.effects)
				.filterBy('type', 'damage')
				.each(function(effect)
			{
				if ('addStatus' in effect && effect.addStatus == 'ignite') {
					delete effect.addStatus;
				}
			});
			Link(eventData.action.effects)
				.where(function(effect) { return effect.type == 'addStatus' && effect.status == 'ignite'; })
				.each(function(effect)
			{
				effect.type = null;
			});
		},
		damaged: function(unit, eventData) {
			if (Link(eventData.tags).contains('fire') && unit.stance != BattleStance.guard) {
				eventData.amount *= Game.bonusMultiplier;
				Console.writeLine("Frostbite neutralized by fire, damage increased");
				unit.liftStatus('frostbite');
			}
		},
		endTurn: function(unit, eventData) {
			var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.takeDamage(0.5 * vit * this.multiplier, [ 'ice', 'special' ]);
			this.multiplier = Math.min(this.multiplier + 0.1, 2.0);
		}
	},
	
	// Ghost status
	// Prevents the affected unit from being hit with physical or projectile attacks
	// from a non-Ghost and vice versa.
	ghost: {
		name: "Ghost",
		tags: [ 'ailment', 'undead' ],
		overrules: [ 'zombie' ],
		aiming: function(unit, eventData) {
			for (var i = 0; i < eventData.action.effects.length; ++i) {
				var effect = eventData.action.effects[i];
				if (effect.type != 'damage' || effect.damageType == 'magic') {
					continue;
				}
				if (!Link(eventData.targetInfo.statuses).contains('ghost')) {
					eventData.aimRate = 0.0;
				}
			}
		},
		attacked: function(unit, eventData) {
			for (var i = 0; i < eventData.action.effects.length; ++i) {
				var effect = eventData.action.effects[i];
				if (effect.type != 'damage' || effect.damageType == 'magic') {
					continue;
				}
				if (!Link(eventData.actingUnitInfo.statuses).contains('ghost')) {
					eventData.action.accuracyRate = 0.0;
				}
			}
		}
	},
	
	// Ignite status
	// Inflicts a small amount of Fire damage on the affected unit once per cycle. The
	// effect progressively diminishes, ultimately settling at half of its initial severity.
	ignite: {
		name: "Ignite",
		tags: [ 'ailment', 'damage' ],
		overrules: [ 'frostbite' ],
		initialize: function(unit) {
			this.multiplier = 1.0;
		},
		beginCycle: function(unit, eventData) {
			var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.takeDamage(0.5 * vit * this.multiplier, [ 'fire', 'special' ]);
			this.multiplier = Math.max(this.multiplier - 0.05, 0.5);
		},
		attacked: function(unit, eventData) {
			Link(eventData.action.effects)
				.filterBy('type', 'damage')
				.each(function(effect)
			{
				if ('addStatus' in effect && effect.addStatus == 'frostbite') {
					delete effect.addStatus;
				}
			});
			Link(eventData.action.effects)
				.where(function(effect) { return effect.type == 'addStatus' && effect.status == 'frostbite'; })
				.each(function(effect)
			{
				effect.type = null;
			});
		},
		damaged: function(unit, eventData) {
			if (Link(eventData.tags).contains('ice') && unit.stance != BattleStance.guard) {
				eventData.amount *= Game.bonusMultiplier;
				Console.writeLine("Ignite neutralized by ice, damage increased");
				unit.liftStatus('ignite');
			}
		}
	},
	
	// Immune status
	// Grants the affected unit full immunity to most negative status afflictions
	// for a limited time.
	immune: {
		name: "Immune",
		tags: [ 'buff' ],
		initialize: function(unit) {
			this.turnCount = 0;
		},
		afflicted: function(unit, eventData) {
			var statusDef = Game.statuses[eventData.statusID];
			if (Link(statusDef.tags).contains('ailment')) {
				Console.writeLine("Status " + statusDef.name + " was blocked by Immune");
				eventData.statusID = null;
			}
		},
		beginTurn: function(unit, eventData) {
			++this.turnCount;
			if (this.turnCount > 5) {
				unit.liftStatus('immune');
			}
		}
	},
	
	// Off Guard status
	// Imbued as part of several two-turn attacks such as Charge Slash. If the unit
	// is damaged by an attack while Off Guard, the damage will be increased.
	offGuard: {
		name: "Off Guard",
		tags: [ 'special' ],
		beginTurn: function(unit, eventData) {
			unit.liftStatus('offGuard');
		},
		damaged: function(unit, eventData) {
			if (eventData.attacker !== null) {
				eventData.amount *= Math.sqrt(Game.bonusMultiplier);
			}
		}
	},
	
	// Protect status
	// Reduces damage from attacks. Each time the Protected unit is damaged by an attack,
	// the effectiveness of Protect is reduced.
	protect: {
		name: "Protect",
		tags: [ 'buff' ],
		initialize: function(unit) {
			this.multiplier = 1 / Game.bonusMultiplier;
			this.lossPerHit = (1.0 - this.multiplier) / 10;
		},
		damaged: function(unit, eventData) {
			var isProtected = !Link(eventData.tags).some([ 'special', 'zombie' ]);
			if (isProtected) {
				eventData.amount *= this.multiplier;
				this.multiplier += this.lossPerHit;
				if (this.multiplier >= 1.0) {
					unit.liftStatus('protect');
				}
			}
		}
	},
	
	// ReGen status
	// Restores a small amount of HP to the affected unit at the beginning of each
	// cycle.
	reGen: {
		name: "ReGen",
		tags: [ 'buff' ],
		beginCycle: function(unit, eventData) {
			var vit = Game.math.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.heal(0.25 * vit, [ 'reGen' ]);
		}
	},
	
	rearing: {
		name: "Rearing",
		category: [ 'special' ],
		beginTurn: function(unit, eventData) {
			unit.liftStatus('rearing');
		},
		damaged: function(unit, eventData) {
			if (Link(eventData.tags).some([ 'physical', 'earth' ])) {
				unit.clearQueue();
				unit.liftStatus('rearing');
				unit.resetCounter(5);
			}
			if (!Link(eventData.tags).some([ 'special', 'magic' ])) {
				eventData.damage *= 2;
			}
		}
	},
	
	// Skeleton status
	// The affected unit is still able to battle at 0 HP, but with reduced STR and MAG stats.
	// Taking physical or slash damage in this state will result in death.
	skeleton: {
		name: "Skeleton",
		tags: [ 'undead' ],
		overrules: [ 'ghost', 'zombie' ],
		statModifiers: {
			str: 1 / Game.bonusMultiplier,
			mag: 1 / Game.bonusMultiplier
		},
		initialize: function(unit) {
			this.allowDeath = false;
		},
		cured: function(unit, eventData) {
			if (eventData.statusID == 'skeleton') {
				unit.heal(1, [], true);
			}
		},
		damaged: function(unit, eventData) {
			this.allowDeath = Link(eventData.tags)
				.some([ 'zombie', 'physical', 'sword', 'earth', 'omni' ]);
			if (!this.allowDeath) {
				eventData.amount = 0;
			}
		},
		dying: function(unit, eventData) {
			eventData.cancel = !this.allowDeath;
		},
		healed: function(unit, eventData) {
			if (Link(eventData.tags).contains('cure')) {
				unit.takeDamage(eventData.amount, [ 'zombie' ]);
			}
			eventData.amount = 0;
		}
	},
	
	sniper: {
		name: "Sniper",
		tags: [ 'special' ],
		beginTurn: function(unit, eventData) {
			unit.liftStatus('sniper');
		},
		damaged: function(unit, eventData) {
			if (!Link(eventData.tags).some([ 'special', 'zombie' ])) {
				eventData.amount *= 1.33;
				unit.clearQueue();
				unit.liftStatus('sniper');
				unit.resetCounter(1);
			}
		}
	},
	
	sleep: {
		name: "Sleep",
		tags: [ 'acute' ],
		overrules: [ 'drunk', 'offGuard' ],
		initialize: function(unit) {
			unit.actor.animate('sleep');
			this.wakeChance = 0.0;
		},
		beginCycle: function(unit, eventData) {
			if (Math.random() < this.wakeChance) {
				unit.liftStatus('sleep');
			}
			this.wakeChance += 0.01;
		},
		beginTurn: function(unit, eventData) {
			eventData.skipTurn = true;
			unit.actor.animate('snore');
		},
		damaged: function(unit, eventData) {
			var healthLost = 100 * eventData.amount / unit.maxHP;
			if (Math.random() < healthLost * 5 * this.wakeChance
				&& eventData.tags.indexOf('magic') === -1
				&& eventData.tags.indexOf('special') === -1)
			{
				unit.liftStatus('sleep');
			}
		}
	},
	
	// Zombie status
	// Causes curative magic and items to inflict damage instead of healing.
	// If the affected unit reaches 0 HP, this status will progress to Skeleton and
	// the unit will be allowed to continue battling. Converted restoratives will
	// kill outright, however.
	zombie: {
		name: "Zombie",
		tags: [ 'ailment', 'undead' ],
		initialize: function(unit) {
			this.allowDeath = false;
		},
		damaged: function(unit, eventData) {
			this.allowDeath = Link(eventData.tags).contains('zombie');
		},
		dying: function(unit, eventData) {
			if (!this.allowDeath) {
				unit.addStatus('skeleton');
				eventData.cancel = true;
			}
		},
		healed: function(unit, eventData) {
			if (Link(eventData.tags).some([ 'cure', 'reGen' ])) {
				unit.takeDamage(eventData.amount, [ 'zombie' ]);
				eventData.amount = 0;
			}
		}
	}
};