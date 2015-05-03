/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

RequireSystemScript('mini/delegate.js');
RequireSystemScript('mini/RNG.js');
RequireSystemScript('mini/threads.js');

RequireScript('lib/analogue.js');
RequireScript('lib/Link.js');
RequireScript('lib/Scenario.js');
RequireScript('lib/SpriteImage.js');

var DBG_DISABLE_BATTLES = false;
var DBG_DISABLE_BGM = false;
var DBG_DISABLE_TEXTBOXES = false;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_DISABLE_TITLE_SCREEN = true;
var DBG_DISABLE_TRANSITIONS = false;
var DBG_LOG_CONSOLE_OUTPUT = true;
var DBG_IN_GAME_CONSOLE = true;

RequireScript('Core/Engine.js');
RequireScript('Core/BGM.js');
RequireScript('Core/Console.js');
RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('FieldMenu.js');
RequireScript('GameOverScreen.js');
RequireScript('LucidaClock.js');
RequireScript('MenuStrip.js');
RequireScript('Scrambler.js');
RequireScript('Session.js');
RequireScript('TestHarness.js');
RequireScript('TitleScreen.js');

EvaluateScript('Game.js');

// game() function
// This is called by Sphere when the game is launched.
function game()
{
	// check for required Sphere functionality
	var extensions = typeof GetExtensions === 'undefined'
		? [ 'sphere-legacy-api', 'sphere-map-engine' ]
		: GetExtensions();
	var q = Link(extensions);
	var isSupportedEngine = GetVersion() >= 1.5
		&& q.contains('sphere-legacy-api')
		&& q.contains('sphere-obj-constructors')
		&& q.contains('sphere-obj-props')
		&& q.contains('sphere-map-engine')
		&& q.contains('sphere-galileo')
		&& q.contains('minisphere-new-sockets')
		&& q.contains('minisphere-rng-object')
		&& q.contains('set-script-function');
	if (!isSupportedEngine) {
		Abort("This engine is not supported.\n");
	}
	
	// initialize Specs Engine components
	Engine.initialize(60);
	Threads.initialize();
	BGM.initialize();
	Scenario.initialize();
	Threads.createEx(Scenario, {
		priority: 99,
		update: function() { return this.updateAll(), true; },
		render: function() { this.renderAll(); }
	});
	Console.initialize();
	analogue.init();
	
	// set up the beta test harness
	TestHarness.initialize();
	EvaluateScript('DebugHelp/BattleTests.js');
	
	// show the title screen and start the game!
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.override('SpectaclesTheme');
		Engine.showLogo('TitleCard', 5.0);
	}
	var session = new TitleScreen('SpectaclesTheme').show();
	analogue.getWorld().session = session;
	LucidaClock.initialize();
	
	SetTalkActivationKey(GetPlayerKey(PLAYER_1, PLAYER_KEY_A));
	SetTalkActivationButton(0);
	BindKey(GetPlayerKey(PLAYER_1, PLAYER_KEY_X), 'analogue.getWorld().session.fieldMenu.open();', null);
	MapEngine('Testville.rmp', 60);
}

// PATCH! - Scenario.run() method
// Scenario's built-in wait loop locks out the Specs threader under most circumstances.
// This causes a deadlock because Scenario is waiting for its own operation to finish, but
// because the threader is blocked and thus unable to update Scenario, well...
(function() {
	var Scenario_run = Scenario.prototype.run;
	Scenario.prototype.run = function(waitUntilDone)
	{
		waitUntilDone = waitUntilDone !== void null ? waitUntilDone : false;
		
		value = Scenario_run.call(this, false);
		if (waitUntilDone) {
			Threads.join(Threads.createEx(this, {
				update: function() { return this.isRunning(); }
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
