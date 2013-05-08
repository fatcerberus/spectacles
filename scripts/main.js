/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Engine.js");
RequireScript("Core/BGM.js");
RequireScript("Core/Console.js");
RequireScript("Core/Threads.js");
RequireScript("Battle.js"); /*ALPHA*/
RequireScript("Cutscenes.js"); /*ALPHA*/
RequireScript("Session.js");
RequireScript("TitleScreen.js");
RequireScript("Game.js");

RequireScript("lib/persist.js");

var DBG_DISABLE_BGM = true;
var DBG_DISABLE_TEXTBOXES = true;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_DISABLE_TITLE_SCREEN = true;

function delegate(o, methodName)
{
	return function(/*...*/) {
		o[methodName].apply(o, arguments)
	};
}

function game()
{
	Engine.initialize();
	persist.init();
	SetUpdateScript("Threads.updateAll();");
	SetRenderScript("Threads.renderAll();");
	Console = new Console(17);
	
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.track = "SpectaclesTheme";
		Engine.showLogo("TitleCard", 150);
	}
	var session = new TitleScreen("SpectaclesTheme").show();
	var world = persist.getWorldState();
	world.session = session;
	MapEngine("main.rmp", Engine.frameRate);
}
