/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

export
const Enemies =
{
	robert2:
	{
		name: "Robert",
		fullName: "Robert Spellbinder",
		aiType: 'robert-lexington',
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

	scottTemple:
	{
		name: "S. Temple",
		fullName: "Scott Victor Temple",
		aiType: 'scott-temple',
		hasLifeBar: true,
		tier: 4,
		turnRatio: 1.5,
		baseStats: {
			vit: 80,
			str: 80,
			def: 80,
			foc: 80,
			mag: 80,
			agi: 80,
		},
		immunities: [],
		weapon: 'templeSword',
		munchData: {
			skill: 'omni',
		},
		items: [
			'fullTonic',
			'holyWater',
			'powerTonic',
			'vaccine',
		],
	}
};
