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
		'VIT': "Vitality",
		'STR': "Strength",
		'DEF': "Defense",
		'FOC': "Focus",
		'MAG': "Magic",
		'AGI': "Agility"
	},
	
	math: {
		accuracy: {
			'Bow': function(attacker, target) {
				return 1.0;
			}
		},
		damage: {
			'Bow': function(attacker, target, power) {
				return 0;
			},
			'Gun': function(attacker, target, power) {
				return 0;
			},
			'Magic': function(attacker, target, power) {
				return 0;
			},
			'Physical': function(attacker, target, power) {
				return 0;
			},
			'Sword': function(attacker, target, power) {
				return Math.floor(attacker.weapon.level * attacker.stats['STR'].value * power * (100 - target.stats['DEF'].value * 0.95) / 50000);
			}
		},
		enemyHP: function(enemyUnit) {
			return enemyUnit.stats['VIT'].value * 100;
		},
		partyMemberHP: function(partyMember) {
			return partyMember.stats['VIT'].value * 10;
		},
		timeUntilNextTurn: function(unit, rank) {
			return rank * (101 - unit.stats['AGI'].value);
		}
	},
	
	characters: {
		'Scott': {
			name: "Scott",
			fullName: "Scott Starcross",
			baseStats: {
				'VIT': 70,
				'STR': 70,
				'DEF': 70,
				'FOC': 70,
				'MAG': 70,
				'AGI': 70
			},
			weapon: "Temple Sword",
			techniques: [
				"Sword Slash",
				"Quickstrike",
				"Necromancy",
				"Flare",
				//"Chill",
				//"Lightning",
				//"Quake"
			]
		}
	},
	
	statuses: {
		'Zombie': {
			healed: function(subject, event) {
				subject.takeDamage(event.amount);
				event.cancel = true;
			}
		},
		'Off-Guard': {
			damaged: function(subject, event) {
				if (event.cancel) {
					return;
				}
				event.amount = Math.floor(event.amount * 1.5);
				subject.removeStatus("Off-Guard");
			}
		}
	},
	
	effects: {
		'addstatus': function(user, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].addStatus(effect.status);
			}
		},
		'damage': function(user, targets, effect) {
			var reducer = targets.length;
			for (var i = 0; i < targets.length; ++i) {
				var target = targets[i];
				var damage = Math.floor(Game.math.damage[effect.category](user, target, effect.power) / reducer);
				target.takeDamage(damage);
			}
		}
	},
	
	techniques: {
		'Sword Slash': {
			weaponType: "Sword",
			category: "Attack",
			targetType: "one",
			actions: [
				{
					rank: 2,
					effects: [
						{
							targetHint: "selected",
							type: "damage",
							category: "Sword",
							power: 25
						}
					]
				}
			]
		},
		'Quickstrike': {
			weaponType: "Sword",
			category: "Attack",
			targetType: "one",
			actions: [
				{
					rank: 1,
					effects: [
						{
							targetHint: "selected",
							type: "damage",
							category: "Sword",
							power: 10
						}
					]
				}
			]
		},
		'Charge Slash': {
			weaponType: "Sword",
			category: "Attack",
			targetType: "one",
			actions: [
				{
					rank: 3,
					effects: [
						{
							targetHint: "user",
							type: "addstatus",
							status: "Off-Guard"
						}
					]
				},
				{
					rank: 2,
					effects: [
						{
							targetHint: "selected",
							type: "damage",
							category: "Sword",
							power: 50
						}
					]
				}
			]
		},
		'Necromancy': {
			weaponType: null,
			category: "Strategy",
			targetType: "one",
			actions: [
				{
					rank: 3,
					effects: [
						{
							targetHint: "selected",
							type: "addstatus",
							status: "Zombie"
						}
					]
				}
			]
		},
		'Flare': {
			weaponType: null,
			category: "Magic",
			targetType: "one",
			actions: [
				{
					rank: 2,
					effects: [
						{
							targetHint: "selected",
							type: "damage",
							category: "Magic",
							power: 35
						}
					],
				}
			]
		},
	},
	
	weapons: {
		'Temple Sword': {
			name: "Temple Sword",
			type: "Sword",
			level: 75,
			techniques: [
				"Sword Slash",
				"Quickstrike",
				"Charge Slash"
			]
		},
		'RSB\'s Sword': {
			type: "Sword",
			level: 60,
			techniques: [
				"Sword Slash",
				"Quickstrike",
				"Charge Slash"
			]
		}
	},
	
	enemies: {
		'Robert (II)': {
			name: "Robert",
			baseStats: {
				'VIT': 75,
				'STR': 75,
				'DEF': 75,
				'FOC': 75,
				'MAG': 75,
				'AGI': 75
			},
			immunities: [],
			weapon: "RSB's Sword",
			strategize: function(me, battle, turnPreview) {
				enemies = battle.enemiesOf(me);
				return {
					type: "technique",
					technique: "Charge Slash",
					targets: [ enemies[0] ],
				};
			}
		}
	},
	
	battles: {
		'RSB II': {
			bgm: "MyDreamsButADropOfFuel",
			battleLevel: 50,
			enemies: [
				"Robert (II)"
			]
		}
	},
	
	initialPartyMembers: [
		"Scott"
	]
};
