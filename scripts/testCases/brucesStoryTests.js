/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import TestHarness from '../testHarness.js';

TestHarness.addBattle('horse', {
	battleID: 'headlessHorse',
	party: {
		scott: {
			level: 8,
			weapon: 'templeSword',
			items: [
				'tonic',
				'powerTonic',
				'redBull',
				'holyWater',
				'vaccine',
				'alcohol',
			],
		},
	},
});

TestHarness.addBattle('rsb2', {
	battleID: 'rsbFinal',
	party: {
		scott: {
			level: 50,
			weapon: 'templeSword',
			items: [
				'tonic',
				'powerTonic',
				'redBull',
				'holyWater',
				'vaccine',
				'alcohol',
			],
		},
	},
});