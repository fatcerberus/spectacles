({
	enter: function(map, world)
	{
		CreatePerson('hero', 'invisible.rss', false);
		AttachCamera('hero');
		new Scenario()
			.fadeTo(CreateColor(0, 0, 0, 255), 0.0)
			.overrideBGM("BruceTellsHisStory")
			.pause(1.0)
			.talk("Bruce", false, 1.0,
				"I tried so hard to make him understand, but for so long, he refused to listen...",
				"So many times I said to myself, \"Bruce, why do you even bother?\" Anything to prove to myself that I wasn't the one at fault--that the reason he wouldn't listen was because of his own denial, not because I was pushing far too hard...",
				"I was so intent on convincing him of Spellbinder's dishonesty that I didn't step back to take a look at the bigger picture. I refused to. And in the end, I wasn't the one hurt by it.")
			.pause(1.0)
			.talk("Bruce", false, 1.0, "He was.")
			.pause(2.0)
			.talk("Bruce", false, 1.0, "The thing that really amazes me, though, even now...")
			.pause(1.0)
			.adjustBGMVolume(0.0, 5.0)
			.pause(1.0)
			.teleport("Testville.rmp", 24 * 16, 24 * 16)
			.fork()
				.overrideBGM('ThePromise')
				.adjustBGMVolume(1.0, 2.0)
			.end()
			.fadeTo(CreateColor(0, 0, 0, 0), 2.0)
			.synchronize()
			.talk("Robert", true, 2.0, "There must be some other way, Amanda...")
			.pause(2.0)  // TODO: Amanda looks into the distance
			.talk("Amanda", true, 2.0, "Circumstances beyond my control long ago forced my hand. Frankly, I don't see that I have any other choice. At times I wonder if I ever did...")
			.talk("Robert", true, 2.0, "I just wish you didn't have to leave Lucida to do it.")
			.pause(1.0)  // TODO: Amanda faces house
			.talk("Amanda", true, 2.0,
				"It's not that I don't know how you feel. We all have a lot of memories here... it's home. But I can't just linger around the manor pretending the prophecy will magically go away.",
				"Robert, if I don't do something...")
			.pause(1.0)  // TODO: Amanda uses Flare to set the house ablaze
			.talk("Amanda", true, 2.0, "Lucida would be destroyed.")
			.pause(0.5)  // TODO: Robert steps away from burning house
			.talk("Robert", true, 2.0, "So this is it? You're just going to walk out on all of us?")
			.talk("Amanda", true, 2.0, "Remember something for me, Robert. Not once have I ever left you to fend for yourself. No matter what's happened, I've always come back.")
			.talk("Robert", true, 2.0, "Maybe it's nothing. I don't know. But I can't help thinking I'll never see you again. I'm worried, Amanda. More worried than I've ever been about anything. What if something happens? What if you don't return?")
			.talk("Amanda", true, 2.0, "I'll come back, Robert. That I promise.")
			.fork()
				.pause(0.5)
				.pause(1.0)  // TODO: Amanda walks away
			.end()
			.pause(2.0)
			.fork()
				.fadeTo(CreateColor(0, 0, 0, 255), 2.0)
			.end()
			.adjustBGMVolume(0.0, 5.0)
			.synchronize()
			.talk("Bruce", false, 1.0, "...is that it all began with a promise.")
			.run();
		AttachInput('hero');
	}
})
