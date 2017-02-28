/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

TestHarness.addBattle('horse',
{
	battleID: 'headlessHorse',
	party: {
		scott: { level: 8, weapon: 'heirloom', items: [ 'tonic' ] },
		bruce: { level: 8, weapon: 'arsenRifle', items: [ 'tonic' ] },
		maggie: { level: 8, items: [ 'tonic', 'alcohol' ] },
	}
});

TestHarness.addBattle('rsb1',
{
	battleID: 'rsbBalcony',
	party: {
		scott: {
			level: 45, weapon: 'templeSword',
			items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ]
		},
	}
});

TestHarness.addBattle('rsb2',
{
	battleID: 'rsbFinal',
	party: {
		scott: {
			level: 50, weapon: 'templeSword',
			items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ],
		},
	}
});
