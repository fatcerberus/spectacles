/***
 * Spectacles: Bruce's Story
  *  Copyright (C) 2013 Power-Command
***/

// Game object
// Represents the game.
Game = {
	title: "Spectacles: Bruce's Story",
	defaultBattleBGM: null,
	
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
	
	math: {
		accuracy: {
			bow: function(user, target) {
				return 1.0;
			},
			devour: function(user, target) {
				return (user.health - target.health + 1) / 5000;
			}
		},
		damage: {
			bow: function(attacker, target, power) {
				return 0;
			},
			gun: function(attacker, target, power) {
				return 0;
			},
			magic: function(attacker, target, power) {
				return Math.floor(attacker.level * power * (attacker.stats.mag.value * 2 + attacker.stats.foc.value / 3) * (100 - target.stats.foc.value * 0.95) / 60000);
			},
			physical: function(attacker, target, power) {
				return 0;
			},
			sword: function(attacker, target, power) {
				return Math.floor(attacker.weapon.level * attacker.stats.str.value * power * (100 - target.stats.def.value * 0.95) / 50000);
			}
		},
		enemyHP: function(enemyUnit) {
			return enemyUnit.stats.vit.value * 100;
		},
		partyMemberHP: function(partyMember) {
			return partyMember.stats.vit.value * 10;
		},
		timeUntilNextTurn: function(unit, rank) {
			return rank * (101 - unit.stats.agi.value);
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
			techniques: [
				'swordSlash',
				'quickstrike',
				'necromancy',
				'omni'
			]
		},
		maggie: {
			name: "maggie",
			fullName: "maggie",
			baseStats: {
				vit: 100,
				str: 90,
				def: 85,
				foc: 65,
				mag: 30,
				agi: 40
			},
			techniques: [
				'munch',
				'fatSlam'
			]
		}
	},
	
	statuses: {
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
		addStatus: function(user, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].addStatus(effect.status);
			}
		},
		damage: function(user, targets, effect) {
			var reducer = targets.length;
			for (var i = 0; i < targets.length; ++i) {
				var target = targets[i];
				var damage = Math.floor(Game.math.damage[effect.damageType](user, target, effect.power) / reducer);
				target.takeDamage(damage + damage * 0.2 * (Math.random() - 0.5));
			}
		},
		devour: function(user, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				var odds = Game.math.accuracy.devour(user, targets[i]) * effect.successRate;
				if (Math.random() < odds) {
					if (!targets[i].isPartyMember) {
						var munchGrowthInfo = targets[i].enemyInfo.munchGrowth;
						user.growSkill(munchGrowthInfo.technique, munchGrowthInfo.experience);
					}
					targets[i].die();
				} else {
					user.whiff();
				}
			}
		}
	},
	
	techniques: {
		swordSlash: {
			name: "Sword Slash",
			weaponType: "Sword",
			category: "Attack",
			targetType: "one",
			actions: [
				{
					rank: 2,
					effects: [
						{
							targetHint: "selected",
							type: 'damage',
							damageType: 'sword',
							power: 25
						}
					]
				}
			]
		},
		quickstrike: {
			name: "Quickstrike",
			weaponType: "Sword",
			category: "Attack",
			targetType: "one",
			actions: [
				{
					rank: 1,
					effects: [
						{
							targetHint: "selected",
							type: 'damage',
							damageType: 'sword',
							power: 10
						}
					]
				}
			]
		},
		chargeSlash: {
			name: "Charge Slash",
			weaponType: "Sword",
			category: "Attack",
			targetType: "one",
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
					rank: 2,
					effects: [
						{
							targetHint: "selected",
							type: 'damage',
							damageType: 'sword',
							power: 50
						}
					]
				}
			]
		},
		necromancy: {
			name: "Necromancy",
			weaponType: null,
			category: "Strategy",
			targetType: "one",
			actions: [
				{
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
		flare: {
			name: "Flare",
			weaponType: null,
			category: "Magic",
			targetType: "one",
			actions: [
				{
					rank: 2,
					effects: [
						{
							targetHint: "selected",
							type: 'damage',
							damageType: 'magic',
							power: 35,
							element: 'fire'
						}
					],
				}
			]
		},
		omni: {
			name: "Omni",
			weaponType: null,
			category: "Magic",
			targetType: "one",
			actions: [
				{
					rank: 4,
					effects: [
						{
							targetHint: "selected",
							type: 'damage',
							damageType: 'magic',
							power: 100
						}
					],
				}
			]
		},
		munch: {
			name: "Munch",
			weaponType: null,
			category: "Attack",
			targetType: "one",
			actions: [
				{
					rank: 5,
					effects: [
						{
							targetHint: "selected",
							type: 'devour',
							successRate: 1.0
						}
					],
				}
			]
		},
		fatSlam: {
			name: "Fat Slam",
			weaponType: null,
			category: "Attack",
			targetType: "one",
			actions: [
				{
					rank: 3,
					effects: [
						{
							targetHint: "selected",
							type: 'damage',
							damageType: 'physical',
							power: 75,
							element: 'fat'
						}
					],
				}
			]
		}
	},
	
	weapons: {
		templeSword: {
			name: "Temple Sword",
			type: "Sword",
			level: 75,
			techniques: [
				'swordSlash',
				'quickstrike',
				'chargeSlash'
			]
		},
		rsbSword: {
			type: "Sword",
			level: 60,
			techniques: [
				'swordSlash',
				'quickStrike',
				'chargeSlash'
			]
		}
	},
	
	enemies: {
		robert2: {
			name: "Robert",
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
			strategize: function(me, battle, turnPreview) {
				enemies = battle.enemiesOf(me);
				return {
					type: "technique",
					technique: 'chargeSlash',
					targets: [ enemies[0] ],
				};
			}
		}
	},
	
	battles: {
		robert2: {
			bgm: "MyDreamsButADropOfFuel",
			battleLevel: 50,
			enemies: [
				'robert2'
			]
		}
	},
	
	initialPartyMembers: [
		'scott',
		'maggie' /*ALPHA*/
	]
};
