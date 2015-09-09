/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

RequireScript('battleAI/HeadlessHorseAI.js');
RequireScript('battleAI/LumisquirrelAI.js');
RequireScript('battleAI/Robert1AI.js');
RequireScript('battleAI/Robert2AI.js');
RequireScript('battleAI/ScottTempleAI.js');
RequireScript('battleAI/ScottStarcrossAI.js');
RequireScript('battleAI/VictorAI.js');

// boss and miniboss battle definitions.
// random field battles don't have specific definitions as the
// game composes them ex nihilo on the fly.
Game.battles =
{
	// Headless Horse
	headlessHorse: {
		title: "Headless Horse",
		bgm: 'ManorBoss',
		battleLevel: 8,
		enemies: [
			'headlessHorse'
		],
		onStart: function() {
			new mini.Scene()
				.talk("maggie", true, 2.0, Infinity,
					"I'd suggest keeping your wits about you while fighting this thing if you don't want to be barbequed. "
					+ "It won't hesitate to roast you--and then I'd have to eat you!")
				.run(true);
		}
	},
	
	// Robert Spellbinder (Balcony)
	rsbBalcony: {
		title: "Robert Spellbinder",
		bgm: 'BattleForLucida',
		battleLevel: 45,
		enemies: [
			'robert1'
		]
	},
	
	// Robert Spellbinder (Final)
	rsbFinal: {
		title: "Robert Spellbinder",
		isFinalBattle: true,
		bgm: 'ThePromise',
		battleLevel: 50,
		enemies: [
			'robert2'
		],
		onStart: function() {
			var scott = this.findUnit('scott');
			if (scott != null) {
				new mini.Scene()
					.talk("Robert", true, 2.0, Infinity,
						"Bruce's death changed nothing. If anything, it's made you far too reckless. Look around, "
						+ "Scott! Where are your friends? Did they abandon you in your most desperate hour, or are you truly so "
						+ "brazen as to face me alone?")
					.talk("Scott", true, 2.0, Infinity,
						"I owe Bruce my life, Robert! To let his story end here... that's something I won't allow. "
						+ "Not now. Not when I know just what my world would become if I did!")
					.pause(2.0)
					.talk("Robert", true, 1.0, Infinity, "What makes you so sure you have a choice?")
					.resync()
					.run(true);
				if (scott != null) {
					scott.addStatus('specsAura');
				}
			}
		}
	},
	
	// Scott Temple (Boss Battle)
	// Penultimate Boss of Spectacles III
	scottTemple: {
		title: "Scott Victor Temple",
		isFinalBattle: false,
		bgm: 'MyDreamsButADropOfFuel2',
		battleLevel: 60,
		enemies: [
			'scottTemple',
			'scottTemple',
			'scottTemple',
		]
	},
	
	// Scott Starcross (Final Battle)
	// Final Boss of Spectacles III: The Last Lucidan
	scottStarcross: {
		title: "Scott Starcross",
		isFinalBattle: true,
		bgm: 'DeathComeNearMe',
		battleLevel: 60,
		enemies: [
			'starcross'
		],
		onStart: function() {
			var scottUnit = this.findUnit('starcross');
			scottUnit.addStatus('specsAura');
		}
	},
};

// enemy definitions.
// this includes boss and miniboss battlers as well as
// field enemies.
Game.enemies =
{
	// Lumisquirrel
	lumisquirrel: {
		name: "Lumisquirrel",
		aiType: LumisquirrelAI,
		baseStats: {
			vit: 30,
			str: 20,
			def: 15,
			foc: 80,
			mag: 95,
			agi: 90
		},
		damageModifiers: {
			bow: Game.bonusMultiplier,
			shuriken: Game.bonusMultiplier,
			lightning: 1 / Game.bonusMultiplier
		},
		immunities: [],
		munchData: {
			skill: 'delusion'
		}
	},
	
	// Headless Horse (Boss)
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
	
	// Victor Spellbinder (Boss)
	victor: {
		name: "Victor",
		fullName: "Victor Spellbinder",
		aiType: VictorAI,
		hasLifeBar: true,
		tier: 3,
		turnRatio: 1.0,
		baseStats: {
			vit: 50,
			str: 60,
			def: 85,
			foc: 75,
			mag: 85,
			agi: 50,
		},
		immunities: [],
		weapon: 'templeSword',
		items: [
			'alcohol'
		],
	},
	
	// Robert Spellbinder (Balcony)
	robert1: {
		name: "Robert",
		fullName: "Robert Spellbinder",
		aiType: Robert1AI,
		hasLifeBar: true,
		tier: 3,
		turnRatio: 3.0,
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
			'vaccine'
		]
	},
	
	// Robert Spellbinder (Final)
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
	
	// Scott Temple
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
	
	// Scott Starcross
	starcross: {
		name: "Scott",
		fullName: "Scott Starcross",
		aiType: ScottStarcrossAI,
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
};
