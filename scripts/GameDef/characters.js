/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.initialParty =
[
	'scott'
];

Game.characters =
{
	// Scott Starcross
	// The protagonist of the Spectacles Saga. Always tries to do what's right, but is
	// naive to a fault.
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
			'necromancy',
			'crackdown'
		]
	},
	
	// Bruce Arsen
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
			'potshot',
			'shootout',
			'sharpshooter',
			'flare',
			'chill',
			'lightning',
			'quake',
			'protectiveAura'
		]
	},
	
	// Elysia Ilapse
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
			'chillShot',
			'flare',
			'chill',
			'lightning',
			'quake',
			'heal'
		]
	},
	
	// maggie
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
	},
	
	// Robert Spellbinder
	robert: {
		name: "Robert",
		fullName: "Robert Spellbinder",
		baseStats: {
			vit: 75,
			str: 75,
			def: 75,
			foc: 75,
			mag: 75,
			agi: 75
		},
		startingWeapon: 'rsbSword',
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
			'omni',
			'protectiveAura',
			'necromancy',
			'crackdown'
		]
	},
	
	// Amanda Spellbinder
	amanda: {
		name: "Amanda",
		fullName: "Amanda Spellbinder",
		baseStats: {
			vit: 65,
			str: 60,
			def: 75,
			foc: 80,
			mag: 100,
			agi: 50
		},
		skills: [
			'flare',
			'chill',
			'lightning',
			'quake',
			'heal',
			'hellfire',
			'windchill',
			'inferno',
			'rejuvenate',
			'renewal',
			'omni',
			'protectiveAura'
		]
	}
};
