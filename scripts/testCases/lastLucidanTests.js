/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import TestHarness from '../testHarness.js';

TestHarness.addBattle('temple', {
	battleID: 'scottTemple',
	party: {
		elysia: {
			level: 60,
			weapon: 'powerBow',
			items: [
				'tonic',
				'powerTonic',
				'redBull',
				'holyWater',
				'vaccine',
			],
		},
		justin: {
			level: 60,
			items: [
				'tonic',
				'powerTonic',
				'redBull',
				'holyWater',
				'vaccine',
				'alcohol',
			],
		},
		bruce: {
			level: 60,
			weapon: 'arsenRifle',
			items: [
				'tonic',
				'powerTonic',
				'redBull',
				'holyWater',
				'vaccine',
				'lazarusPotion',
			],
		},
	},
});

TestHarness.addBattle('starcross', {
	battleID: 'scottStarcross',
	party: {
		elysia: {
			level: 100,
			items: [ 'tonic', 'powerTonic', 'redBull' ],
		},
		bruce: {
			level: 100,
			weapon: 'arsenRifle',
			items: [ 'tonic', 'powerTonic', 'redBull' ],
		},
		abigail: {
			level: 100,
			weapon: 'rsbSword',
			items: [ 'tonic', 'powerTonic', 'redBull' ],
		},
	},
});
