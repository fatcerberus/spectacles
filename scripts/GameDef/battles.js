/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.battles =
{
	// Headless Horse (Boss Battle)
	// Boss of Lexington Manor
	headlessHorse: {
		title: "Headless Horse",
		bgm: 'ManorBoss',
		battleLevel: 8,
		enemies: [
			'headlessHorse'
		],
		onStart: function() {
			new Scenario()
				.talk("maggie", true, 2.0, Infinity,
					"I'd suggest keeping your wits about you while fighting this thing if you don't want to be barbequed. "
					+ "It won't hesitate to roast you--and then I'd have to eat you!")
				.run(true);
		}
	},
	
	// Robert Spellbinder (II) (Final Battle)
	// Final Boss of Spectacles: Bruce's Story
	robert2: {
		title: "Robert Spellbinder",
		isFinalBattle: true,
		bgm: 'ThePromise',
		battleLevel: 50,
		enemies: [
			'robert2'
		],
		onStart: function() {
			new Scenario()
				.talk("Robert", true, 2.0, Infinity,
					"Bruce's death changed nothing. If anything, it's made you far too reckless. Look around, "
					+ "Scott! Where are your friends? Did they abandon you in your most desperate hour, or are you truly so "
					+ "brazen as to face me alone?")
				.talk("Scott", true, 2.0, Infinity,
					"I owe Bruce my life, Robert! To let his story end here... that's something I won't allow. "
					+ "Not now. Not when I know just what my world would become if I did!")
				.pause(2.0)
				.talk("Robert", true, 1.0, Infinity, "What makes you so sure you have a choice?")
				.synchronize()
				.run(true);
			this.findUnit('scott').addStatus('specsAura');
		}
	},
	
	// Scott Starcross (Final Battle)
	// Final Boss of Spectacles III: The Last Lucidan
	numberEleven: {
		title: "Scott Starcross",
		isFinalBattle: true,
		bgm: 'HymnOfLiberty',
		battleLevel: 60,
		enemies: [
			'numberEleven',
			//'katelyn'
		],
		onStart: function() {
			var katelynUnit = this.findUnit('katelyn');
			var maggieUnit = this.findUnit('maggie');
			new Scenario()
				.talk("Katelyn", true, 2.0, Infinity, "Hey guys! What'cha doing?")
				.talk("maggie", true, 2.0, Infinity, "Where the hell did this girl come from? Screw this, I'ma eat her!")
				.fork()
					.pause(1.5)
					.call(function() { katelynUnit.takeDamage(katelynUnit.hp, [], true); })
					.playSound("Munch.wav")
				.end()
				.talk("Katelyn", true, 2.0, 0.0, "NO NO NO NO AHHHHHHHHHHHH-----")
				.synchronize()
				.talk("Scott", true, 2.0, Infinity, "Can I get back to fighting Bruce and Robert now? Sheesh, talk about empty calories...")
				.talk("maggie", true, 2.0, Infinity, "Yeah, you know what? I'm still hungry. Watch this trick!")
				.call(function() { maggieUnit.takeDamage(maggieUnit.hp, [], true); })
				.playSound("Munch.wav")
				.talk("Scott", true, 0.5, Infinity, "...")
				.talk("Scott", true, 2.0, Infinity, "No comment.")
				//.run(true);
			var scottUnit = this.findUnit('numberEleven');
			scottUnit.addStatus('specsAura');
		}
	}
};
