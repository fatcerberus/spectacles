/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('AIs/HeadlessHorseAI.js');
RequireScript('AIs/Robert2AI.js');

// Game object
// Represents the game.
Game = {
	title: "Spectacles: Bruce's Story",
	
	bossHPPerBar: 500,
	partyHPPerBar: 250,
	
	defaultBattleBGM: null,
	defaultMoveRank: 2,
	defaultItemRank: 2,
	guardBreakRank: 1,
	stanceChangeRank: 5,
	
	initialPartyMembers: [
		'scott'
	],
	
	namedStats: {
		vit: "Vitality",
		str: "Strength",
		def: "Defense",
		foc: "Focus",
		mag: "Magic",
		agi: "Agility"
	},
	
	elements: {
		fire: { name: "Fire", color: CreateColor(255, 0, 0, 255) },
		ice: { name: "Ice", color: CreateColor(0, 128, 255, 255) },
		lightning: { name: "Lightning", color: CreateColor(255, 192, 0, 255) },
		earth: { name: "Earth", color: CreateColor(255, 128, 0, 255) },
		omni: { name: "Omni", color: CreateColor(255, 255, 255, 255) },
		fat: { name: "Fat", color: CreateColor(255, 0, 255, 255) }
	},
	
	weaponTypes: {
		bow: "Bow",
		guitar: "Guitar",
		pistol: "Pistol",
		rifle: "Rifle",
		sword: "Sword"
	},
	
	moveCategories: {
		attack: "Attack",
		magic: "Magic",
		strategy: "Strategy"
	},
	
	math: {
		accuracy: {
			bow: function(userInfo, targetInfo) {
				return userInfo.stats.foc / targetInfo.stats.agi * userInfo.level / userInfo.weapon.level;
			},
			breath: function(userInfo, targetInfo) {
				return 1.0;
			},
			devour: function(userInfo, targetInfo) {
				return 1.0;
				return (100 - targetInfo.health) / 100 / targetInfo.tier
					* userInfo.stats.agi / targetInfo.stats.agi;
			},
			pistol: function(userInfo, targetInfo) {
				return 1.0;
			},
			magic: function(userInfo, targetInfo) {
				return 1.0;
			},
			physical: function(userInfo, targetInfo) {
				return 1.0;
			},
			sword: function(userInfo, targetInfo) {
				return userInfo.stats.agi * 1.5 / targetInfo.stats.agi * userInfo.level / userInfo.weapon.level;
			}
		},
		counterBonus: function(damage, unitInfo) {
			return 0.5 + 0.5 * Math.pow(unitInfo.tier, 2) * damage / unitInfo.stats.maxHP;
		},
		damage: {
			calculate: function(power, level, targetTier, attack, defense) {
				var multiplier = 1.0 + 4.0 * (level - 1) / 99;
				return 2.5 * power * multiplier / targetTier * attack / defense;
			},
			bow: function(userInfo, targetInfo, power) {
				return Game.math.damage.calculate(power, userInfo.weapon.level, targetInfo.tier,
					userInfo.stats.str,
					Game.math.statValue(0, targetInfo.level));
			},
			breath: function(userInfo, targetInfo, power) {
				return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
					Math.round((userInfo.stats.vit * 2 + userInfo.stats.mag) / 3),
					targetInfo.stats.vit);
			},
			magic: function(userInfo, targetInfo, power) {
				return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
					Math.round((userInfo.stats.mag * 2 + userInfo.stats.foc) / 3),
					targetInfo.stats.foc);
			},
			pistol: function(userInfo, targetInfo, power) {
				return Game.math.damage.calculate(power, userInfo.weapon.level, targetInfo.tier,
					Game.math.statValue(100, userInfo.level),
					targetInfo.stats.def);
			},
			physical: function(userInfo, targetInfo, power) {
				return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
					userInfo.stats.str,
					Math.round((targetInfo.stats.def * 2 + targetInfo.stats.str) / 3));
			},
			physicalRecoil: function(userInfo, targetInfo, power) {
				return Game.math.damage.calculate(power / 2, userInfo.level, targetInfo.tier,
					targetInfo.stats.str, userInfo.stats.str);
			},
			sword: function(userInfo, targetInfo, power) {
				return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
					userInfo.stats.str, targetInfo.stats.def);
			}
		},
		guardStance: {
			damageTaken: function(baseDamage, tags) {
				if (Link(tags).contains('deathblow')) {
					return baseDamage - 1;
				} else if (Link(tags).some([ 'bow', 'omni', 'special', 'zombie' ])) {
					return baseDamage;
				} else {
					return baseDamage / 2;
				}
			}
		},
		experience: {
			skill: function(skillInfo, userInfo, targetsInfo) {
				var levelSum = 0;
				var statSum = 0;
				for (var i = 0; i < targetsInfo.length; ++i) {
					levelSum += targetsInfo[i].level;
					statSum += targetsInfo[i].baseStatAverage;
				}
				var levelAverage = Math.round(levelSum / targetsInfo.length);
				var statAverage = Math.round(statSum / targetsInfo.length);
				return levelAverage * statAverage;
			},
			stat: function(statID, enemyUnitInfo) {
				return enemyUnitInfo.level * enemyUnitInfo.baseStats[statID];
			}
		},
		hp: function(unitInfo, level, tier) {
			var statAverage = Math.round((unitInfo.baseStats.vit * 10
				+ unitInfo.baseStats.str
				+ unitInfo.baseStats.def
				+ unitInfo.baseStats.foc
				+ unitInfo.baseStats.mag
				+ unitInfo.baseStats.agi) / 15);
			return 25 * tier * Game.math.statValue(statAverage, level);
		},
		mp: {
			capacity: function(battlerInfo) {
				var statAverage = Math.round((battlerInfo.baseStats.mag * 10
					+ battlerInfo.baseStats.vit
					+ battlerInfo.baseStats.str
					+ battlerInfo.baseStats.def
					+ battlerInfo.baseStats.foc
					+ battlerInfo.baseStats.agi) / 15);
				return 10 * battlerInfo.tier * Game.math.statValue(statAverage, battlerInfo.level);
			},
			usage: function(skill, level, userInfo) {
				var baseCost = 'baseMPCost' in skill ? skill.baseMPCost : 0;
				return baseCost * (level + userInfo.baseStats.mag) / 100;
			}
		},
		retreatChance: function(enemyUnitsInfo) {
			return 1.0;
		},
		skillRank: function(skill) {
			var rankTotal = 0;
			for (var i = 0; i < skill.actions.length; ++i) {
				rankTotal += skill.actions[i].rank;
			}
			return rankTotal;
		},
		statValue: function(baseStat, level) {
			return Math.round((50 + baseStat / 2) * (10 + level) / 110);
		},
		timeUntilNextTurn: function(unitInfo, rank) {
			return rank * 10000 / unitInfo.stats.agi;
		}
	},
	
	characters: {
		scott: {
			name: "Scott",
			fullName: "Scott Starcross",
			baseStats: {
				vit: 70,
				str: 70,
				def: 70,
				foc: 70,
				mag: 70,
				agi: 70
			},
			startingWeapon: 'heirloom',
			skills: [
				'swordSlash',
				'quickstrike',
				'chargeSlash',
				'flare',
				'chill',
				'lightning',
				'quake',
				'hellfire',
				'windchill',
				'electrocute',
				'upheaval',
				'protectiveAura',
				'necromancy',
				'crackdown'
			]
		},
		bruce: {
			name: "Bruce",
			fullName: "Bruce Arsen",
			baseStats: {
				vit: 65,
				str: 100,
				def: 50,
				foc: 80,
				mag: 30,
				agi: 55
			},
			autoScan: true,
			startingWeapon: 'arsenRifle',
			skills: [
				'sharpshooter',
				'shootout'
			]
		},
		elysia: {
			name: "Elysia",
			fullName: "Elysia Ilapse",
			baseStats: {
				vit: 40,
				str: 50,
				def: 50,
				foc: 90,
				mag: 75,
				agi: 100
			},
			startingWeapon: 'fireAndIce',
			skills: [
				'archery',
				'flareShot',
				'chillShot'
			]
		},
		maggie: {
			name: "maggie",
			baseStats: {
				vit: 100,
				str: 90,
				def: 85,
				foc: 65,
				mag: 30,
				agi: 35
			},
			skills: [
				'munch',
				'fatseat',
				'fatSlam'
			]
		}
	},
	
	items: {
		alcohol: {
			name: "Alcohol",
			tags: [ 'drink', 'curative' ],
			uses: 2,
			action: {
				announceAs: "Alcohol",
				effects: [
					{
						targetHint: 'selected',
						type: 'fullRecover'
					},
					{
						targetHint: 'selected',
						type: 'recoverMP',
						strength: 100
					},
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'drunk'
					}
				]
			}
		},
		holyWater: {
			name: "Holy Water",
			tags: [ 'remedy' ],
			uses: 3,
			action: {
				announceAs: "Holy Water",
				effects: [
					{
						targetHint: 'selected',
						type: 'liftStatusTags',
						tags: [ 'undead' ]
					}
				]
			}
		},
		powerTonic: {
			name: "Power Tonic",
			tags: [ 'drink', 'curative' ],
			uses: 5,
			action: {
				announceAs: "Power Tonic",
				effects: [
					{
						targetHint: 'selected',
						type: 'recoverHP',
						strength: 20
					}
				]
			}
		},
		redBull: {
			name: "Red Bull",
			tags: [ 'drink', 'curative' ],
			uses: 2,
			action: {
				announceAs: "Red Bull",
				effects: [
					{
						targetHint: 'selected',
						type: 'recoverMP',
						strength: 100
					}
				]
			}
		},
		tonic: {
			name: "Tonic",
			tags: [ 'drink', 'curative' ],
			uses: 10,
			action: {
				announceAs: "Tonic",
				effects: [
					{
						targetHint: 'selected',
						type: 'recoverHP',
						strength: 10
					}
				]
			}
		},
		vaccine: {
			name: "Vaccine",
			tags: [ 'drink' ],
			uses: 1,
			action: {
				announceAs: "Vaccine",
				effects: [
					{
						targetHint: 'selected',
						type: 'liftStatusTags',
						tags: [ 'ailment' ]
					},
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'immune'
					}
				]
			}
		}
	},
	
	conditions: {
		blackout: {
			name: "Blackout",
			actionTaken: function(battle, eventData) {
				if (eventData.targets.length == 1 && Math.random() < 0.75) {
					var target = eventData.targets[0];
					var newTargets = Math.random() < 0.5
						? battle.alliesOf(target)
						: battle.enemiesOf(target);
					var targetID = Math.min(Math.floor(Math.random() * newTargets.length), newTargets.length - 1);
					eventData.targets = [ newTargets[targetID] ];
				}
			}
		},
		generalDisarray: {
			name: "G. Disarray",
			actionTaken: function(battle, eventData) {
				eventData.action.rank = Math.floor(Math.min(Math.random() * 5 + 1, 5));
			}
		}
	},
	
	statuses: {
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
						Console.writeLine("POW modified by Crackdown to " + effect.power);
						Console.append("was: " + oldPower);
					}
				}.bind(this));
			},
			useSkill: function(unit, eventData) {
				this.multiplier = eventData.skill.category != this.lastSkillType ? 1.0
					: this.multiplier * 0.75;
				this.lastSkillType = eventData.skill.category;
				if (this.multiplier < 1.0) {
					Console.writeLine("POW modifier for Crackdown is now at ~" + Math.round(this.multiplier * 100) + "%");
				}
			}
		},
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
		drunk: {
			name: "Drunk",
			tags: [ 'acute', 'special' ],
			overrules: [ 'crackdown', 'disarray' ],
			statModifiers: {
				agi: 0.75
			},
			ignoreEvents: [
				'itemUsed',
				'skillUsed',
				'unitDamaged',
				'unitHealed',
				'unitTargeted'
			],
			initialize: function(unit) {
				this.multiplier = 2.0;
			},
			aiming: function(unit, eventData) {
				eventData.aimRate /= 2.0;
			},
			acting: function(unit, eventData) {
				Link(eventData.action.effects)
					.filterBy('targetHint', 'selected')
					.filterBy('type', 'damage')
					.each(function(effect)
				{
					var oldPower = effect.power;
					effect.power = Math.round(effect.power * this.multiplier);
					if (effect.power != oldPower) {
						Console.writeLine("Outgoing POW modified by Drunk to " + effect.power);
						Console.append("was: " + oldPower);
					}
				}.bind(this));
			},
			attacked: function(unit, eventData) {
				if (eventData.stance == BattleStance.counter) {
					this.multiplier /= 2.0;
					unit.resetCounter(5);
				}
			},
			damaged: function(unit, eventData) {
				if (Link(eventData.tags).contains('earth')) {
					eventData.amount *= 2.0;
				}
			}
		},
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
					eventData.amount *= 2.0;
					Console.writeLine("Frostbite neutralized by fire, damage increased");
					unit.liftStatus('frostbite');
				}
			},
			endTurn: function(unit, eventData) {
				unit.takeDamage(0.01 * unit.maxHP * this.multiplier, [ 'ice', 'special' ]);
				this.multiplier = Math.min(this.multiplier + 0.1, 2.0);
			}
		},
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
		ignite: {
			name: "Ignite",
			tags: [ 'ailment', 'damage' ],
			overrules: [ 'frostbite' ],
			initialize: function(unit) {
				this.multiplier = 1.0;
			},
			beginCycle: function(unit, eventData) {
				unit.takeDamage(0.01 * unit.maxHP * this.multiplier, [ 'fire', 'special' ]);
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
					eventData.amount *= 2.0;
					Console.writeLine("Ignite neutralized by ice, damage increased");
					unit.liftStatus('ignite');
				}
			}
		},
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
		lockstep: {
			name: "Lockstep",
			tags: [ 'debuff' ],
			afflicted: function(unit, eventData) {
				
			}
		},
		offGuard: {
			name: "Off Guard",
			tags: [ 'special' ],
			statModifiers: {
				def: 0.75
			},
			beginTurn: function(unit, eventData) {
				unit.liftStatus('offGuard');
			}
		},
		protect: {
			name: "Protect",
			tags: [ 'buff' ],
			initialize: function(unit) {
				this.multiplier = 0.5;
			},
			damaged: function(unit, eventData) {
				var isProtected = !Link(eventData.tags).some([ 'special', 'zombie' ]);
				if (isProtected) {
					eventData.amount *= this.multiplier;
					this.multiplier += 0.05;
					if (this.multiplier >= 1.0) {
						unit.liftStatus('protect');
					}
				}
			}
		},
		reGen: {
			name: "ReGen",
			tags: [ 'buff' ],
			beginCycle: function(unit, eventData) {
				unit.heal(0.01 * unit.maxHP, [ 'reGen' ]);
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
					eventData.damage *= 1.5;
				}
			}
		},
		skeleton: {
			name: "Skeleton",
			tags: [ 'undead' ],
			overrules: [ 'ghost', 'zombie' ],
			statModifiers: {
				str: 0.5,
				mag: 0.5
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
	},
	
	effects: {
		addStatus: function(actor, targets, effect) {
			Link(targets).invoke('addStatus', effect.status);
		},
		damage: function(actor, targets, effect) {
			var userInfo = actor.battlerInfo;
			for (var i = 0; i < targets.length; ++i) {
				var targetInfo = targets[i].battlerInfo;
				var damageTags = [ effect.damageType ];
				if ('element' in effect) {
					damageTags.push(effect.element);
				}
				var damage = Math.max(Math.round(Game.math.damage[effect.damageType](userInfo, targetInfo, effect.power)), 1);
				targets[i].takeDamage(Math.max(damage + damage * 0.2 * (Math.random() - 0.5), 1), damageTags);
				var recoilFunction = effect.damageType + "Recoil";
				if (recoilFunction in Game.math.damage) {
					var recoil = Math.round(Game.math.damage[recoilFunction](userInfo, targetInfo, effect.power));
					actor.takeDamage(Math.max(recoil + recoil * 0.2 * (Math.random() - 0.5), 1), [ 'recoil' ], true);
				}
				if ('addStatus' in effect) {
					var statusChance = 'statusChance' in effect ? effect.statusChance / 100 : 1.0;
					if (statusChance > Math.random()) {
						targets[i].addStatus(effect.addStatus, true);
					}
				}
			}
		},
		devour: function(actor, targets, effect) {
			var healAmount = 0;
			for (var i = 0; i < targets.length; ++i) {
				if (!targets[i].isPartyMember()) {
					var munchData = targets[i].enemyInfo.munchData;
					var experience = Game.math.experience.skill(munchData.skill, actor.battlerInfo, [ targets[i].battlerInfo ]);
					actor.growSkill(munchData.skill, experience);
				}
				healAmount += Math.round(targets[i].maxHP / 10);
				Console.writeLine(targets[i].fullName + " got eaten by " + actor.name);
				new Scenario()
					.playSound("Munch.wav")
					.run();
				targets[i].die();
			}
			actor.heal(healAmount, [ 'munch' ]);
		},
		fullRecover: function(actor, targets, effect) {
			Link(targets)
				.where(function(unit) { return !unit.hasStatus('zombie'); })
				.each(function(unit)
			{
				unit.heal(unit.maxHP - unit.hp, [ 'cure' ]);
			});
		},
		instaKill: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].takeDamage(Math.max(targets[i].hp, 1), [ effect.damageType, 'deathblow' ]);
			}
		},
		liftStatus: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				for (var i2 = 0; i2 < effect.statuses.length; ++i2) {
					targets[i].liftStatus(effect.statuses[i2]);
				}
			}
		},
		liftStatusTags: function(actor, targets, effect) {
			Link(targets).invoke('liftStatusTags', effect.tags);
		},
		recoverHP: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				var vitality = targets[i].battlerInfo.stats.vit;
				var tier = targets[i].battlerInfo.tier;
				targets[i].heal(effect.strength * vitality / tier, [ 'cure' ]);
			}
		},
		recoverMP: function(actor, targets, effect) {
			Link(targets).invoke('restoreMP', effect.strength);
		}
	},
	
	skills: {
		// Bow & Arrow moves
		archery: {
			name: "Archery",
			category: 'attack',
			weaponType: 'bow',
			targetType: 'single',
			actions: [
				{
					announceAs: "Archery",
					rank: 1,
					accuracyType: 'bow',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'bow',
							power: 15
						}
					],
				}
			]
		},
		
		flareShot: {
			name: "Flare Shot",
			category: 'attack',
			weaponType: 'bow',
			targetType: 'single',
			baseMPCost: 10,
			actions: [
				{
					announceAs: "Flare Shot",
					rank: 2,
					accuracyType: 'bow',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'bow',
							power: 10,
							element: 'fire',
							addStatus: 'ignite',
							statusChance: 50
						}
					],
				}
			]
		},
		
		chillShot: {
			name: "Chill Shot",
			category: 'attack',
			weaponType: 'bow',
			targetType: 'single',
			baseMPCost: 10,
			actions: [
				{
					announceAs: "Chill Shot",
					rank: 2,
					accuracyType: 'bow',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'bow',
							power: 10,
							element: 'ice',
							addStatus: 'frostbite',
							statusChance: 50
						}
					],
				}
			]
		},
		
		chargeSlash: {
			name: "Charge Slash",
			category: 'attack',
			weaponType: 'sword',
			targetType: 'single',
			actions: [
				{
					announceAs: "Charging Up...",
					rank: 2,
					preserveGuard: true,
					effects: [
						{
							targetHint: "user",
							type: 'addStatus',
							status: 'offGuard'
						}
					]
				},
				{
					announceAs: "Charge Slash",
					rank: 3,
					accuracyType: 'sword',
					isMelee: true,
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'sword',
							power: 50
						}
					]
				}
			]
		},
		chill: {
			name: "Chill",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 10,
			actions: [
				{
					announceAs: "Chill",
					rank: 2,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 25,
							element: 'ice'
						}
					],
				}
			]
		},
		crackdown: {
			name: "Crackdown",
			category: 'strategy',
			targetType: 'single',
			baseMPCost: 200,
			allowAsCounter: false,
			actions: [
				{
					announceAs: "Crackdown",
					rank: 3,
					effects: [
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'crackdown'
						}
					]
				}
			]
		},
		desperationSlash: {
			name: "Desperation Slash",
			category: 'attack',
			weaponType: 'sword',
			targetType: 'single',
			actions: [
				{
					announceAs: "#9's Desperation...",
					rank: 3,
					preserveGuard: true,
					effects: [
						{
							targetHint: 'user',
							type: 'addStatus',
							status: 'offGuard'
						}
					]
				},
				{
					announceAs: "Desperation Slash",
					rank: 5,
					accuracyType: 'sword',
					isMelee: true,
					effects: [
						{
							targetHint: 'selected',
							type: 'instaKill',
							damageType: 'sword'
						}
					]
				}
			]
		},
		electrocute: {
			name: "Electrocute",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 50,
			actions: [
				{
					announceAs: "Electrocute",
					rank: 3,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 50,
							element: 'lightning',
							addStatus: 'zombie'
						}
					]
				}
			]
		},
		fatSlam: {
			name: "Fat Slam",
			category: 'attack',
			targetType: 'single',
			actions: [
				{
					announceAs: "Fat Slam",
					rank: 3,
					accuracyType: 'physical',
					isMelee: true,
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'physical',
							power: 75,
							element: 'fat'
						}
					],
				}
			]
		},
		fatseat: {
			name: "Fatseat",
			category: 'attack',
			targetType: 'allEnemies',
			actions: [
				{
					announceAs: "Fatseat",
					rank: 2,
					accuracyType: 'physical',
					isMelee: true,
					preserveGuard: true,
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'physical',
							power: 25,
							element: 'fat'
						}
					],
				}
			]
		},
		flameBreath: {
			name: "Flame Breath",
			category: 'magic',
			targetType: 'allEnemies',
			baseMPCost: 25,
			actions: [
				{
					announceAs: "Flame Breath",
					rank: 2,
					accuracyType: 'breath',
					preserveGuard: true,
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'breath',
							power: 20,
							element: 'fire',
							addStatus: 'ignite'
						}
					],
				}
			]
		},
		flare: {
			name: "Flare",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 10,
			actions: [
				{
					announceAs: "Flare",
					rank: 2,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 25,
							element: 'fire'
						}
					],
				}
			]
		},
		hellfire: {
			name: "Hellfire",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 50,
			actions: [
				{
					announceAs: "Hellfire",
					rank: 3,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 50,
							element: 'fire',
							addStatus: 'ignite'
						}
					]
				}
			]
		},
		lightning: {
			name: "Lightning",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 10,
			actions: [
				{
					announceAs: "Lightning",
					rank: 2,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 25,
							element: 'lightning'
						}
					],
				}
			]
		},
		munch: {
			name: "Munch",
			category: 'attack',
			targetType: 'single',
			actions: [
				{
					announceAs: "Munch",
					rank: 5,
					accuracyType: 'devour',
					isMelee: true,
					effects: [
						{
							element: 'fat',
							targetHint: 'selected',
							type: 'devour',
							successRate: 1.0
						}
					],
				}
			]
		},
		necromancy: {
			name: "Necromancy",
			category: 'strategy',
			targetType: 'single',
			baseMPCost: 25,
			allowAsCounter: false,
			actions: [
				{
					announceAs: "Necromancy",
					rank: 3,
					effects: [
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'zombie'
						}
					]
				}
			]
		},
		omni: {
			name: "Omni",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 100,
			actions: [
				{
					announceAs: "Omni",
					rank: 4,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 100,
							element: 'omni'
						}
					]
				}
			]
		},
		protectiveAura: {
			name: "Protective Aura",
			category: 'strategy',
			targetType: 'ally',
			baseMPCost: 200,
			allowAsCounter: false,
			actions: [
				{
					announceAs: "Protective Aura",
					rank: 3,
					effects: [
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'protect'
						}
					]
				}
			]
		},
		quake: {
			name: "Quake",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 10,
			actions: [
				{
					announceAs: "Quake",
					rank: 2,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 25,
							element: 'earth'
						}
					],
				}
			]
		},
		quickstrike: {
			name: "Quickstrike",
			category: 'attack',
			weaponType: 'sword',
			targetType: 'single',
			actions: [
				{
					announceAs: "Quickstrike",
					isMelee: true,
					preserveGuard: true,
					rank: 1,
					accuracyType: 'sword',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'sword',
							power: 5
						}
					]
				}
			]
		},
		rearingKick: {
			name: "Rearing Kick",
			category: 'attack',
			targetType: 'single',
			actions: [
				{
					announceAs: "Rear Up",
					rank: 1,
					preserveGuard: true,
					effects: [
						{
							targetHint: 'user',
							type: 'addStatus',
							status: 'rearing'
						}
					]
				},
				{
					announceAs: "Rearing Kick",
					rank: 2,
					accuracyType: 'physical',
					isMelee: true,
					effects: [
						{
							targetHint: 'user',
							type: 'liftStatus',
							statuses: [ 'ghost' ]
						},
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'physical',
							power: 25
						}
					]
				}
			]
		},
		sharpshooter: {
			name: "Sharpshooter",
			category: 'attack',
			weaponType: 'rifle',
			targetType: 'single',
			actions: [
				{
					announceAs: "Sharpshooter",
					rank: 3,
					accuracyType: 'pistol',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'pistol',
							power: 20
						}
					]
				}
			]
		},
		shootout: {
			name: "Shootout",
			category: 'attack',
			weaponType: 'pistol',
			targetType: 'allEnemies',
			actions: [
				{
					announceAs: "Shootout",
					rank: 3,
					accuracyType: 'pistol',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'pistol',
							power: 50
						}
					]
				}
			]
		},
		spectralDraw: {
			name: "Spectral Draw",
			category: 'strategy',
			targetType: 'single',
			baseMPCost: 25,
			actions: [
				{
					announceAs: "Spectral Draw",
					rank: 3,
					effects: [
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'ghost'
						}
					]
				}
			]
		},
		spectralKick: {
			name: "Spectral Kick",
			category: 'attack',
			targetType: 'single',
			actions: [
				{
					announceAs: "Rear Up",
					rank: 1,
					preserveGuard: true,
					effects: [
						{
							targetHint: 'user',
							type: 'addStatus',
							status: 'rearing'
						}
					]
				},
				{
					announceAs: "Spectral Kick",
					rank: 2,
					accuracyType: 'physical',
					isMelee: true,
					effects: [
						{
							targetHint: 'user',
							type: 'addStatus',
							status: 'ghost'
						},
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'physical',
							power: 50
						}
					]
				}
			]
		},
		swordSlash: {
			name: "Sword Slash",
			category: 'attack',
			weaponType: 'sword',
			targetType: 'single',
			actions: [
				{
					announceAs: "Sword Slash",
					rank: 2,
					accuracyType: 'sword',
					isMelee: true,
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'sword',
							power: 15
						}
					]
				}
			]
		},
		trample: {
			name: "Trample",
			category: 'physical',
			targetType: 'single',
			actions: [
				{
					announceAs: "Trample",
					rank: 2,
					accuracyType: 'physical',
					isMelee: true,
					effects: [
						{
							targetHint: 'selected',
							type: 'instaKill',
							damageType: 'physical'
						}
					]
				}
			]
		},
		upheaval: {
			name: "Upheaval",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 50,
			actions: [
				{
					announceAs: "Upheaval",
					rank: 3,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 50,
							element: 'earth',
							addStatus: 'disarray'
						}
					]
				}
			]
		},
		windchill: {
			name: "Windchill",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 50,
			actions: [
				{
					announceAs: "Windchill",
					rank: 3,
					accuracyType: 'magic',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'magic',
							power: 50,
							element: 'ice',
							addStatus: 'frostbite'
						}
					]
				}
			]
		}
	},
	
	weapons: {
		heirloom: {
			name: "Heirloom",
			type: 'sword',
			level: 5,
			techniques: [
				'swordSlash',
				'quickstrike'
			]
		},
		templeSword: {
			name: "Temple Sword",
			type: 'sword',
			level: 75,
			techniques: [
				'swordSlash',
				'quickstrike',
				'chargeSlash'
			]
		},
		arsenRifle: {
			name: "Arsen's Rifle",
			type: 'rifle',
			level: 5,
			techniques: [
				'sharpshooter'
			]
		},
		fireAndIce: {
			name: "Fire & Ice",
			type: 'bow',
			level: 5,
			techniques: [
				'archery',
				'flareShot',
				'chillShot'
			]
		},
		rsbSword: {
			type: 'sword',
			level: 60,
			techniques: [
				'swordSlash',
				'quickStrike',
				'chargeSlash'
			]
		}
	},
	
	enemies: {
		headlessHorse: {
			name: "H. Horse",
			fullName: "Headless Horse",
			aiType: HeadlessHorseAI,
			hasLifeBar: true,
			tier: 3,
			baseStats: {
				vit: 50,
				str: 10,
				def: 55,
				foc: 65,
				mag: 30,
				agi: 70
			},
			damageModifiers: {
				bow: 1.5,
				gun: 1.5,
				fire: -1.0,
				ice: 2.0,
				fat: 1.5
			},
			immunities: [],
			munchData: {
				skill: 'spectralDraw'
			}
		},
		robert2: {
			name: "Robert",
			fullName: "Robert Spellbinder",
			aiType: Robert2AI,
			hasLifeBar: true,
			tier: 3,
			baseStats: {
				vit: 75,
				str: 75,
				def: 75,
				foc: 75,
				mag: 75,
				agi: 75
			},
			immunities: [],
			weapon: 'rsbSword',
			munchData: {
				skill: 'omni'
			},
			items: [
				'tonic',
				'powerTonic',
				'redBull',
				'holyWater',
				'vaccine',
				'alcohol'
			]
		}
	},
	
	battles: {
		headlessHorse: {
			title: "Headless Horse",
			bgm: 'ManorBoss',
			battleLevel: 8,
			enemies: [
				'headlessHorse'
			],
			onStart: function() {
				new Scenario()
					.talk("maggie", true, 2.0,
						"I'd suggest keeping your wits about you while fighting this thing if you don't want to be barbequed. It won't hesitate to roast you--and then I'd have to eat you!")
					.run(true);
			}
		},
		robert2: {
			title: "Robert Spellbinder",
			bgm: 'ThePromise',
			battleLevel: 50,
			enemies: [
				'robert2'
			],
			onStart: function() {
				new Scenario()
					.talk("Robert", true, 2.0,
						"Bruce's death changed nothing. If anything, it's made you far too reckless. Look around, "
						+ "Scott! Where are your friends? Did they abandon you in your most desperate hour, or are you truly so "
						+ "brazen as to face me alone?")
					.talk("Scott", true, 2.0,
						"I owe Bruce my life, Robert! To let his story end here... that's something I won't allow. "
						+ "Not now. Not when I know just what my world would become if I did!")
					.pause(2.0)
					.talk("Robert", true, 1.0, "What makes you so sure you have a choice?")
					.synchronize()
					.run(true);
				this.playerUnits[0].addStatus('reGen');
			}
		}
	}
};
