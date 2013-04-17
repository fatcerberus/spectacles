/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("lib/persist.js");
RequireScript("lib/tween.js");

RequireScript("Core/Engine.js");
RequireScript("Core/BGM.js");
RequireScript("Session.js");
/*ALPHA*/ RequireScript("Cutscenes.js");

RequireScript("Game.js");

function game()
{
	Engine.initialize();
	persist.init();
	
	/*BGM.track = "Spectacles theme";
	Engine.showLogo("TitleCard", 150);*/
	SetUpdateScript("Threads.updateAll();");
	SetRenderScript("Threads.renderAll();");
	MapEngine("main.rmp", 30);
}
