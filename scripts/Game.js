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
	useItemMoveRank: 3,
	
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
			bow: function(user, target) {
				return 1.0;
			},
			devour: function(user, target) {
				return (user.getHealth() - target.getHealth()) * user.stats.agi.getValue() / target.stats.agi.getValue() / 400;
			},
			instaKill: function(user, target) {
				return 1.0;
			},
			pistol: function(user, target) {
				return 1.0;
			},
			magic: function(user, target) {
				return 1.0;
			},
			physical: function(user, target) {
				return 1.0;
			},
			sword: function(user, target) {
				return 1.0;
			}
		},
		damage: {
			bow: function(actor, target, power) {
				return actor.getLevel() / target.getLevel() * power
					* (actor.weapon.level + actor.stats.str.getValue()) / 2
					* (115 - actor.weapon.level) / 1500;
			},
			magic: function(actor, target, power) {
				return actor.getLevel() / target.getLevel() * power
					* (actor.getLevel() * 3 + actor.stats.mag.getValue() * 2 + actor.stats.foc.getValue()) / 6
					* (115 - target.stats.foc.getValue()) / 1500;
			},
			pistol: function(actor, target, power) {
				return actor.weapon.level / target.getLevel() * power
					* (actor.weapon.level + actor.weapon.level) / 2
					* (115 - target.stats.def.getValue()) / 1500;
			},
			physical: function(actor, target, power) {
				return actor.getLevel() / target.getLevel() * power
					* (actor.getLevel() + actor.stats.str.getValue()) / 2
					* (115 - (target.stats.def.getValue() * 2 + target.stats.str.getValue()) / 3) / 1500;
			},
			sword: function(actor, target, power) {
				return actor.getLevel() / target.getLevel() * power
					* (actor.weapon.level + actor.stats.str.getValue()) / 2
					* (115 - target.stats.def.getValue()) / 1500;
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
			enemy: function(unitInfo) {
				return 100 * (unitInfo.stats.vit * 5 + unitInfo.stats.str + unitInfo.stats.def + unitInfo.stats.foc + unitInfo.stats.mag + unitInfo.stats.agi) / 10;
			},
			partyMember: function(memberInfo) {
				return 10 * (memberInfo.stats.vit * 5 + memberInfo.stats.str + memberInfo.stats.def + memberInfo.stats.foc + memberInfo.stats.mag + memberInfo.stats.agi) / 10;
			}
		},
		mp: {
			enemy: function(unitInfo) {
				return (unitInfo.stats.mag * 2 + unitInfo.level) / 3 * 15;
			},
			party: function(partyInfo) {
				var maxMP = 0;
				for (var i = 0; i < partyInfo.length; ++i) {
					var memberInfo = partyInfo[i];
					maxMP += Math.floor((memberInfo.stats.mag * 2 + memberInfo.level) / 3 * 15);
				}
				return maxMP;
			},
			usage: function(skill, level, userInfo) {
				var baseCost = 'baseMPCost' in skill ? skill.baseMPCost : 0;
				return baseCost * level * userInfo.level / 10000;
			}
		},
		retreatChance: function(enemyUnits) {
			return 1.0;
		},
		timeUntilNextTurn: function(unit, rank) {
			return rank * (101 - unit.stats.agi.getValue());
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
				'quake',
				'omni'
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
			uses: 1,
			action: {
				announceAs: "Alcohol",
				rank: 3,
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
			uses: 1,
			action: {
				announceAs: "Holy Water",
				rank: 3,
				effects: [
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
			uses: 5,
			action: {
				announceAs: "Tonic",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'recoverHP',
						strength: 35
					}
				]
			}
		}
	},
	
	statuses: {
		crackdown: {
			name: "Crackdown"
		},
		drunk: {
			name: "Drunk"
		},
		offGuard: {
			name: "Off-Guard",
			beginTurn: function(subject, event) {
				subject.liftStatus('offGuard');
			},
			damaged: function(subject, event) {
				if (event.cancel) {
					return;
				}
				event.amount = Math.floor(event.amount * 1.5);
				subject.liftStatus('offGuard');
			}
		},
		reGen: {
			name: "ReGen",
			beginTurn: function(subject, event) {
				subject.heal(subject.stats.mag.getValue() / 2);
			}
		},
		zombie: {
			name: "Zombie",
			healed: function(subject, event) {
				if (event.isPriority) {
					return;
				}
				subject.takeDamage(event.amount);
				event.cancel = true;
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
			for (var i = 0; i < targets.length; ++i) {
				var target = targets[i];
				var damage = Game.math.damage[effect.damageType](actor, target, effect.power) / reducer;
				target.takeDamage(Math.max(damage + damage * 0.2 * (Math.random() - 0.5), 1));
			}
		},
		devour: function(actor, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				if (!targets[i].isPartyMember) {
					var munchGrowthInfo = targets[i].enemyInfo.munchGrowth;
					actor.growSkill(munchGrowthInfo.technique, munchGrowthInfo.experience);
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
			baseMPCost: 50,
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
			baseMPCost: 250,
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
			baseMPCost: 50,
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
		lightning: {
			name: "Lightning",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 50,
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
			baseMPCost: 200,
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
			baseMPCost: 500,
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
					],
				}
			]
		},
		quake: {
			name: "Quake",
			category: 'magic',
			targetType: 'single',
			baseMPCost: 50,
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
		}
	},
	
	weapons: {
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
			immunities: [],
			munchGrowth: {
				technique: 'Dragonflame',
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
			munchGrowth: {
				technique: 'omni',
				experience: 1000
			},
			items: [
				'alcohol'
			],
			strategize: function(me, nextUp) {
				if ('maggie' in this.enemies && this.turnsTaken == 0) {
					new Scenario()
						.talk("Robert", 2.0, "Wait a minute... what in Hades' name is SHE doing here?")
						.talk("maggie", 2.0, "The same thing I'm always doing, having stuff for dinner. Like you!")
						.call(function() { me.takeDamage(me.maxHP - 1); })
						.playSound('Munch.wav')
						.talk("Robert", 2.0, "HA! You missed! ...hold on, where'd my leg go? ...and my arm, and my other leg...")
						.talk("maggie", 2.0,
							"Tastes like chicken!",
							"Hey, speaking of which, Robert, did you see any chickens around here? I could really go for some fried chicken right about now! Or even regular, uncooked, feathery chicken...")
						.talk("Robert", 2.0, "...")
						.run(true);
					this.useItem('alcohol');
				}
				if (this.turnsTaken == 0) {
					this.phase = 1;
					this.useSkill('omni');
					this.useSkill('necromancy');
				} else {
					var phaseToEnter =
						me.getHealth() > 75 ? 1 :
						me.getHealth() > 40 ? 2 :
						me.getHealth() > 10 ? 3 :
						4;
					this.data.phase = this.data.phase > phaseToEnter ? this.data.phase : phaseToEnter
					switch (this.data.phase) {
						case 1:
							var turnForecast = this.turnForecast('quickstrike');
							if (turnForecast[0].unit === me) {
								this.useSkill('quickstrike');
							}
							this.useSkill('swordSlash');
							break;
						case 2:
							var turnForecast = this.turnForecast('quickstrike');
							if (Math.random() < 0.5 && turnForecast[0].unit == me) {
								this.useSkill('quickstrike');
							}
							var moveCandidates = [ 'flare', 'chill', 'lightning', 'quake' ];
							this.useSkill(moveCandidates[Math.min(Math.floor(Math.random() * 4), 3)]);
							break;
						case 3:
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
					.talk("maggie", 2.0, "I'd suggest keeping your wits about you while fighting this thing if you don't want to be barbequed. "
						+ "It won't hesitate to roast you--and then I'd have to eat you!")
					.run(true);
			}
		},
		robert2: {
			title: "Robert Spellbinder",
			battleLevel: 50,
			enemies: [
				'robert2'
			],
			onStart: function() {
				this.playerUnits[0].addStatus('reGen');
				new Scenario()
					.talk("Robert", 2.0, "Bruce's death changed nothing. If anything, it's made you far more reckless. Look around, "
						+ "Scott! Where are your friends? Did they abandon you in your most desperate hour, or are you truly so "
						+ "brazen as to face me alone?")
					.talk("Scott", 2.0, "I owe Bruce my life, Robert! To let his story end here... that's something I won't allow. "
						+ "Not now. Not when I know just what my world would become if I did!")
					.overrideBGM('MyDreamsButADropOfFuel')
					.talk("Robert", 2.0, "What makes you so sure you have a choice?")
					.run(true);
			}
		}
	}
};
