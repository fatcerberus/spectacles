/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import TestHarness from '../testHarness.js';

TestHarness.addBattle('temple', {
	battleID: 'scottTemple',
	items: [ 'tonic', 'redBull', 'holyWater', 'alcohol' ],
	party: {
		elysia: { level: 60, weapon: 'powerBow', },
		abigail: { level: 60, weapon: 'luckyStaff' },
		bruce: { level: 60, weapon: 'arsenRifle' },
	}
});

TestHarness.addBattle('starcross', {
	battleID: 'scottStarcross',
	items: [ 'tonic', 'redBull' ],
	party: {
		elysia: { level: 100, weapon: 'powerBow' },
		bruce: { level: 100, weapon: 'arsenRifle' },
		abigail: { level: 100, weapon: 'luckyStuff' },
	}
});
