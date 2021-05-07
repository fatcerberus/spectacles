/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

export
const Characters =
{
	abigail: {
		name: "Abigail",
		fullName: "Abigail Adora",
		baseStats: {
			vit: 50,
			str: 60,
			def: 35,
			foc: 100,
			mag: 95,
			agi: 65,
		},
		skills: [
			'whipstick',
			'dispel',
			'immunize',
			'salve',
			'heal',
			'rejuvenate',
			'renewal',
			'lazarus',
			'purify',
		],
	},

	amanda: {
		name: "Amanda",
		fullName: "Amanda Spellbinder",
		baseStats: {
			vit: 65,
			str: 60,
			def: 75,
			foc: 80,
			mag: 100,
			agi: 50,
		},
		skills: [
			'inferno',
			'tenPointFive',
			'subzero',
			'discharge',
			'omni',
			'heal',
			'dispel',
			'curse',
		],
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
			agi: 55,
		},
		autoScan: true,
		startingWeapon: 'arsenRifle',
		skills: [
			'knockBack',
			'potshot',
			'shootout',
			'sharpshooter',
			'ignite',
			'frostbite',
			'jolt',
			'tremor',
			'crackdown',
			'protect',
		],
	},

	elysia: {
		name: "Elysia",
		fullName: "Elysia Ilapse",
		baseStats: {
			vit: 40,
			str: 50,
			def: 50,
			foc: 90,
			mag: 65,
			agi: 100,
		},
		startingWeapon: 'fireAndIce',
		skills: [
			'archery',
			'tripleShot',
			'flareShot',
			'chillShot',
			'joltShot',
			'seismicShot',
			'flare',
			'chill',
			'lightning',
			'quake',
			'hellfire',
			'windchill',
			'electrocute',
			'upheaval',
			'omni',
		],
	},

	justin: {
		name: "Justin",
		fullName: "Justin Ilapse",
		baseStats: {
			vit: 50,
			str: 35,
			def: 60,
			foc: 75,
			mag: 100,
			agi: 60,
		},
		autoScan: true,
		skills: [
			'knockBack',
			'flare',
			'chill',
			'lightning',
			'quake',
			'heal',
			'ignite',
			'frostbite',
			'jolt',
			'tremor',
			'dispel',
			'necromancy',
			'crackdown',
			'curse',
		],
	},

	lauren: {
		name: "Lauren",
		fullName: "Lauren Adora",
		baseStats: {
			vit: 30,
			str: 60,
			def: 40,
			foc: 90,
			mag: 70,
			agi: 70,
		},
		skills: [
			'starToss',
			'starVolley',
			'flare',
			'chill',
			'lightning',
			'quake',
		],
	},

	maggie: {
		name: "maggie",
		baseStats: {
			vit: 100,
			str: 90,
			def: 85,
			foc: 65,
			mag: 30,
			agi: 35,
		},
		skills: [
			'munch',
			'fatseat',
			'fatSlam',
			'flameBreath',
		],
	},

	robert: {
		name: "Robert",
		fullName: "Robert Spellbinder",
		baseStats: {
			vit: 75,
			str: 75,
			def: 75,
			foc: 75,
			mag: 75,
			agi: 75,
		},
		startingWeapon: 'rsbSword',
		skills: [
			'swordSlash',
			'quickstrike',
			'flare',
			'quake',
			'chill',
			'lightning',
			'hellfire',
			'upheaval',
			'windchill',
			'electrocute',
			'omni',
			'ignite',
			'tremor',
			'frostbite',
			'jolt',
			'protect',
			'necromancy',
			'crackdown',
		],
	},

	scott: {
		name: "Scott",
		fullName: "Scott Starcross",
		baseStats: {
			vit: 70,
			str: 70,
			def: 70,
			foc: 70,
			mag: 70,
			agi: 70,
		},
		startingWeapon: 'heirloom',
		skills: [
			'swordSlash',
			'quickstrike',
			'chargeSlash',
			'flare',
			'quake',
			'chill',
			'lightning',
			'hellfire',
			'upheaval',
			'windchill',
			'electrocute',
			'ignite',
			'tremor',
			'frostbite',
			'jolt',
			'crackdown',
		],
	},
};
