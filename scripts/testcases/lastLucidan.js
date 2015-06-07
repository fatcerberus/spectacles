/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

TestHarness.addBattle('temple',
{
	battleID: 'scottTemple',
	party: {
		elysia: { level: 60, weapon: 'powerBow', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		justin: { level: 60, items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
	}
});

TestHarness.addBattle('starcross',
{
	battleID: 'scottStarcross',
	party: {
		elysia: { level: 60, items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		bruce: { level: 60, weapon: 'arsenRifle', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		robert: { level: 60, weapon: 'rsbSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
	}
});
