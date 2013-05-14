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
RequireScript('Core/Tween.js');
RequireScript('Game.js');

var DBG_DISABLE_BATTLES = false;
var DBG_DISABLE_BGM = true;
var DBG_DISABLE_SCENE_DELAYS = true;
var DBG_DISABLE_TEXTBOXES = true;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_DISABLE_TITLE_SCREEN = true;
var DBG_DISABLE_TRANSITIONS = true;

RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('MenuStrip.js');
RequireScript('Session.js');
RequireScript('TitleScreen.js');

Array.contains = function(array, o)
{
	for (var i = 0; i < array.length; ++i) {
		if (array[i] === o) {
			return true;
		}
	}
	return false;
};

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

function delegate(o, methodName)
{
	return function(/*...*/) {
		o[methodName].apply(o, arguments)
	};
}

function game()
{
	Engine.initialize();
	BGM.initialize();
	Threads.initialize();
	persist.init();
	Console = new Console(17);
	
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.change("SpectaclesTheme");
		Engine.showLogo("TitleCard", 150);
	}
	var session = new TitleScreen("SpectaclesTheme").show();
	var world = persist.getWorldState();
	world.session = session;
	MapEngine("main.rmp", Engine.frameRate);
}
