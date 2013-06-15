/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// Game object
// Represents the game.
Game = {
	title: "Spectacles: Bruce's Story",
	
	basePartyLevel: 50,
	defaultBattleBGM: null,
	defaultMoveRank: 2,
	defaultItemRank: 3,
	
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
		fire: "Fire",
		ice: "Ice",
		lightning: "Lightning",
		earth: "Earth",
		fat: "Fat"
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
				return power * (userInfo.weapon.level + userInfo.stats.str) / Game.math.statValue(0, targetInfo.level);
			},
			magic: function(userInfo, targetInfo, power) {
				return power * (userInfo.level + Math.floor((userInfo.stats.mag * 2 + userInfo.stats.foc) / 3)) / targetInfo.stats.foc;
			},
			pistol: function(userInfo, targetInfo, power) {
				return power * userInfo.weapon.level * 2 / targetInfo.stats.def;
			},
			physical: function(userInfo, targetInfo, power) {
				return power * (userInfo.level + userInfo.stats.str) / Math.floor((targetInfo.stats.def * 2 + targetInfo.stats.str) / 3);
			},
			sword: function(userInfo, targetInfo, power) {
				return power * (userInfo.weapon.level + userInfo.stats.str) / targetInfo.stats.def;
			}
		},
		experience: {
			skill: function(actor, skillInfo) {
				var growthRate = 'growthRate' in skillInfo ? skillInfo.growthRate : 1.0;
				return actor.getLevel() * growthRate;
			},
			targetStat: function(unit, statID, action, proficiency) {
				var growthRate = 'growthRate' in unit.character && statID in unit.character.growthRate ? unit.character.growthRate[statID] : 1.0;
				var base = 'baseExperience' in action && 'target' in action.baseExperience && statID in action.baseExperience.target ? action.baseExperience.target[statID] : 0;
				return base * proficiency * growthRate;
			},
			userStat: function(unit, statID, action, proficiency) {
				var growthRate = 'growthRate' in unit.character && statID in unit.character.growthRate ? unit.character.growthRate[statID] : 1.0;
				var base = 'baseExperience' in action && 'user' in action.baseExperience && statID in action.baseExperience.user ? action.baseExperience.user[statID] : 0;
				return base * proficiency * growthRate;
			}
		},
		hp: {
			enemy: function(enemyInfo, level) {
				var statAverage = Math.floor((enemyInfo.baseStats.vit * 10
					+ enemyInfo.baseStats.str
					+ enemyInfo.baseStats.def
					+ enemyInfo.baseStats.foc
					+ enemyInfo.baseStats.mag
					+ enemyInfo.baseStats.agi) / 15);
				return Math.floor(75 * (50 + Math.floor(statAverage / 2)) * (10 + level) / 110);
			},
			partyMember: function(characterInfo, level) {
				var statAverage = Math.floor((characterInfo.baseStats.vit * 10
					+ characterInfo.baseStats.str
					+ characterInfo.baseStats.def
					+ characterInfo.baseStats.foc
					+ characterInfo.baseStats.mag
					+ characterInfo.baseStats.agi) / 15);
				return Math.floor(15 * (50 + Math.floor(statAverage / 2)) * (10 + level) / 110);
			}
		},
		mp: {
			capacity: function(battlerInfo) {
				var statAverage = Math.floor((battlerInfo.baseStats.mag * 10
					+ battlerInfo.baseStats.vit
					+ battlerInfo.baseStats.str
					+ battlerInfo.baseStats.def
					+ battlerInfo.baseStats.foc
					+ battlerInfo.baseStats.agi) / 15);
				return Math.floor(25 * (50 + Math.floor(statAverage / 2)) * (10 + battlerInfo.level) / 110);
			},
			usage: function(skill, level, userInfo) {
				var baseCost = 'baseMPCost' in skill ? skill.baseMPCost : 0;
				return baseCost * (level + userInfo.baseStats.mag) / 50;
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
			return Math.floor(Math.max((50 + Math.floor(baseStat / 2)) * (10 + level) / 110, 1));
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
				'chargeSlash',
				'necromancy',
				'flare',
				'chill',
				'lightning',
				'quake'
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
				agi: 40
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
			name: "G.Disarray",
			actionTaken: function(battle, eventData) {
				eventData.action.rank = Math.floor(Math.min(Math.random() * 5 + 1, 5));
			}
		}
	},
	
	statuses: {
		crackdown: {
			name: "Crackdown",
			initialize: function(unit) {
				this.lastSkillType = null;
				this.multiplier = 1.0;
			},
			acting: function(unit, data) {
				for (var i = 0; i < data.action.effects.length; ++i) {
					var effect = data.action.effects[i];
					if (effect.type == 'damage') {
						effect.power = Math.ceil(effect.power * this.multiplier);
					}
				}
			},
			useSkill: function(unit, data) {
				this.multiplier = data.skill.category != this.lastSkillType ? 1.0
					: this.multiplier * 0.75;
				this.lastSkillType = data.skill.category;
			}
		},
		disarray: {
			name: "Disarray",
			acting: function(unit, data) {
				data.action.rank = Math.floor(Math.min(Math.random() * 5 + 1, 5));
			}
		},
		drunk: {
			name: "Drunk",
			statModifiers: {
				foc: 0.5
			},
			initialize: function(unit) {
				this.turnsTaken = 0;
			},
			acting: function(unit, data) {
				data.action.rank = Math.max(data.action.rank + 1, 1);
			},
			endTurn: function(unit, eventData) {
				++this.turnsTaken;
			}
		},
		frostbite: {
			name: "Frostbite",
			overrules: [ 'ignite' ],
			initialize: function(unit, data) {
				this.multiplier = 1.0;
			},
			endTurn: function(unit, data) {
				unit.takeDamage(this.multiplier * 0.05 * unit.maxHP, "special");
				this.multiplier = Math.min(this.multiplier + 0.01, 2.0);
			}
		},
		ignite: {
			name: "Ignite",
			overrules: [ 'frostbite' ],
			initialize: function(unit, data) {
				this.multiplier = 1.0;
			},
			beginCycle: function(unit, data) {
				unit.takeDamage(this.multiplier * 0.05 * unit.maxHP, "special");
				this.multiplier = Math.max(this.multiplier - 0.01, 0.5);
			}
		},
		immune: {
			name: "Immune",
			initialize: function(unit) {
				this.turnsTaken = 0;
			},
			afflicted: function(unit, eventData) {
				var exemptions = [ 'drunk', 'offGuard', 'protect', 'reGen' ];
				for (var i = 0; i < exemptions.length; ++i) {
					if (eventData.statusID == exemptions[i]) {
						return;
					}
				}
				eventData.statusID = null;
			},
			endTurn: function(unit, eventData) {
				++this.turnsTaken;
				if (this.turnsTaken > 3) {
					unit.liftStatus('immune');
				}
			}
		},
		offGuard: {
			name: "Off Guard",
			beginTurn: function(unit, data) {
				unit.liftStatus('offGuard');
			},
			damaged: function(unit, data) {
				if (data.tag != "status") {
					data.amount = Math.ceil(data.amount * 1.5);
				}
			}
		},
		protect: {
			name: "Protect",
			damaged: function(unit, data) {
				if (data.tag != "status") {
					data.amount = Math.floor(data.amount * 0.5);
				}
			}
		},
		reGen: {
			name: "ReGen",
			beginCycle: function(unit, data) {
				unit.heal(unit.maxHP * 0.01);
			}
		},
		skeleton: {
			name: "Skeleton",
			overrules: [ 'zombie' ],
			beginCycle: function(unit, data) {
				if (data.battlerInfo.health <= 0) {
					data.battlerInfo.stats.str /= 2;
					data.battlerInfo.stats.mag /= 2;
				}
				unit.takeDamage(0.025 * unit.maxHP, "special");
			},
			damaged: function(unit, data) {
				data.suppressKO = data.tag != 'physical' && data.tag != 'sword';
			},
			healed: function(unit, data) {
				data.amount = -Math.abs(data.amount);
			},
			useItem: function(unit, data) {
				if (data.item.type == 'drink' && data.item.name != "Holy Water") {
					data.item.action.effects = null;
				}
			}
		},
		zombie: {
			name: "Zombie",
			healed: function(unit, data) {
				data.amount = -Math.abs(data.amount);
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
			var reducer = targets.length;
			var userInfo = actor.battlerInfo;
			for (var i = 0; i < targets.length; ++i) {
				var targetInfo = targets[i].battlerInfo;
				var damage = Game.math.damage[effect.damageType](userInfo, targetInfo, effect.power) / reducer;
				targets[i].takeDamage(Math.max(damage + damage * 0.2 * (Math.random() - 0.5), 1), effect.damageType);
			}
		},
		devour: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				if (!targets[i].isPartyMember) {
					var munchData = targets[i].enemyInfo.munchData;
					actor.growSkill(munchData.skill, munchData.experience);
				}
				targets[i].die();
				new Scenario()
					.playSound("Munch.wav")
					.run();
			}
		},
		instaKill: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].takeDamage(targets[i].maxHP);
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
					baseExperience: {
						user: {
							str: 3,
							agi: 2
						},
						target: {
							def: 5
						}
					},
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
							power: 35,
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
							power: 80,
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
							power: 35,
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
							power: 80,
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
							power: 35,
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
			targetType: 'single',
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
							power: 35,
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
					baseExperience: {
						user: {
							str: 1
						}
					},
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
							power: 40
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
					baseExperience: {
						user: {
							str: 1
						},
						target: {
							def: 1
						}
					},
					effects: [
						{
							targetHint: 'selected',
							type: 'damage',
							damageType: 'sword',
							power: 10
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
							power: 80,
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
							power: 80,
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
			level: 10,
			techniques: [
				'swordSlash',
				'quickstrike',
				'chargeSlash'
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
			baseStats: {
				vit: 50,
				str: 10,
				def: 55,
				foc: 65,
				mag: 30,
				agi: 70
			},
			damageModifiers: {
				ice: 2.0
			},
			immunities: [],
			munchData: {
				skill: 'Dragonflame',
				experience: 25
			},
			strategize: function(me, nextUp) {
				this.useSkill('flare');
			}
		},
		robert2: {
			name: "Robert",
			fullName: "Robert Spellbinder",
			hasLifeBar: true,
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
				technique: 'omni',
				experience: 1000
			},
			items: [
				'alcohol'
			],
			strategize: function(me, nextUp) {
				if ('maggie' in this.enemies && this.turnsTaken == 0) {
					new Scenario()
						.talk("Robert", 2.0, "Wait, hold on... what in Hades' name is SHE doing here?")
						.talk("maggie", 2.0, "The same thing I'm always doing, having stuff for dinner. Like you!")
						.call(function() { me.takeDamage(me.maxHP - 1); })
						.playSound('Munch.wav')
						.talk("Robert", 2.0, "HA! You missed! ...hold on, where'd my leg go? ...and my arm, and my other leg...")
						.talk("maggie", 2.0,
							"Tastes like chicken!",
							"Hey, speaking of which, Robert, did you see any chickens around here? I could really go for some fried chicken right about now! Or even the regular, uncooked, feathery kind...")
						.talk("Robert", 2.0, "...")
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
										var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
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
									var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
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
					.talk("maggie", 2.0,
						"I'd suggest keeping your wits about you while fighting this thing if you don't want to be barbequed. It won't hesitate to roast you--and then I'd have to eat you!",
						"Mmm, barbequed Littermates... tastes like chicken!")
					.talk("Scott", 2.0, "Barbequed... littermates?")
					.talk("Elysia", 2.0, "Focus, guys!")
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
					.talk("Robert", 2.0, "Bruce's death changed nothing. If anything, it's made you far more reckless. Look around, "
						+ "Scott! Where are your friends? Did they abandon you in your most desperate hour, or are you truly so "
						+ "brazen as to face me alone?")
					.talk("Scott", 2.0, "I owe Bruce my life, Robert! To let his story end here... that's something I won't allow. "
						+ "Not now. Not when I know just what my world would become if I did!")
					.pause(1.0)
					.adjustBGMVolume(0.0, 1.0)
					.talk("Robert", 1.0, "What makes you so sure you have a choice?")
					.overrideBGM('MyDreamsButADropOfFuel')
					.adjustBGMVolume(1.0)
					.run(true);
				this.playerUnits[0].addStatus('reGen');
			}
		}
	}
};
