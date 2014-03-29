/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// Game object
// Represents the game.
Game = {
	title: "Spectacles: Bruce's Story",
	
	defaultBattleBGM: null,
	defaultMoveRank: 2,
	defaultItemRank: 3,
	defenseBreakRank: 3,
	
	initialPartyMembers: [
		'scott',
		'bruce',
		'maggie'
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
		sword: "Sword",
		strategy: "Strategy",
		magic: "Magic"
	},
	
	math: {
		accuracy: {
			bow: function(userInfo, target) {
				return 1.0;
			},
			breath: function(userInfo, targetInfo) {
				return 1.0;
			},
			devour: function(userInfo, targetInfo) {
				return (userInfo.health - targetInfo.health) * userInfo.stats.agi / targetInfo.stats.agi / 400;
			},
			instaKill: function(userInfo, targetInfo) {
				return 1.0;
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
				return 1.0;
			}
		},
		damage: {
			bow: function(userInfo, targetInfo, power) {
				return power * userInfo.tier * (userInfo.weapon.level + userInfo.stats.str) / Game.math.statValue(0, targetInfo.level);
			},
			breath: function(userInfo, targetInfo, power) {
				return power * userInfo.tier * (userInfo.level + (userInfo.stats.vit * 2 + userInfo.stats.mag) / 3) / targetInfo.stats.vit;
			},
			magic: function(userInfo, targetInfo, power) {
				return power * userInfo.tier * (userInfo.level + (userInfo.stats.mag * 2 + userInfo.stats.foc) / 3) / targetInfo.stats.foc;
			},
			pistol: function(userInfo, targetInfo, power) {
				return power * userInfo.tier * userInfo.weapon.level * 2 / targetInfo.stats.def;
			},
			physical: function(userInfo, targetInfo, power) {
				return power * userInfo.tier * (userInfo.level + userInfo.stats.str) / ((targetInfo.stats.def * 2 + targetInfo.stats.str) / 3);
			},
			sword: function(userInfo, targetInfo, power) {
				return power * userInfo.tier * (userInfo.weapon.level + userInfo.stats.str) / targetInfo.stats.def;
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
			return 25 * tier * (50 + statAverage / 2) * (10 + level) / 110;
		},
		/*hp: {
			enemy: function(enemyInfo, level) {
				var statAverage = Math.round((enemyInfo.baseStats.vit * 10
					+ enemyInfo.baseStats.str
					+ enemyInfo.baseStats.def
					+ enemyInfo.baseStats.foc
					+ enemyInfo.baseStats.mag
					+ enemyInfo.baseStats.agi) / 15);
				return 100 * (50 + statAverage / 2) * (10 + level) / 110;
			},
			partyMember: function(characterInfo, level) {
				var statAverage = Math.round((characterInfo.baseStats.vit * 10
					+ characterInfo.baseStats.str
					+ characterInfo.baseStats.def
					+ characterInfo.baseStats.foc
					+ characterInfo.baseStats.mag
					+ characterInfo.baseStats.agi) / 15);
				return 15 * (50 + statAverage / 2) * (10 + level) / 110;
			}
		},*/
		mp: {
			capacity: function(battlerInfo) {
				var statAverage = Math.round((battlerInfo.baseStats.mag * 10
					+ battlerInfo.baseStats.vit
					+ battlerInfo.baseStats.str
					+ battlerInfo.baseStats.def
					+ battlerInfo.baseStats.foc
					+ battlerInfo.baseStats.agi) / 15);
				return 10 * battlerInfo.tier * (50 + statAverage / 2) * (10 + battlerInfo.level) / 110;
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
			return (50 + baseStat / 2) * (10 + level) / 110;
		},
		timeUntilNextTurn: function(unitInfo, rank) {
			return Math.ceil(rank * 10000 / unitInfo.stats.agi);
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
			startingWeapon: 'templeSword',
			skills: [
				'swordSlash',
				'quickstrike',
				/*'chargeSlash',
				'necromancy',
				'crackdown',*/
				'flare',
				'chill',
				'lightning',
				'quake',
				/*'hellfire',
				'windchill',
				'electrocute',
				'upheaval'*/
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
			startingWeapon: 'arsenRifle',
			skills: [
				'sharpshooter',
				'shootout'
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
				'fatSlam'
			]
		}
	},
	
	items: {
		alcohol: {
			name: "Alcohol",
			type: 'drink',
			action: {
				announceAs: "Alcohol",
				effects: [
					{
						targetHint: 'selected',
						type: 'recoverAll'
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
			type: 'drink',
			action: {
				announceAs: "Holy Water",
				effects: [
					{
						targetHint: 'selected',
						type: 'liftStatus',
						status: 'skeleton'
					},
					{
						targetHint: 'selected',
						type: 'liftStatus',
						status: 'zombie'
					}
				]
			}
		},
		powerTonic: {
			name: "Power Tonic",
			type: 'drink',
			uses: 2,
			action: {
				announceAs: "Power Tonic",
				effects: [
					{
						targetHint: 'selected',
						type: 'recoverHP',
						strength: 70
					}
				]
			}
		},
		tonic: {
			name: "Tonic",
			type: 'drink',
			uses: 5,
			action: {
				announceAs: "Tonic",
				effects: [
					{
						targetHint: 'selected',
						type: 'recoverHP',
						strength: 35
					}
				]
			}
		},
		vaccine: {
			name: "Vaccine",
			type: 'drink',
			uses: 1,
			action: {
				announceAs: "Vaccine",
				effects: [
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
			category: 'debuff',
			initialize: function(unit) {
				this.lastSkillType = null;
				this.multiplier = 1.0;
			},
			acting: function(unit, eventData) {
				for (var i = 0; i < eventData.action.effects.length; ++i) {
					var effect = eventData.action.effects[i];
					if (effect.type == 'damage') {
						effect.power = Math.ceil(effect.power * this.multiplier);
					}
				}
			},
			useSkill: function(unit, eventData) {
				this.multiplier = eventData.skill.category != this.lastSkillType ? 1.0
					: this.multiplier * 0.75;
				this.lastSkillType = eventData.skill.category;
			}
		},
		disarray: {
			name: "Disarray",
			category: 'debuff',
			initialize: function(unit) {
				this.severity = 1.0;
			},
			beginCycle: function(unit, eventData) {
				this.severity -= 0.2;
				if (this.severity <= 0.0) {
					unit.liftStatus('disarray');
				}
			},
			acting: function(unit, eventData) {
				eventData.action.rank = Math.floor(Math.min(Math.random() * 5 + 1, 5));
			}
		},
		drunk: {
			name: "Drunk",
			category: 'special',
			statModifiers: {
				foc: 0.5
			},
			initialize: function(unit) {
				this.sleepChance = 0.0;
			},
			acting: function(unit, eventData) {
				var rankOffset = Math.min(Math.floor(Math.random() * 3), 2) - 1;
				eventData.action.rank += rankOffset;
			},
			aiming: function(unit, eventData) {
				eventData.aimRate /= 1.5 + this.sleepChance;
			},
			endTurn: function(unit, eventData) {
				this.sleepChance += 5.0 / unit.battlerInfo.baseStats.vit;
				if (Math.random() < this.sleepChance) {
					unit.addStatus('sleep');
				}
			}
		},
		frostbite: {
			name: "Frostbite",
			category: 'affliction',
			overrules: [ 'ignite' ],
			initialize: function(unit) {
				this.multiplier = 1.0;
			},
			attacked: function(unit, eventData) {
				Link(eventData.action.effects)
					.where(function(effect) { return effect.type == 'addStatus' && effect.status == 'ignite'; })
					.each(function(effect)
				{
					effect.type = null;
				});
			},
			damaged: function(unit, eventData) {
				if (Link(eventData.tags).contains('fire')) {
					eventData.amount *= 2.0;
					unit.liftStatus('frostbite');
				}
			},
			endTurn: function(unit, eventData) {
				unit.takeDamage(0.05 * unit.maxHP * this.multiplier, [ 'ice', 'special' ]);
				this.multiplier = Math.min(this.multiplier + 0.10, 2.0);
			}
		},
		ghost: {
			name: "Ghost",
			category: 'affliction',
			aiming: function(unit, eventData) {
				for (var i = 0; i < eventData.action.effects.length; ++i) {
					var effect = eventData.action.effects[i];
					if (effect.type != 'damage' || effect.damageType == 'magic') {
						continue;
					}
					if (eventData.targetInfo.statuses.indexOf('ghost') === -1) {
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
					if (eventData.actingUnitInfo.statuses.indexOf('ghost') === -1) {
						eventData.action.accuracyRate = 0.0;
					}
				}
			}
		},
		ignite: {
			name: "Ignite",
			category: 'affliction',
			overrules: [ 'frostbite' ],
			initialize: function(unit) {
				this.multiplier = 1.0;
			},
			beginCycle: function(unit, eventData) {
				unit.takeDamage(0.05 * unit.maxHP * this.multiplier, [ 'fire', 'special' ]);
				this.multiplier = Math.max(this.multiplier - 0.05, 0.50);
			},
			attacked: function(unit, eventData) {
				Link(eventData.action.effects)
					.where(function(effect) { return effect.type == 'addStatus' && effect.status == 'frostbite'; })
					.each(function(effect)
				{
					effect.type = null;
				});
			},
			damaged: function(unit, eventData) {
				if (Link(eventData.tags).contains('ice')) {
					eventData.amount *= 2.0;
					unit.liftStatus('ignite');
				}
			}
		},
		immune: {
			name: "Immune",
			category: 'buff',
			initialize: function(unit) {
				this.turnsTaken = 0;
			},
			afflicted: function(unit, eventData) {
				var exemptions = [ 'drunk', 'offGuard', 'protect', 'reGen' ];
				if (!Link(exemptions).contains(eventData.statusID)) {
					eventData.statusID = null;
				}
			},
			beginTurn: function(unit, eventData) {
				++this.turnsTaken;
				if (this.turnsTaken > 3) {
					unit.liftStatus('immune');
				}
			}
		},
		lockstep: {
			name: "Lockstep",
			category: 'debuff',
			afflicted: function(unit, eventData) {
				
			}
		},
		offGuard: {
			name: "Off Guard",
			category: 'special',
			beginTurn: function(unit, eventData) {
				unit.liftStatus('offGuard');
			},
			damaged: function(unit, eventData) {
				if (!Link(eventData.tags).contains('special')) {
					eventData.amount *= 1.5;
				}
			}
		},
		protect: {
			name: "Protect",
			category: 'buff',
			initialize: function(unit) {
				this.multiplier = 0.5;
			},
			damaged: function(unit, eventData) {
				if (eventData.tags.indexOf('special') == -1) {
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
			category: 'buff',
			beginCycle: function(unit, eventData) {
				unit.heal(unit.maxHP * 0.01);
			}
		},
		skeleton: {
			name: "Skeleton",
			category: 'undead',
			overrules: [ 'zombie' ],
			beginCycle: function(unit, eventData) {
				if (eventData.battlerInfo.health <= 0) {
					eventData.battlerInfo.stats.str /= 2;
					eventData.battlerInfo.stats.mag /= 2;
				}
				unit.takeDamage(0.025 * unit.maxHP, [ 'special' ]);
			},
			damaged: function(unit, eventData) {
				eventData.suppressKO =
					eventData.tags.indexOf('physical') == -1
					&& eventData.tags.indexOf('sword') == -1;
			},
			healed: function(unit, eventData) {
				eventData.amount = -Math.abs(eventData.amount);
			},
			useItem: function(unit, eventData) {
				if (eventData.item.type == 'drink' && eventData.item.name != "Holy Water") {
					eventData.item.action.effects = null;
				}
			}
		},
		sleep: {
			name: "Sleep",
			category: 'affliction',
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
			category: 'undead',
			healed: function(unit, eventData) {
				eventData.amount = -Math.abs(eventData.amount);
			}
		}
	},
	
	effects: {
		addStatus: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].addStatus(effect.status);
			}
		},
		damage: function(actor, targets, effect) {
			var userInfo = actor.battlerInfo;
			for (var i = 0; i < targets.length; ++i) {
				var targetInfo = targets[i].battlerInfo;
				var damageTags = [ effect.damageType ];
				if ('element' in effect) {
					damageTags.push(effect.element);
				}
				var damage = Math.round(Game.math.damage[effect.damageType](userInfo, targetInfo, effect.power));
				targets[i].takeDamage(Math.max(damage + damage * 0.2 * (Math.random() - 0.5), 1), damageTags);
			}
		},
		devour: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				if (!targets[i].isPartyMember()) {
					var munchData = targets[i].enemyInfo.munchData;
					var experience = Game.math.experience.skill(munchData.skill, actor.battlerInfo, [ targets[i].battlerInfo ]);
					actor.growSkill(munchData.skill, experience);
				}
				targets[i].die();
				new Scenario()
					.playSound("Munch.wav")
					.run();
			}
		},
		instaKill: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].takeDamage(targets[i].maxHP, [ 'deathblow' ]);
			}
		},
		liftStatus: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].liftStatus(effect.status);
			}
		},
		recoverAll: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].heal(targets[i].maxHP);
			}
		},
		recoverHP: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].heal(targets[i].maxHP * effect.strength / 100);
			}
		}
	},
	
	skills: {
		chargeSlash: {
			name: "Charge Slash",
			category: 'sword',
			weaponType: 'sword',
			targetType: "single",
			actions: [
				{
					rank: 3,
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
					rank: 2,
					accuracyType: 'sword',
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
			baseMPCost: 75,
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
					],
				}
			]
		},
		dragonflame: {
			name: "Flame Breath",
			category: 'magic',
			targetType: 'allEnemies',
			baseMPCost: 25,
			actions: [
				{
					announceAs: "Flame Breath",
					rank: 3,
					accuracyType: 'breath',
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'breath',
							power: 30,
							element: 'fire'
						},
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'ignite'
						}
					],
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
							element: 'lightning'
						},
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'skeleton'
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
							element: 'fire'
						},
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'ignite'
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
					effects: [
						{
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
			baseMPCost: 35,
			actions: [
				{
					announceAs: "Necromancy",
					rank: 3,
					effects: [
						{
							targetHint: "selected",
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
							power: 100
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
			category: 'sword',
			weaponType: 'sword',
			targetType: 'single',
			actions: [
				{
					announceAs: "Quickstrike",
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
			targetType: 'multiple',
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
		swordSlash: {
			name: "Sword Slash",
			category: 'sword',
			weaponType: 'sword',
			targetType: 'single',
			actions: [
				{
					announceAs: "Sword Slash",
					rank: 2,
					accuracyType: 'sword',
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
					effects: [
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
							element: 'earth'
						},
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'disarray'
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
							element: 'ice'
						},
						{
							targetHint: 'selected',
							type: 'addStatus',
							status: 'frostbite'
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
				'quickstrike',
				'chargeSlash'
			]
		},
		templeSword: {
			name: "Temple Sword",
			type: 'sword',
			level: 5,
			techniques: [
				'swordSlash',
				'quickstrike',
				'chargeSlash'
			]
		},
		arsenRifle: {
			name: "Arsen's Rifle",
			type: 'rifle',
			level: 10,
			techniques: [
				'sharpshooter'
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
				fire: 0.5,
				ice: 2.0,
				fat: 1.5
			},
			immunities: [],
			munchData: {
				skill: 'dragonflame'
			},
			strategize: function(me, nextUp) {
				this.setDefaultSkill('flare');
				if (this.turnsTaken % 3 == 0) {
					this.useSkill('dragonflame');
				} else {
					// TODO: implement me!
				}
			}
		},
		robert2: {
			name: "Robert",
			fullName: "Robert Spellbinder",
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
				'alcohol'
			],
			strategize: function(me, nextUp) {
				if ('maggie' in this.enemies && this.turnsTaken == 0) {
					new Scenario()
						.talk("Robert", true, 2.0, "Wait, hold on... what in Hades' name is SHE doing here?")
						.talk("maggie", true, 2.0, "The same thing I'm always doing, having stuff for dinner. Like you!")
						.call(function() { me.takeDamage(me.maxHP - 1); })
						.playSound('Munch.wav')
						.talk("Robert", true, 2.0, "HA! You missed! ...hold on, where'd my leg go? ...and my arm, and my other leg...")
						.talk("maggie", true, 2.0,
							"Tastes like chicken!",
							"Hey, speaking of which, Robert, did you see any chickens around here? I could really go for some fried chicken right about now! Or even the regular, uncooked, feathery kind...")
						.talk("Robert", true, 2.0, "...")
						.run(true);
					this.useItem('alcohol');
				}
				if (this.turnsTaken == 0) {
					this.data.phase = 0;
					this.useSkill('omni');
					this.useSkill('necromancy');
				} else {
					var phaseToEnter =
						me.getHealth() > 75 ? 1 :
						me.getHealth() > 40 ? 2 :
						me.getHealth() > 10 ? 3 :
						4;
					var lastPhase = this.data.phase;
					this.data.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter
					switch (this.data.phase) {
						case 1:
							if (this.data.phase > lastPhase) {
								this.data.isComboStarted = false;
							}
							var forecast = this.turnForecast('chargeSlash');
							if (forecast[0].unit === me) {
								this.useSkill('chargeSlash');
							} else {
								forecast = this.turnForecast('quickstrike');
								if (forecast[0].unit === me) {
									this.useSkill('quickstrike');
									this.data.isComboStarted = true;
								} else {
									if (this.data.isComboStarted) {
										this.useSkill('swordSlash');
										this.data.isComboStarted = false;
									} else {
										var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
										this.useSkill(moves[Math.min(Math.floor(Math.random() * 4), 3)]);
									}
								}
							}
							break;
						case 2:
							if (this.data.phase > lastPhase) {
								this.useSkill('upheaval');
								this.data.isComboStarted = false;
							} else {
								var forecast = this.turnForecast('quickstrike');
								if ((Math.random() < 0.5 || this.data.isComboStarted) && forecast[0].unit === me) {
									this.useSkill('quickstrike');
									this.data.isComboStarted = true;
								} else {
									if (this.data.isComboStarted) {
										this.useSkill('swordSlash');
										this.data.isComboStarted = false;
									} else {
										var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
										this.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
									}
								}
							}
							break;
						case 3:
							if (this.data.phase > lastPhase) {
								this.useSkill('protectiveAura');
								this.useSkill('crackdown');
								this.data.doChargeSlashNext = false;
								this.data.isComboStarted = false;
							} else {
								var chanceOfCombo = 0.25 + this.hasStatus('crackdown') * 0.25;
								if (Math.random() < chanceOfCombo || this.data.isComboStarted) {
									var forecast = this.turnForecast('chargeSlash');
									if ((forecast[0] === me && !this.data.isComboStarted) || this.data.doChargeSlashNext) {
										this.data.isComboStarted = false;
										if (forecast[0] === me) {
											this.useSkill('chargeSlash');
										} else {
											var moves = [ 'hellfire', 'windchill' ];
											this.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
										}
									} else {
										this.data.isComboStarted = true;
										forecast = this.turnForecast('quickstrike');
										if (forecast[0] === me) {
											this.useSkill('quickstrike');
										} else {
											if (this.hasStatus('crackdown')) {
												this.useSkill('omni');
												this.data.isComboStarted = false;
											} else {
												this.useSkill('quickstrike');
												this.data.doChargeSlashNext = true;
											}
										}
									}
								} else {
									var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
									this.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
								}
							}
							break;
						case 4:
							if (this.data.phase > lastPhase) {
								if (!this.hasStatus('drunk')) {
									this.useSkill('desperationSlash');
								}
								this.useSkill('electrocute');
							} else {
								var forecast = this.turnForecast('omni');
								if (forecast[0] === me || forecast[1] === me) {
									this.useSkill('omni');
								} else {
									if (Math.random() < 0.5) {
										this.useSkill('chargeSlash');
									} else {
										var moves = [ 'hellfire', 'windchill', 'electrocute', 'upheaval' ];
										this.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
									}
								}
							}
							break;
					}
				}
			}
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
					.pause(1.0)
					.fork()
						.adjustBGM(0.0, 5.0)
					.end()
					.talk("Robert", true, 1.0, "What makes you so sure you have a choice?")
					.synchronize()
					.playBGM('MyDreamsButADropOfFuel')
					.adjustBGM(1.0)
					.run(true);
				this.playerUnits[0].addStatus('reGen');
			}
		}
	}
};
