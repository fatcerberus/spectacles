/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

global.events  = require('events');
global.from    = require('from');
global.joy     = require('joy');
global.music   = require('music');
global.prim    = require('prim');
global.random  = require('random');
global.scenes  = require('scenes');
global.term    = require('term');
global.threads = require('threads');

RequireSystemScript('analogue.js');

RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('FieldMenu.js');
RequireScript('GameOverScreen.js');
RequireScript('inGameClock.js');
RequireScript('MenuStrip.js');
RequireScript('session.js');
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

	term.define('yap', null, {
		'on': function() {
			Sphere.Game.disableTalking = false;
			term.print("oh, yappy times are here again...");
		}, 
		'off': function() {
			Sphere.Game.disableTalking = true;
			term.print("the yappy times are OVER!");
		}, 
	});

	// set up the beta test harness
	TestHarness.initialize();

	InGameClock.initialize();
	TestHarness.run('rsb2');
}

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

function drawTextEx(font, x, y, text, color = CreateColor(255, 255, 255), shadowDistance = 0, alignment = 'left')
{
	const Align = {
		left:   (font, x, text) => x,
		center: (font, x, text) => x - font.getStringWidth(text) / 2,
		right:  (font, x, text) => x - font.getStringWidth(text),
	};

	x = Align[alignment](font, x, text);
	var oldColorMask = font.getColorMask();
	font.setColorMask(CreateColor(0, 0, 0, color.alpha));
	font.drawText(x + shadowDistance, y + shadowDistance, text);
	font.setColorMask(color);
	font.drawText(x, y, text);
	font.setColorMask(oldColorMask);
}
