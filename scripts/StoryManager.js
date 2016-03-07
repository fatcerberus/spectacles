/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

StoryManager = new (function()
{
})();

StoryManager.show = function(sceneID)
{
	var sceneHandler = Game.scenes[sceneID];
	var lastInputPerson = GetInputPerson();
	DetachInput();
	sceneHandler();
	AttachInput(lastInputPerson);
}
