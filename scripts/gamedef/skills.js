/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.skills =
{
	// Sword techniques
	swordSlash:
	{
		name: "Sword Slash",
		category: 'sword',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Sword Slash",
				rank: 2,
				accuracyType: 'sword',
				baseExperience: {
					user: {
						str: 1
					},
					target: {
						def: 1
					}
				},
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 10
					}
				]
			}
		]
	},
	
	quickstrike:
	{
		name: "Quickstrike",
		category: 'sword',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Quickstrike",
				rank: 1,
				accuracyType: 'sword',
				baseExperience: {
					user: {
						str: 1
					}
				},
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 5
					}
				]
			}
		]
	},
	
	chargeSlash:
	{
		name: "Charge Slash",
		category: 'sword',
		weaponType: 'sword',
		targetType: "single",
		actions: [
			{
				rank: 3,
				effects: [
					{
						targetHint: "user",
						type: 'addStatus',
						status: 'offGuard'
					}
				]
			},
			{
				announceAs: "Charge Slash",
				rank: 2,
				accuracyType: 'sword',
				baseExperience: {
					user: {
						str: 3,
						agi: 2
					},
					target: {
						def: 5
					}
				},
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 50
					}
				]
			}
		]
	},
	
	// Tier 1 elemental spells
	flare:
	{
		name: "Flare",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Flare",
				rank: 2,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 25,
						element: 'fire'
					}
				],
			}
		]
	},
	
	chill:
	{
		name: "Chill",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Chill",
				rank: 2,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 25,
						element: 'ice'
					}
				],
			}
		]
	},
	
	lightning:
	{
		name: "Lightning",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Lightning",
				rank: 2,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 25,
						element: 'lightning'
					}
				],
			}
		]
	},
	
	quake:
	{
		name: "Quake",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Quake",
				rank: 2,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 25,
						element: 'earth'
					}
				],
			}
		]
	},
	
	// Strategic techniques/status inflictors
	crackdown:
	{
		name: "Crackdown",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 200,
		actions: [
			{
				announceAs: "Crackdown",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'crackdown'
					}
				],
			}
		]
	},
	
	necromancy:
	{
		name: "Necromancy",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 100,
		actions: [
			{
				announceAs: "Necromancy",
				rank: 3,
				effects: [
					{
						targetHint: "selected",
						type: 'addStatus',
						status: 'zombie'
					}
				]
			}
		]
	},
	
	
	
	
	fatSlam: {
		name: "Fat Slam",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Fat Slam",
				rank: 3,
				accuracyType: 'physical',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 75,
						element: 'fat'
					}
				],
			}
		]
	},
	munch: {
		name: "Munch",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Munch",
				rank: 5,
				accuracyType: 'devour',
				effects: [
					{
						targetHint: 'selected',
						type: 'devour',
						successRate: 1.0
					}
				],
			}
		]
	},
	omni: {
		name: "Omni",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 500,
		actions: [
			{
				announceAs: "Omni",
				rank: 4,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 100
					}
				],
			}
		]
	},
	sharpshooter: {
		name: "Sharpshooter",
		category: 'attack',
		weaponType: 'rifle',
		targetType: 'single',
		actions: [
			{
				announceAs: "Sharpshooter",
				rank: 3,
				accuracyType: 'pistol',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'pistol',
						power: 40
					}
				]
			}
		]
	},
	shootout: {
		name: "Shootout",
		category: 'attack',
		weaponType: 'pistol',
		targetType: 'multiple',
		actions: [
			{
				announceAs: "Shootout",
				rank: 3,
				accuracyType: 'pistol',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'pistol',
						power: 50
					}
				]
			}
		]
	}
},
