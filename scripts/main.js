/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("lib/persist.js");
RequireScript("lib/tween.js");

RequireScript("Core/Engine.js");
RequireScript("Core/BGM.js");
RequireScript("TitleScreen.js");
RequireScript("Session.js");
/*ALPHA*/ RequireScript("Cutscenes.js");
/*ALPHA*/ RequireScript("MenuStrip.js");

RequireScript("Game.js");

function game()
{
	Engine.initialize();
	persist.init();
	SetUpdateScript("Threads.updateAll();");
	SetRenderScript("Threads.renderAll();");
	BGM.track = "SpectaclesTheme";
	Engine.showLogo("TitleCard", 150);
	var choice = new TitleScreen("SpectaclesTheme").show();
	MapEngine("main.rmp", Engine.frameRate);
}
