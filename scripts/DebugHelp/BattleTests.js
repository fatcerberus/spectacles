/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

TestHarness.addBattle('suckfest',
{
	battleID: 'suckfest',
	party: {
		scott: { level: 100, weapon: 'templeSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
	}
});

TestHarness.addBattle('lumi',
{
	battleID: 'lumisquirrel3',
	party: {
		scott: { level: 1, weapon: 'heirloom', items: [ 'tonic', 'alcohol' ] },
		bruce: { level: 1, weapon: 'arsenRifle', items: [ 'tonic', 'holyWater', 'vaccine' ] },
		lauren: { level: 1, weapon: 'risingSun', items: [ 'tonic' ] },
	}
});

TestHarness.addBattle('horse',
{
	battleID: 'headlessHorse',
	party: {
		scott: { level: 8, weapon: 'heirloom', items: [ 'tonic', 'alcohol' ] },
		bruce: { level: 8, weapon: 'arsenRifle', items: [ 'tonic', 'holyWater', 'vaccine' ] },
		maggie: { level: 8, items: [ 'redBull' ] },
	}
});

TestHarness.addBattle('rsb',
{
	battleID: 'robert2',
	party: {
		scott: { level: 50, weapon: 'templeSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
		//elysia: { level: 60, weapon: 'powerBow', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		//bruce: { level: 60, weapon: 'arsenRifle', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		//lauren: { level: 45, weapon: 'risingSun', items: [ 'tonic' ] },
		//justin: { level: 60, items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		//maggie: { level: 8, items: [ 'redBull', 'alcohol' ] },
		//robert: { level: 60, weapon: 'rsbSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
		//amanda: { level: 60, items: [ 'powerTonic', 'redBull', 'holyWater' ] },
	}
});

TestHarness.addBattle('rsb-v-maggie',
{
	battleID: 'robert2',
	party: {
		maggie: { level: 100, items: [ 'redBull', 'alcohol' ] },
	}
});

TestHarness.addBattle('temple',
{
	battleID: 'scottTemple',
	party: {
		elysia: { level: 60, weapon: 'powerBow', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		justin: { level: 60, items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
	}
});

TestHarness.addBattle('runaway-train',
{
	battleID: 'scottStarcross',
	party: {
		bruce: { level: 60, weapon: 'arsenRifle', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		robert: { level: 60, weapon: 'rsbSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
		amanda: { level: 60, items: [ 'powerTonic', 'redBull', 'holyWater' ] },
	}
});

TestHarness.addBattle('xemnas',
{
	battleID: 'scottStarcross2',
	party: {
		bruce: { level: 60, weapon: 'arsenRifle', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		robert: { level: 60, weapon: 'rsbSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
		maggie: { level: 60, items: [ 'alcohol' ] },
	}
});
