({
	enter: function(map, world)
	{
		var battleResult = new Battle(world.session, 'robert2').go();
		if (battleResult == BattleResult.enemyWon) {
			Abort("You lost...\n\nOh well, have fun in Terminus! Say hello to Scott Temple for me, okay? :o)");
		} else if (battleResult == BattleResult.partyWon) {
			Abort("Yay! You win!\n\nWait a minute... you didn't cheat, did you...? I'm on to you!");
		} else if (battleResult == BattleResult.partyRetreated) {
			Abort("You coward! You suck!");
		} else {
			Abort("Um... what's going on here? That was a really strange battle...");
		}
		
		new Scenario()
			.pause(2.0)
			.overrideBGM("BruceTellsHisStory")
			.pause(1.0)
			.talk("Bruce", 1.0,
				"I tried so hard to make him understand, but for so long, he refused to listen...",
				"So many times I said to myself, \"Bruce, why do you even bother?\" Anything to prove to myself that I wasn't the one at fault--that the reason he wouldn't listen was because of his own denial, not because I was pushing far too hard...",
				"I was so intent on convincing him of Spellbinder's dishonesty that I didn't step back to take a look at the bigger picture. I refused to. And in the end, I wasn't the one hurt by it.")
			.pause(2.0)
			.talk("Bruce", 1.0, "He was.")
			.fadeBGM(0.0, 5.0)
			.pause(1.0)
			.run();
	}
})
