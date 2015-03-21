/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

RequireScript('lib/JS.js');
RequireScript('lib/json3.js');

RequireScript('lib/analogue.js');
RequireScript('lib/link.js');
RequireScript('lib/MultiDelegate.js');
RequireScript('lib/Scenario.js');
RequireScript('lib/SpriteImage.js');

var DBG_DISABLE_BATTLES = false;
var DBG_DISABLE_BGM = false;
var DBG_DISABLE_TEXTBOXES = false;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_DISABLE_TITLE_SCREEN = true;
var DBG_DISABLE_TRANSITIONS = false;
var DBG_LOG_CONSOLE_OUTPUT = false;
var DBG_IN_GAME_CONSOLE = true;

RequireScript('Core/Engine.js');
RequireScript('Core/BGM.js');
RequireScript('Core/Console.js');
RequireScript('Core/RNG.js');
RequireScript('Core/Threads.js');
RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('DayNightFilter.js');
RequireScript('GameOverScreen.js');
RequireScript('FieldEngine.js');
RequireScript('MenuStrip.js');
RequireScript('Scrambler.js');
RequireScript('Session.js');
RequireScript('TitleScreen.js');

EvaluateScript('Game.js');

EvaluateScript('TestHarness.js');

// game() function
// This is called by Sphere when the game is launched.
function game()
{
	Engine.initialize(60);
	Threads.initialize();
	BGM.initialize();
	Scenario.initialize();
	Threads.doWith(Scenario,
		function() { return this.updateAll(), true; },
		function() { this.renderAll(); }, 99);
	Console.initialize();
	analogue.init();
	
	TestHarness.initialize();
	TestHarness.addBattleTest('S:BS: Lumisq. x3', {
		battleID: 'lumisquirrel3',
		party: {
			scott: { level: 1, weapon: 'heirloom', items: [ 'tonic', 'alcohol' ] },
			bruce: { level: 1, weapon: 'arsenRifle', items: [ 'tonic', 'holyWater', 'vaccine' ] },
			lauren: { level: 1, weapon: 'risingSun', items: [ 'tonic' ] },
		}
	});
	TestHarness.addBattleTest('S:BS: H.Horse', {
		battleID: 'headlessHorse',
		party: {
			scott: { level: 8, weapon: 'heirloom', items: [ 'tonic', 'alcohol' ] },
			bruce: { level: 8, weapon: 'arsenRifle', items: [ 'tonic', 'holyWater', 'vaccine' ] },
			maggie: { level: 8, items: [ 'redBull' ] },
		}
	});
	TestHarness.addBattleTest('S:BS: RSB II', {
		battleID: 'robert2',
		party: {
			scott: { level: 50, weapon: 'templeSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
			//elysia: { level: 60, weapon: 'powerBow', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
			//bruce: { level: 60, weapon: 'arsenRifle', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
			//lauren: { level: 45, weapon: 'risingSun', items: [ 'tonic' ] },
			//justin: { level: 60, items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
			//maggie: { level: 8, items: [ 'redBull', 'alcohol' ] },
			//robert: { level: 60, weapon: 'rsbSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
			//amanda: { level: 60, items: [ 'powerTonic', 'redBull', 'holyWater' ] },
		}
	});
	TestHarness.addBattleTest('S3:tLL: S.Temple', {
		battleID: 'scottTemple',
		party: {
			elysia: { level: 60, weapon: 'powerBow', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
			justin: { level: 60, items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
		}
	});
	TestHarness.addBattleTest('S3:tLL: #11', {
		battleID: 'scottStarcross',
		party: {
			bruce: { level: 60, weapon: 'arsenRifle', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
			robert: { level: 60, weapon: 'rsbSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
			amanda: { level: 60, items: [ 'powerTonic', 'redBull', 'holyWater' ] },
		}
	});
	
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.override('SpectaclesTheme');
		Engine.showLogo('TitleCard', 5.0);
	}
	var session = new TitleScreen('SpectaclesTheme').show();
	analogue.getWorld().session = session;
	DayNightFilter.initialize();
	
	SetTalkActivationKey(GetPlayerKey(PLAYER_1, PLAYER_KEY_A));
	CreatePerson('hero', 'battlers/Scott.rss', false);
	AttachCamera('hero');
	AttachInput('hero');
	MapEngine('Testville.rmp', 60);
}

// PATCH! - Scenario.run() method
// Scenario's built-in wait loop locks the Specs threader under most circumstances.
// This patches it so it plays along.
(function() {
	var old_Scenario_run = Scenario.prototype.run;
	Scenario.prototype.run = function(waitUntilDone)
	{
		waitUntilDone = waitUntilDone !== void null ? waitUntilDone : false;
		
		value = old_Scenario_run.call(this, false);
		if (waitUntilDone) {
			Threads.waitFor(Threads.doWith(this, function() {
				return this.isRunning();
			}));
		}
		return value;
	};
})();

function DrawTextEx(font, x, y, text, color, shadowDistance, alignment)
{
	color = color !== void null ? color : CreateColor(255, 255, 255, 255);
	shadowDistance = shadowDistance !== void null ? shadowDistance : 0;
	alignment = alignment !== void null ? alignment : 'left';
	
	if (arguments.length < 4) {
		Abort(
			"DrawTextEx() - error: Wrong number of arguments\n" +
			"At least 4 arguments were expected; caller only passed " + arguments.length + "."
		, -1);
	}
	var alignments = {
		left: function(font, x, text) { return x; },
		center: function(font, x, text) { return x - font.getStringWidth(text) / 2; },
		right: function(font, x, text) { return x - font.getStringWidth(text); }
	};
	if (!(alignment in alignments)) {
		Abort("DrawTextEx() - error: Invalid argument\nThe caller specified an invalid text alignment mode: '" + alignment + "'.", -1);
	}
	x = alignments[alignment](font, x, text);
	var oldColorMask = font.getColorMask();
	font.setColorMask(CreateColor(0, 0, 0, color.alpha));
	font.drawText(x + shadowDistance, y + shadowDistance, text);
	font.setColorMask(color);
	font.drawText(x, y, text);
	font.setColorMask(oldColorMask);
}

// clone() function
// Creates a deep copy of an object, preserving circular references.
// Arguments:
//     o: The object to clone.
// Returns:
//     The new, cloned object.
function clone(o)
{
	var clones = arguments.length >= 2 ? arguments[1] : [];
	if (typeof o === 'object' && o !== null) {
		for (var i = 0; i < clones.length; ++i) {
			if (o === clones[i].original) {
				return clones[i].dolly;
			}
		}
		var dolly = o instanceof Array ? []
			: 'clone' in o && typeof o.clone === 'function' ? o.clone()
			: {};
		clones.push({ original: o, dolly: dolly });
		if (o instanceof Array || !('clone' in o) || typeof o.clone !== 'function') {
			for (var p in o) {
				dolly[p] = clone(o[p], clones);
			}
		}
		return dolly;
	} else {
		return o;
	}
}
