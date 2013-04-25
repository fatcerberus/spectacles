/***
 * Spectacles: Bruce's Story
  *  Copyright (C) 2013 Power-Command
***/

// Game object
// Represents the game.
Game = {
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
				return 0;
			}
		},
		enemyHP: function(enemyUnit) {
			return enemyUnit.stats['VIT'].value * 100;
		},
		partyMemberHP: function(partyMember) {
			return partyMember.stats['VIT'].value * 10;
		},
		timeUntilNextTurn: function(unit, rank) {
			return (101 - unit.stats['AGI'].value) * rank;
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
			techniques: [
				"Sword Slash",
				"Quickstrike"
			]
		}
	},
	
	statuses: {
		'Zombie': {
			healed: function(subject, event) {
				subject.takeDamage(event.amount);
				event.cancel = true;
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
							type: "Damage",
							category: "Sword",
							power: 25
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
					targetHint: "user",
					effects: [
						{
							type: "AddStatus",
							status: "Off-Guard"
						}
					]
				},
				{
					rank: 2,
					targetHint: "selected",
					effects: [
						{
							type: "Damage",
							category: "Sword",
							power: 50
						}
					]
				}
			]
		},
	},
	
	weapons: {
		'Temple Sword': {
			type: "Sword",
			power: 10,
			techniques: [
				"Sword Slash",
				"Quickstrike",
				"Charge Slash"
			]
		}
	},
	
	enemies: {
		'Robert III': {
			name: "Robert",
			baseStats: {
				'VIT': 75,
				'STR': 75,
				'DEF': 75,
				'FOC': 75,
				'MAG': 75,
				'AGI': 75
			},
			weapon: "Temple Sword",
			strategize: function(me, turnPreview) {
				return {
					type: "technique",
					technique: "Charge Slash",
					targets: [],
				};
			}
		}
	},
	
	battles: {
		'Robert III': {
			battleLevel: 50,
			enemies: [
				"Robert III"
			]
		}
	},
	
	initialPartyMembers: [
		"Scott"
	]
};
