/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.scenes =
{
	lamentForBruce: function()
	{
		new mini.Scene()
			.pushBGM('LamentForBruce')
			.talk("Scott", true, 2.0, Infinity, "Bruce! No...")
			
			.run();
	},
}
