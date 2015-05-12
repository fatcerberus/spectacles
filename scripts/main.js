/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

var DBG_DISABLE_BATTLES = false;
var DBG_DISABLE_TEXTBOXES = false;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_DISABLE_TITLE_SCREEN = true;
var DBG_DISABLE_TRANSITIONS = false;
var DBG_LOG_CONSOLE_OUTPUT = true;
var DBG_IN_GAME_CONSOLE = true;

RequireSystemScript('mini/Core.js');
RequireSystemScript('mini/BGM.js');
RequireSystemScript('mini/Console.js');
RequireSystemScript('mini/Link.js');
RequireSystemScript('mini/Promises.js');
RequireSystemScript('mini/RNG.js');
RequireSystemScript('mini/Scenes.js');
RequireSystemScript('mini/Threads.js');
RequireSystemScript('analogue.js');
RequireSystemScript('SpriteImage.js');

RequireScript('Core/Engine.js');
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

EvaluateScript('gamedef/game.js');

// game() function
// This is called by Sphere when the game is launched.
function game()
{
	var pact = new mini.Pact();
	var promise = pact.makePromise();
	promise.then(Print).done();
	pact.resolve(promise, promise);
	
	var extensions = typeof GetExtensions === 'undefined'
		? [ 'sphere-legacy-api', 'sphere-map-engine' ]
		: GetExtensions();
	var q = mini.Link(extensions);
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
	analogue.init();
	
	// initialize the minisphere runtime
	mini.initialize({
		consoleLines: 10,
		logFile: DBG_LOG_CONSOLE_OUTPUT ? 'consoleLog.txt' : null,
		scenePriority: 99,
	});
	
	mini.Console.register('yap', null, {
		'on': function() { DBG_DISABLE_TEXTBOXES = false; mini.Console.write("Yappy times are currently ON"); }, 
		'off': function() { DBG_DISABLE_TEXTBOXES = true; mini.Console.write("Yappy times are currently OFF"); }, 
	});
	mini.Console.register('bgm', mini.BGM, {
		'kill': function() { this.play(null); this.play = this.push = this.pop = function() {} },
		'play': function(trackName) { this.play("BGM/" + trackName + ".ogg"); },
		'pop': function() { this.pop(); },
		'push': function(trackName) { this.push("BGM/" + trackName + ".ogg"); },
		'stop': function() { this.play(null); },
		'vol': function(volume) { this.adjust(volume, 0.5); },
	});
	
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
	MapEngine('Testville.rmp', 60);
}

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
