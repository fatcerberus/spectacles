/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

global.events  = require('events');
global.from    = require('from');
global.joy     = require('joy');
global.kh2bar  = require('kh2bar');
global.music   = require('music');
global.prim    = require('prim');
global.random  = require('random');
global.scenes  = require('scenes');
global.term    = require('term');
global.threads = require('threads');

var DBG_DISABLE_TEXTBOXES = false;
var DBG_DISABLE_TRANSITIONS = false;

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

	term.define('game', global, {
		'quit': function() { system.exit(); },
	});
	term.define('yap', null, {
		'on': function() {
			DBG_DISABLE_TEXTBOXES = false;
			term.print("Oh, yappy times are here again...");
		}, 
		'off': function() {
			DBG_DISABLE_TEXTBOXES = true;
			term.print("The yappy times are OVER!");
		}, 
	});

	// set up the beta test harness
	TestHarness.initialize();

	// show the title screen and start the game!
	var manifest = system.game;
	if (!manifest.disableSplash) {
		music.push('music/SpectaclesTheme.ogg');
		ShowLogo('images/Logos/TitleCard.png', 300);
	}
	var session = new TitleScreen('SpectaclesTheme').show();
	analogue.getWorld().session = session;
	LucidaClock.initialize();
	MapEngine('Testville.rmp', screen.frameRate);
}

// clone() function
// Creates a deep copy of an object, preserving circular references.
// Arguments:
//     o: The object to clone.
// Returns:
//     The new, cloned object.
function clone(o)
{
	var memo = arguments.length >= 2 ? arguments[1] : [];
	if (typeof o === 'object' && o !== null) {
		for (var i = 0; i < memo.length; ++i) {
			if (o === memo[i].original) {
				return memo[i].dolly;
			}
		}
		var dolly = Array.isArray(o) ? []
			: 'clone' in o && typeof o.clone === 'function' ? o.clone()
			: {};
		memo[memo.length] = { original: o, dolly: dolly };
		if (Array.isArray(o) || !('clone' in o) || typeof o.clone !== 'function') {
			for (var p in o) {
				dolly[p] = clone(o[p], memo);
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

	if (arguments.length < 4)
		throw new RangeError("requires at least 4 arguments");

	var alignments = {
		left:   (font, x, text) => x,
		center: (font, x, text) => x - font.getStringWidth(text) / 2,
		right:  (font, x, text) => x - font.getStringWidth(text),
	};
	if (!(alignment in alignments))
		throw new TypeError("invalid alignment mode `" + alignment + "`");

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
//     time:      The amount of time, in frames, to keep the image on-screen.
function ShowLogo(filename, time)
{
	var image = new Image(filename);
	var scene = new scenes.Scene()
		.fadeTo(Color.Black, 0)
		.fadeTo(Color.Transparent, 60)
		.pause(time)
		.fadeTo(Color.Black, 60)
		.run();
	threads.join(threads.create({
		update: function() { return scene.isRunning(); },
		render: function() { prim.blit(screen, 0, 0, image); }
	}));
	new scenes.Scene()
		.fadeTo(Color.Transparent, 0)
		.run(true);
}
