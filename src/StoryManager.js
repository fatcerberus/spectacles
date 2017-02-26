/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

StoryManager = new (function()
{
})();

StoryManager.show = function(sceneID)
{
	var sceneFunction = Game.scenes[sceneID];
	SetDelayScript(0, function() {
		var lastInputPerson = GetInputPerson();
		DetachInput();
		sceneFunction();
		AttachInput(lastInputPerson);
	});
}
