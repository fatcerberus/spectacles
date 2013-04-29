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
var DBG_DISABLE_TITLE_CARD = false;
var DBG_USE_FAST_TEXTBOXES = false;

function game()
{
	Engine.initialize(30);
	persist.init();
	SetUpdateScript("Threads.updateAll();");
	SetRenderScript("Threads.renderAll();");
	Console = new Console(17);
	
	/*ALPHA*/
	var session = new Session();
	var battleResult = new Battle(session, "RSB II").go();
	if (battleResult == BattleResult.enemyWon) {
		Abort("You lost...\n\nOh well, have fun in Terminus! Say hello to Scott Temple for me, okay?");
	} else if (battleResult == BattleResult.partyWon) {
		Abort("Yay! You win!\n\nWait a minute... you didn't cheat by having maggie eat Robert, did you...? I'm on to you!");
	} else if (battleResult == BattleResult.partyRetreated) {
		Abort("You coward! You suck!");
	} else {
		Abort("Um... what's going on here? That was a really strange battle...");
	}
	/*ALPHA*/
	
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.track = "SpectaclesTheme";
		Engine.showLogo("TitleCard", 150);
	}
	var choice = new TitleScreen("SpectaclesTheme").show();
	if (choice == "Start Demo") {
		MapEngine("main.rmp", Engine.frameRate);
	}
}
