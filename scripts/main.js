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

RequireScript("Game.js");

var DBG_DISABLE_BGM = false;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_USE_FAST_TEXTBOXES = false;

function game()
{
	Engine.initialize();
	persist.init();
	SetUpdateScript("Threads.updateAll();");
	SetRenderScript("Threads.renderAll();");
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.track = "SpectaclesTheme";
		Engine.showLogo("TitleCard", 150);
	}
	var choice = new TitleScreen("SpectaclesTheme").show();
	if (choice == "Start Demo") {
		MapEngine("main.rmp", Engine.frameRate);
	}
}
