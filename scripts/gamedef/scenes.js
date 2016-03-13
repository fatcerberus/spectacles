/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

Game.scenes =
{
	openingScenes: function() {
		new scenes.Scene()
			.fadeTo(CreateColor(0, 0, 0, 255), 0.0)
			.pushBGM('BruceTellsHisStory')
			.pause(1.0)
			.talk("Bruce", false, 1.0, 2.0,
				"I tried so hard to make him understand, but for so long, he refused to listen...",
				"So many times I said to myself, \"Bruce, why do you even bother?\" Anything to prove to myself that I wasn't the one at fault--that the reason he wouldn't listen was because of his own denial, not because I was pushing far too hard...",
				"I was so intent on convincing him of Spellbinder's dishonesty that I didn't step back to take a look at the bigger picture. I refused to. And in the end, I wasn't the one hurt by it.")
			.pause(1.0)
			.talk("Bruce", false, 1.0, 2.0, "He was.")
			.pause(2.0)
			.talk("Bruce", false, 1.0, 2.0, "Honestly, though? The thing that truly amazes me, even now...")
			.pause(1.0)
			.adjustBGM(0.0, 5.0)
			.pause(1.0)
			.changeMap('Portentia.rmp')
			.fork()
				.changeBGM('ThePromise')
				.adjustBGM(1.0, 2.0)
			.end()
			.fadeTo(CreateColor(0, 0, 0, 0), 2.0)
			.resync()
			.talk("Robert", true, 2.0, Infinity, "There must be some other way, Amanda...")
			.pause(2.0)  // TODO: Amanda looks into the distance
			.talk("Amanda", true, 2.0, Infinity, "Circumstances beyond my control long ago forced my hand. Frankly, I don't see that I have any other choice. At times I wonder if I ever did...")
			.talk("Robert", true, 2.0, Infinity, "I get it, I really do. It's just... well, I just wish you didn't have to leave Lucida to do it.")
			.pause(1.0)  // TODO: Amanda faces house
			.talk("Amanda", true, 2.0, Infinity,
				"It's not as though I can't imagine how you feel. We all have a lot of memories here... it's home. But I can't just linger about the manor pretending the prophecy will magically go away.",
				"Robert, if I don't do something...")
			.pause(1.0)  // TODO: Amanda uses Flare to set the house ablaze
			.talk("Amanda", true, 2.0, Infinity, "Lucida would be destroyed.")
			.pause(0.5)  // TODO: Robert steps away from burning house
			.talk("Robert", true, 2.0, Infinity, "So this is it? You're just going to walk out on all of us?")
			.talk("Amanda", true, 2.0, Infinity, "Remember something for me, Robert. Not once have I ever left you to fend for yourself. No matter what's happened, I've always come back. Always.")
			.talk("Robert", true, 2.0, Infinity, "Maybe it's nothing. I don't know. But I can't help thinking I'll never see you again. I'm worried, Amanda. More worried than I've ever been about anything. What if something happens? What if you don't return?")
			.talk("Amanda", true, 2.0, Infinity, "I'll come back, Robert. I promise.")
			.fork()
				.pause(0.5)
				.pause(1.0)  // TODO: Amanda walks away
			.end()
			.pause(2.0)
			.fork()
				.adjustBGM(0.0, 5.0)
			.end()
			.fadeTo(CreateColor(0, 0, 0, 255), 2.0)
			.talk("Bruce", false, 1.0, 2.0, "...is that it all began with a promise.")
			.pause(2.0)
			.popBGM()
			.changeMap('Portentia.rmp')
			.adjustBGM(1.0)
			.fadeTo(CreateColor(0, 0, 0, 0), 5.0)
			.pause(5.0)
			.pause(2.0)  // TODO: Scott walks out of his house
			.talk("Scott", true, 2.0, Infinity,
				"The lights are out...",
				"What's going on?")
			.run(true);
	},
	
	argumentAtSnowplain: function() {
		new scenes.Scene()
			.talk("Scott", true, 1.0, Infinity,
				"I suppose I shouldn't be surprised...",
				"Victor Spellbinder being my father, I mean.",
				"At times, I felt like Robert saw me as a brother...  I guess now I know why.")
			.talk("Elkovsky", true, 1.0, Infinity, "Victor fathered eleven children.  You are the youngest--the eleventh.  Per the prophecy made twenty years ago, the eleventh Littermate is destined to destroy the Primus.")
			.talk("Scott", true, 1.0, Infinity, "But what IS the Primus?")
			.run(true);
	},
	
	lamentForBruce: function() {
		new scenes.Scene()
			.fadeTo(new Color(0, 0, 0, 255), 0.0)
			.talk("Scott", true, 2.0, 2.0, "Bruce!")
			.pause(1.0)
			.pushBGM('LamentForBruce')
			.talk("Scott", false, 1.0, Infinity,
				"No...", "He sacrificed himself to save me...")
			.fadeTo(new Color(0, 0, 0, 255), 2.0)
			.talk("Scott", false, 1.0, Infinity,
				"Everything we've been through and I never saw this coming.",
				"Never.")
			// TODO: fade in to Snowplain
			.talk("Scott", false, 1.0, Infinity,
				"If I had been honest with myself I might have realized it, said to myself " +
				"\"Hey wait a minute, Scott, you've known Bruce a lot longer than you have Robert!\" " +
				"I... well, I had no reason to distrust him. Unfortunately, I let Robert skew my " +
				"judgement, and well... look where we are.")
			.pause(2.0)
			.talk("Scott", false, 1.0, Infinity,
				"I'm not even sure anymore what I saw in Robert. He'd proven early on that the only " +
				"thing he cared about was putting his sister in her place for breaking a stupid promise " +
				"that, in the end, was inconsequential.")
			.pause(1.0)
			.talk("Scott", false, 1.0, Infinity,
				"He used me. And everyone could see but me, because I was too blind to see it on my own.")
			.pause(1.0)
			.talk("Scott", false, 1.0, Infinity,
				"I wanted so desperately to believe that Robert could be trusted that I refused to " +
				"consider anything else. Bruce's warnings, my own common sense, everything--it all " +
				"fell on deaf ears.")
			// TODO: fade to Lexington Park
			.pause(2.0)
			.talk("Scott", false, 1.0, Infinity,
				"At some level though, I knew. I had to, because every time I so much as set foot in " +
				"Lexington Park, I remembered just how Bruce and I had met... and I realized, if only " +
				"for a moment, that Bruce was right.")
			.pause(2.0)
			.talk("Scott", false, 1.0, Infinity,
				"What's truly unfortunate is that... well, Bruce must have blamed himself, right? " +
				"When I wouldn't listen to reason, he'd have accused himself of pushing too hard. " +
				"That was his personality.")
			.pause(3.0)
			.talk("Scott", false, 1.0, Infinity,
				"So why should I be surprised? Bruce gave his life to save me, knowing that if he'd " +
				"ever owed me anything, his dues would be paid in full.")
			// TODO: fade back to present
			.talk("Scott", true, 2.0, Infinity, "This... this was his final selfless act.")
			.pause(1.0)
			// TODO: Lauren walks over
			.talk("Lauren", true, 2.0, 2.0, "Scott...")
			.fadeTo(new Color(0, 0, 0, 255), 2.0)
			.run(true);
	}
};
