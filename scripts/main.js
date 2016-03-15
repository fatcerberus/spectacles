/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

global.console   = require('miniRT/console');
global.delegates = require('miniRT/delegates');
global.kh2bar    = require('kh2bar');
global.link      = require('link');
global.music     = require('miniRT/music');
global.pacts     = require('miniRT/pacts');
global.scenes    = require('miniRT/scenes');
global.threads   = require('miniRT/threads');

const DBG_DISABLE_TEXTBOXES = false;
const DBG_DISABLE_TRANSITIONS = false;

RequireSystemScript('analogue.js');

RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('FieldMenu.js');
RequireScript('GameOverScreen.js');
RequireScript('LucidaClock.js');
RequireScript('MenuStrip.js');
RequireScript('Scrambler.js');
RequireScript('Session.js');
RequireScript('SpriteImage.js');
RequireScript('StoryManager.js');
RequireScript('TestHarness.js');
RequireScript('TitleScreen.js');

EvaluateScript('gamedef/game.js');

// game() function
// This is called by Sphere when the game is launched.
function game()
{
	analogue.init();

	console.register('specs', global, {
		'exit': function() { Exit(); }
	});
	console.register('yap', null, {
		'on': function() { DBG_DISABLE_TEXTBOXES = false; console.write("Oh, yappy times are here again..."); }, 
		'off': function() { DBG_DISABLE_TEXTBOXES = true; console.write("The yappy times are OVER!"); }, 
	});

	// set up the beta test harness
	TestHarness.initialize();

	// show the title screen and start the game!
	var manifest = GetGameManifest();
	if (!manifest.disableSplash) {
		music.push('music/SpectaclesTheme.ogg');
		ShowLogo('images/Logos/TitleCard.png', 5.0);
	}
	var session = new TitleScreen('SpectaclesTheme').show();
	analogue.getWorld().session = session;
	LucidaClock.initialize();
	MapEngine('Testville.rmp');
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

// ShowLogo() function
// Momentarily displays a full-screen logo.
// Arguments:
//     imageName: The file name of the image to display.
//     time:      The amount of time, in seconds, to keep the image on-screen.
function ShowLogo(filename, time)
{
	var image = new Image(filename);
	var scene = new scenes.Scene()
		.fadeTo(CreateColor(0, 0, 0, 255), 0.0)
		.fadeTo(CreateColor(0, 0, 0, 0), 1.0)
		.pause(time)
		.fadeTo(CreateColor(0, 0, 0, 255), 1.0)
		.run();
	threads.join(threads.createEx(scene, {
		update: function() { return this.isRunning(); },
		render: function() { image.blit(0, 0); }
	}));
	new scenes.Scene()
		.fadeTo(CreateColor(0, 0, 0, 0), 0.0)
		.run(true);
};
