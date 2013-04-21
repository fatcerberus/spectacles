({
	enter: function(map, world)
	{
		new Scenario()
			.overrideBGM("ThePromise")
			.talk("maggie", 2.0,
				"HUNGRY HUNGRY HUNGRY HUNGRY HUNGRY HUNGRY...",
				"REALLY, I'M SO HUNGRY THAT I COULD EAT A GIANT FATTY WHALE AND UM, SOME PLANETS APPARENTLY")
			.talk("Lauren", 2.0, "maggie, you eat too much and need to go on a diet. A really, REALLY big diet.")
			.talk("maggie", 2.0,
				"What's a diet? Isn't that that thing where you stop eating for like 2 seconds and starve to death? Why would I want to do that?!",
				"You know what, screw it, I'm just going to eat you. You're nutritious, right?")
			.playSound("Munch.wav")
			.pause(1000)
			.talk("maggie", 2.0, "Tastes like chicken!")
			.talk("Scott", 2.0, "And there you have it folks, a stupid hunger-pig just ate my girlfriend for no good reason! Why does everyone suck but me?!")
			.talk("Bruce", 2.0, "Actually, you kind of suck too, Scott...")
			.pause(2000)
			.overrideBGM("BruceTellsHisStory")
			.pause(1000)
			.talk("Bruce", 1.0,
				"I tried so hard to make him understand, but for so long, he refused to listen...",
				"So many times I said to myself, \"Bruce, why do you even bother?\" Anything to prove to myself that I wasn't the one at fault--that the reason he wouldn't listen was because of his own denial, not because I was pushing far too hard...",
				"I was so intent on convincing him of Spellbinder's dishonesty that I didn't step back to take a look at the bigger picture. I refused to. And in the end, I wasn't the one hurt by it.")
			.pause(2000)
			.talk("Bruce", 1.0, "He was.")
			.fadeBGM(0.0, 5.0)
			.pause(1000)
			.run();
	}
})