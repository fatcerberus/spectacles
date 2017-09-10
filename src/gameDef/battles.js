/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleAI/robertII.js');

// boss and miniboss battle definitions.
// random field battles don't have specific definitions as the
// game composes them on-the-fly, ex nihilo.
Game.battles =
{
	rsbFinal: {
		title: "Robert Spellbinder",
		isFinalBattle: true,
		bgm: 'thePromise',
		battleLevel: 50,
		enemies: [
			'robert2'
		],
		onStart() {
			let scottUnit = this.findUnit('scott');
			if (scottUnit !== null) {
				scottUnit.addStatus('specsAura');
				new Scene()
					.talk("Robert", true, 1.0, Infinity,
						"Bruce's death changed nothing.  Hell, if anything, it's made you far too reckless. Look around, "
						+ "Scott!  Where are your friends?  Did they abandon you in your most desperate hour, or are you truly "
						+ "so brazen as to face me alone?")
					.talk("Scott", true, 1.0, Infinity,
						"I owe Bruce my life, Robert! To let his story end here... that's something I won't allow.  "
						+ "Not now. Not when I know just what my world would become if I did!")
					.pause(120)
					.talk("Robert", true, 1.0, Infinity, "What makes you so sure you have a choice?")
					.run(true);
			}
		},
	},
};

// enemy definitions.
// this includes boss and miniboss battlers as well as
// field enemies.
Game.enemies =
{
	robert2: {
		name: "Robert",
		fullName: "Robert Spellbinder",
		aiClass: Robert2AI,
		hasLifeBar: true,
		tier: 3,
		turnRatio: 1.0,
		baseStats: {
			vit: 75,
			str: 75,
			def: 75,
			foc: 75,
			mag: 75,
			agi: 75,
		},
		immunities: [],
		weapon: 'rsbSword',
		munchData: {
			skill: 'omni',
		},
		items: [
			'tonic',
			'powerTonic',
			'redBull',
			'holyWater',
			'vaccine',
			'alcohol',
		],
	},
};
