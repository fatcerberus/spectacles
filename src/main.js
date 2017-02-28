/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
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

RequireScript('battleEngine/encounter.js');
RequireScript('gameOverScreen.js');
RequireScript('inGameClock.js');
RequireScript('menuStrip.js');
RequireScript('scenelets.js');
RequireScript('session.js');
RequireScript('testHarness.js');
RequireScript('titleScreen.js');

EvaluateScript('gameDef/game.js');

function game()
{
	// note: a game() function is needed for now because the engine was
	//       originally written for Sphere v1.  the goal is to eventually
	//       convert the Specs Engine entirely to Sphere v2.  that effort
	//       is ongoing,  but a full conversion will take a while.

	TestHarness.initialize();

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

	InGameClock.initialize();
	TestHarness.run('rsb2');
}

function clone(o)
{
	var memo = arguments.length >= 2 ? arguments[1] : [];
	if (typeof o === 'object' && o !== null) {
		for (let i = 0; i < memo.length; ++i) {
			if (o === memo[i].original)
				return memo[i].dolly;
		}
		let dolly = Array.isArray(o) ? []
			: 'clone' in o && typeof o.clone === 'function' ? o.clone()
			: {};
		memo[memo.length] = { original: o, dolly: dolly };
		if (Array.isArray(o) || !('clone' in o) || typeof o.clone !== 'function') {
			for (let p in o)
				dolly[p] = clone(o[p], memo);
		}
		return dolly;
	} else {
		return o;
	}
}

function drawTextEx(font, x, y, text, color = CreateColor(255, 255, 255), shadowDistance = 0, alignment = 'left')
{
	const Align =
	{
		left:   (font, x, text) => x,
		center: (font, x, text) => x - font.getStringWidth(text) / 2,
		right:  (font, x, text) => x - font.getStringWidth(text),
	};

	x = Align[alignment](font, x, text);
	let oldColorMask = font.getColorMask();
	font.setColorMask(CreateColor(0, 0, 0, color.alpha));
	font.drawText(x + shadowDistance, y + shadowDistance, text);
	font.setColorMask(color);
	font.drawText(x, y, text);
	font.setColorMask(oldColorMask);
}
