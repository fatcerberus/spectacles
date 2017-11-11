/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

export
const Enemies =
{
	robert2: {
		name: "Robert",
		fullName: "Robert Spellbinder",
		aiClass: 'robertII',
		hasLifeBar: true,
		tier: 3,
		turnRatio: 1.0,
		baseStats: {
			vit: 75,
			str: 75,
			def: 75,
			foc: 75,
			mag: 75,
			agi: 75,
		},
		immunities: [],
		weapon: 'rsbSword',
		munchData: {
			skill: 'omni',
		},
		items: [
			'tonic',
			'powerTonic',
			'redBull',
			'holyWater',
			'vaccine',
			'alcohol',
		],
	},
};
