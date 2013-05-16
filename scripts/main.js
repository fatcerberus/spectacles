/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('lib/kh2Bar.js');
RequireScript('lib/json2.js');
RequireScript('lib/MultiDelegate.js');
RequireScript('lib/persist.js');
RequireScript('lib/Scenario.js');
RequireScript('lib/SpriteImage.js');
RequireScript('Core/Engine.js');
RequireScript('Core/BGM.js');
RequireScript('Core/Console.js');
RequireScript('Core/Threads.js');
RequireScript('Game.js');

var DBG_DISABLE_BATTLES = false;
var DBG_DISABLE_BGM = true;
var DBG_DISABLE_SCENE_DELAYS = false;
var DBG_DISABLE_TEXTBOXES = true;
var DBG_DISABLE_TITLE_CARD = false;
var DBG_DISABLE_TITLE_SCREEN = false;
var DBG_DISABLE_TRANSITIONS = true;

RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('MenuStrip.js');
RequireScript('Session.js');
RequireScript('TitleScreen.js');

function game()
{
	Engine.initialize();
	Console.initialize(17);
	BGM.initialize();
	Threads.initialize();
	persist.init();
	Scenario.initialize();
	Threads.doWith(Scenario,
		function() { this.updateAll(); return true; },
		function() { this.renderAll(); }, 99
	);
	
	var battleResult = new Battle(new Session(), 'robert2').go();
	if (battleResult == BattleResult.enemyWon) {
		Abort("You lost...\n\nOh well, have fun in Terminus! Say hello to Scott Temple for me, okay? :o)");
	} else if (battleResult == BattleResult.partyWon) {
		Abort("Yay! You win!\n\nWait a minute... you didn't cheat, did you...? I'm on to you!");
	} else if (battleResult == BattleResult.partyRetreated) {
		Abort("You coward! You suck!");
	} else {
		Abort("Um... what's going on here? That was a really strange battle...");
	}
	
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.change("SpectaclesTheme");
		Engine.showLogo("TitleCard", 150);
	}
	var session = new TitleScreen("SpectaclesTheme").show();
	var world = persist.getWorldState();
	world.session = session;
	MapEngine("main.rmp", Engine.frameRate);
}

function clone(o)
{
	var clones = arguments.length >= 2 ? arguments[1] : [];
	if (typeof o === 'object' && o !== null) {
		for (var i = 0; i < clones.length; ++i) {
			if (o === clones[i].original) {
				return clones[i].dolly;
			}
		}
		var dolly = {};
		clones.push({ original: o, dolly: dolly });
		for (var p in o) {
			dolly[p] = clone(o[p], clones);
		}
		return dolly;
	} else {
		return o;
	}
};

function delegate(o, method)
{
	return function(/*...*/) {
		method.apply(o, arguments);
	};
}
