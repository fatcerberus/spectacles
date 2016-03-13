({
	enter: function(map, world)
	{
		CreatePerson('hero', 'battlers/Scott.rss', false);
		AttachCamera('hero');
		AttachInput('hero');
		SetPersonVisible('hero', false);
		world.scrambler = new Scrambler('hero');
		world.scrambler.setBattles([ 'headlessHorse' ]);
		world.scrambler.start();
		music.play('music/ScottsHomecoming.ogg');
		StoryManager.show('argumentAtSnowplain');
	}
})
