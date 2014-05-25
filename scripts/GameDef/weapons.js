/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.weaponTypes =
{
	bow: "Bow",
	guitar: "Guitar",
	gun: "Gun",
	staff: "Staff",
	sword: "Sword"
};

Game.weapons =
{
	// Swords
	heirloom: {
		name: "Heirloom",
		type: 'sword',
		level: 5,
		techniques: [
			'swordSlash',
			'quickstrike'
		]
	},
	rsbSword: {
		name: "Robert's Sword",
		type: 'sword',
		level: 50,
		techniques: [
			'swordSlash',
			'quickStrike',
			'chargeSlash'
		]
	},
	templeSword: {
		name: "Temple Sword",
		type: 'sword',
		level: 75,
		techniques: [
			'swordSlash',
			'quickstrike',
			'chargeSlash'
		]
	},
	
	// Guns
	arsenRifle: {
		name: "Arsen's Rifle",
		type: 'gun',
		level: 5,
		techniques: [
			'potshot',
			'sharpshooter',
			'shootout'
		]
	},
	
	// Bows
	fireAndIce: {
		name: "Fire & Ice",
		type: 'bow',
		level: 5,
		techniques: [
			'archery',
			'flareShot',
			'chillShot'
		]
	},
	
	// Staves
	luckyStaff: {
		name: "Lucky Staff",
		type: 'staff',
		level: 5
	}
};
