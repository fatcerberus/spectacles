/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import TestHarness from '../testHarness.js';

TestHarness.addBattle('horse', {
	battleID: 'headlessHorse',
	items: [ 'tonic' ],
	party: {
		scott: { level: 8, weapon: 'templeSword' },
	}
});

TestHarness.addBattle('bev', {
	battleID: 'beverly',
	items: [ 'tonic', 'powerTonic', 'redBull' ],
	party: {
		scott: { level: 15, weapon: 'templeSword' },
		maggie: { leve: 15 },
		lauren: { level: 15, weapon: 'risingSun' },
	}
});

TestHarness.addBattle('rsb2', {
	battleID: 'rsbFinal',
	items: [
		'tonic',
		'powerTonic',
		'redBull',
		'holyWater',
		'vaccine',
		'alcohol'
	],
	party: {
		scott: { level: 50, weapon: 'templeSword' },
	},
});
