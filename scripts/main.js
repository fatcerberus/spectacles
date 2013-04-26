/**
 * Spectacles: Bruce's Story - (c) 2006-2013 Power-Command
**/

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
RequireScript("lib/tween.js");

var DBG_DISABLE_BGM = true;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_USE_FAST_TEXTBOXES = true;

function game()
{
	Engine.initialize();
	persist.init();
	SetUpdateScript("Threads.updateAll();");
	SetRenderScript("Threads.renderAll();");
	Console = new Console(15);
	
	/*ALPHA*/
	var session = new Session();
	new Battle(session, "RSB II").go();
	
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.track = "SpectaclesTheme";
		Engine.showLogo("TitleCard", 150);
	}
	var choice = new TitleScreen("SpectaclesTheme").show();
	if (choice == "Start Demo") {
		MapEngine("main.rmp", Engine.frameRate);
	}
}
