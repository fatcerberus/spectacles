/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('AIs/HeadlessHorseAI.js');
RequireScript('AIs/NumberElevenAI.js');
RequireScript('AIs/Robert2AI.js');
RequireScript('AIs/ScottTempleAI.js');

Game.enemies =
{
	// Headless Horse (Spectacles: Bruce's Story)
	// Manor Boss of Lexington Manor
	headlessHorse: {
		name: "H. Horse",
		fullName: "Headless Horse",
		aiType: HeadlessHorseAI,
		hasLifeBar: true,
		tier: 2,
		turnRatio: 3.0,
		baseStats: {
			vit: 50,
			str: 10,
			def: 55,
			foc: 65,
			mag: 30,
			agi: 70
		},
		damageModifiers: {
			bow: Game.bonusMultiplier,
			gun: Game.bonusMultiplier,
			fire: -1.0,
			fat: Game.bonusMultiplier
		},
		immunities: [],
		munchData: {
			skill: 'spectralDraw'
		}
	},
	
	// Robert Spellbinder (II) (Spectacles: Bruce's Story)
	// Final Boss of Spectacles: Bruce's Story
	robert2: {
		name: "Robert",
		fullName: "Robert Spellbinder",
		aiType: Robert2AI,
		hasLifeBar: true,
		tier: 3,
		turnRatio: 1.0,
		baseStats: {
			vit: 75,
			str: 75,
			def: 75,
			foc: 75,
			mag: 75,
			agi: 75
		},
		immunities: [],
		weapon: 'rsbSword',
		munchData: {
			skill: 'omni'
		},
		items: [
			'tonic',
			'powerTonic',
			'redBull',
			'holyWater',
			'vaccine',
			'alcohol'
		]
	},
	
	// Scott Temple (Spectacles III)
	// Penultimate Boss of Spectacles III
	scottTemple: {
		name: "Scott T",
		fullName: "Scott Victor Temple",
		aiType: ScottTempleAI,
		hasLifeBar: true,
		tier: 3,
		turnRatio: 2.0,
		baseStats: {
			vit: 100,
			str: 85,
			def: 80,
			foc: 60,
			mag: 90,
			agi: 70
		},
		immunities: [ 'zombie' ],
		weapon: 'templeSword'
	},
	
	// Scott Starcross (Spectacles III)
	// Final Boss of Spectacles III
	numberEleven: {
		name: "Scott",
		fullName: "Scott Starcross",
		aiType: NumberElevenAI,
		hasLifeBar: true,
		tier: 4,
		turnRatio: 2.0,
		baseStats: {
			vit: 80,
			str: 80,
			def: 80,
			foc: 80,
			mag: 80,
			agi: 80
		},
		immunities: [],
		weapon: 'templeSword'
	},
	
	// Xemnas (Kingdom Hearts II)
	// No idea what the heck this guy is doing here! My guess is he's probably going
	// to get eaten. By a hunger-pig. Which will then, um, eat itself, for... some reason?
	// Probably to show off.
	xemnas: {
		name: "Xemnas",
		fullName: "Xemnas Ignoto",
		aiType: NumberElevenAI,
		hasLifeBar: true,
		tier: 4,
		baseStats: {
			vit: 100,
			str: 100,
			def: 100,
			foc: 100,
			mag: 100,
			agi: 100
		},
		immunities: [],
		weapon: 'templeSword'
	}
};
