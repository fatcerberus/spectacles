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
				"Quickstrike",
				"Necromancy"
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
	
	effects: {
		'Add Status': function(user, targets, effect) {
			for (var i = 0; i < targets.length; ++i) {
				targets[i].addStatus(effect.status);
			}
		},
		'Damage': function(user, targets, effect) {
			var reducer = targets.length;
			for (var i = 0; i < targets.length; ++i) {
				var target = targets[i];
				var damage = Math.floor(Game.math.damage[effect.category](user, target, effect.power) / reducer);
				Abort(target.name + " took " + damage + " HP of damage");
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
					effects: [
						{
							targetHint: "user",
							type: "Add Status",
							status: "Off-Guard"
						}
					]
				},
				{
					rank: 2,
					targetHint: "selected",
					effects: [
						{
							targetHint: "selected",
							type: "Damage",
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
					targetHint: "selected",
					effects: [
						{
							type: "AddStatus",
							status: "Zombie"
						}
					]
				}
			]
		}
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
			immunities: [],
			weapon: "Temple Sword",
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
