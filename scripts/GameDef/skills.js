Game.skills =
{
	// Sword/slashing techniques
	swordSlash: {
		name: "Sword Slash",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Sword Slash",
				rank: 2,
				accuracyType: 'sword',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 15
					}
				]
			}
		]
	},
	
	quickstrike: {
		name: "Quickstrike",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Quickstrike",
				isMelee: true,
				preserveGuard: true,
				rank: 1,
				accuracyType: 'sword',
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
	
	chargeSlash: {
		name: "Charge Slash",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Charging Up...",
				rank: 2,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'offGuard'
					}
				]
			},
			{
				announceAs: "Charge Slash",
				rank: 3,
				accuracyType: 'sword',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 75
					}
				]
			}
		]
	},
	
	berserkCharge: {
		name: "Berserk Charge",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'allEnemies',
		actions: [
			{
				announceAs: "Charging Up...",
				rank: 2,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'offGuard'
					}
				]
			},
			{
				announceAs: "Berserk Charge",
				rank: 4,
				accuracyType: 'sword',
				isMelee: true,
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
	
	desperationSlash: {
		name: "Desperation Slash",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "#9's Desperation...",
				rank: 3,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'offGuard'
					}
				]
			},
			{
				announceAs: "Desperation Slash",
				rank: 5,
				accuracyType: 'sword',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'instaKill',
						damageType: 'sword'
					}
				]
			}
		]
	},
	
	// Bow & Arrow techniques
	archery: {
		name: "Archery",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'single',
		actions: [
			{
				announceAs: "Archery",
				rank: 1,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'bow',
						power: 15
					}
				],
			}
		]
	},
	
	flareShot: {
		name: "Flare Shot",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'single',
		baseMPCost: 10,
		actions: [
			{
				announceAs: "Flare Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'bow',
						power: 10,
						element: 'fire',
						addStatus: 'ignite',
						statusChance: 50
					}
				],
			}
		]
	},
	
	chillShot: {
		name: "Chill Shot",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'single',
		baseMPCost: 10,
		actions: [
			{
				announceAs: "Chill Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'bow',
						power: 10,
						element: 'ice',
						addStatus: 'frostbite',
						statusChance: 50
					}
				],
			}
		]
	},
	
	// Rank 2 magic - damage only, 25 POW
	flare: {
		name: "Flare",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 10,
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
	
	chill: {
		name: "Chill",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 10,
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
	
	lightning: {
		name: "Lightning",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 10,
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
	
	quake: {
		name: "Quake",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 10,
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
	
	// Rank 3 magic - damage + status
	hellfire: {
		name: "Hellfire",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Hellfire",
				rank: 3,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 50,
						element: 'fire',
						addStatus: 'ignite'
					}
				]
			}
		]
	},
	
	windchill: {
		name: "Windchill",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Windchill",
				rank: 3,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 50,
						element: 'ice',
						addStatus: 'frostbite'
					}
				]
			}
		]
	},
	
	electrocute: {
		name: "Electrocute",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Electrocute",
				rank: 3,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 50,
						element: 'lightning',
						addStatus: 'zombie'
					}
				]
			}
		]
	},
	
	upheaval: {
		name: "Upheaval",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Upheaval",
				rank: 3,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 50,
						element: 'earth',
						addStatus: 'disarray'
					}
				]
			}
		]
	},
	
	// Rank 4 magic - damage + status, group-cast
	inferno: {
		name: "Inferno",
		category: 'magic',
		targetType: 'allEnemies',
		baseMPCost: 125,
		actions: [
			{
				announceAs: "Inferno",
				rank: 4,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 80,
						element: 'fire',
						addStatus: 'ignite'
					}
				]
			}
		]
	},
	
	
	crackdown: {
		name: "Crackdown",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 200,
		allowAsCounter: false,
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
				isMelee: true,
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
	fatseat: {
		name: "Fatseat",
		category: 'attack',
		targetType: 'allEnemies',
		actions: [
			{
				announceAs: "Fatseat",
				rank: 2,
				accuracyType: 'physical',
				isMelee: true,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 25,
						element: 'fat'
					}
				],
			}
		]
	},
	flameBreath: {
		name: "Flame Breath",
		category: 'magic',
		targetType: 'allEnemies',
		baseMPCost: 25,
		actions: [
			{
				announceAs: "Flame Breath",
				rank: 2,
				accuracyType: 'breath',
				preserveGuard: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'breath',
						power: 20,
						element: 'fire',
						addStatus: 'ignite'
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
				isMelee: true,
				effects: [
					{
						element: 'fat',
						targetHint: 'selected',
						type: 'devour',
						successRate: 1.0
					}
				],
			}
		]
	},
	necromancy: {
		name: "Necromancy",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 25,
		allowAsCounter: false,
		actions: [
			{
				announceAs: "Necromancy",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'zombie'
					}
				]
			}
		]
	},
	omni: {
		name: "Omni",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 100,
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
						power: 100,
						element: 'omni'
					}
				]
			}
		]
	},
	potshot: {
		name: "Potshot",
		category: 'attack',
		weaponType: 'gun',
		targetType: 'single',
		actions: [
			{
				announceAs: "Potshot",
				rank: 2,
				accuracyType: 'gun',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'gun',
						power: 15
					}
				]
			}
		]
	},
	protectiveAura: {
		name: "Protective Aura",
		category: 'strategy',
		targetType: 'ally',
		baseMPCost: 200,
		allowAsCounter: false,
		actions: [
			{
				announceAs: "Protective Aura",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'protect'
					}
				]
			}
		]
	},
	rearingKick: {
		name: "Rearing Kick",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Rear Up",
				rank: 1,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'rearing'
					}
				]
			},
			{
				announceAs: "Rearing Kick",
				rank: 2,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'user',
						type: 'liftStatus',
						statuses: [ 'ghost' ]
					},
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 25
					}
				]
			}
		]
	},
	sharpshooter: {
		name: "Sharpshooter",
		category: 'attack',
		weaponType: 'gun',
		targetType: 'single',
		actions: [
			{
				announceAs: "Lining Up...",
				rank: 2,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'sniper'
					}
				]
			},
			{
				announceAs: "Sharpshooter",
				rank: 3,
				accuracyRate: Infinity,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'gun',
						power: 75
					}
				]
			}
		]
	},
	shootout: {
		name: "Shootout",
		category: 'attack',
		weaponType: 'gun',
		targetType: 'allEnemies',
		actions: [
			{
				announceAs: "Shootout",
				rank: 3,
				accuracyType: 'gun',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'gun',
						power: 15
					}
				]
			}
		]
	},
	spectralDraw: {
		name: "Spectral Draw",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 25,
		actions: [
			{
				announceAs: "Spectral Draw",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'ghost'
					}
				]
			}
		]
	},
	spectralKick: {
		name: "Spectral Kick",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Rear Up",
				rank: 1,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'rearing'
					}
				]
			},
			{
				announceAs: "Spectral Kick",
				rank: 2,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'ghost'
					},
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 50
					}
				]
			}
		]
	},
	trample: {
		name: "Trample",
		category: 'physical',
		targetType: 'single',
		actions: [
			{
				announceAs: "Trample",
				rank: 2,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'instaKill',
						damageType: 'physical'
					}
				]
			}
		]
	}
};
