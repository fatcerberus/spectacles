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
		SetDelayScript(0, 'StoryManager.show(\'openingScenes\');');
	}
})
