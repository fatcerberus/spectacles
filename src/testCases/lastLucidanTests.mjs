/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import TestHarness from '$/testHarness';

TestHarness.addBattle('temple',
{
	battleID: 'scottTemple',
	party: {
		elysia: {
			level: 60,
			weapon: 'powerBow',
			items: [
				'tonic',
				'powerTonic',
				'fullTonic',
				'redBull',
				'holyWater',
				'vaccine',
			],
		},
		justin: {
			level: 60,
			items: [
				'fullTonic',
				'lazarusPotion',
			],
		},
		bruce: {
			level: 60,
			weapon: 'arsenRifle',
			items: [],
		},
	}
});

TestHarness.addBattle('starcross',
{
	battleID: 'scottStarcross',
	party: {
		bruce: {
			level: 60,
			weapon: 'arsenRifle',
			items: [
				'tonic',
				'powerTonic',
				'fullTonic',
				'redBull',
				'holyWater',
				'vaccine',
			],
		},
		robert: {
			level: 60,
			weapon: 'rsbSword',
			items: [
				'tonic',
				'powerTonic',
				'fullTonic',
				'redBull',
				'holyWater',
				'vaccine',
			],
		},
		amanda: {
			level: 60,
			items: [
				'tonic',
				'powerTonic',
				'fullTonic',
				'redBull',
				'holyWater',
				'vaccine',
			],
		},
	}
});
