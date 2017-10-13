/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

const from     = require('from').default,
      Console  = require('console').default,
      Delegate = require('delegate').default,
      Image    = require('image').default,
      Joypad   = require('joypad').default,
      Music    = require('music').default,
      Prim     = require('prim').default,
      Random   = require('random').default,
      Scene    = require('scene').default,
      Thread   = require('thread').default;

const { DayNightEngine } = require('$/inGameClock');

RequireScript('battleEngine/battle.js');
RequireScript('gameOverScreen.js');
RequireScript('menuStrip.js');
RequireScript('scenelets.js');
RequireScript('session.js');
RequireScript('testHarness.js');
RequireScript('titleScreen.js');

EvaluateScript('gameDef/game.js');

global.console = new Console({ hotKey: Key.Tilde });

async function game()
{
	// note: a game() function is needed for now because the engine was
	//       originally written for Sphere 1.x.  the goal is to eventually
	//       convert the Specs Engine entirely to Sphere v2.  that effort
	//       is ongoing,  but a full conversion will take a while.

	console.defineObject('bgm', null, {
		override(fileName) { Music.override(fileName); },
		pop() { Music.pop(); },
		play(fileName) { Music.play(fileName); },
		push(fileName) { Music.push(fileName); },
		reset() { Music.reset(); },
		stop(fileName) { Music.override(null); },
		volume(value) { Music.adjustVolume(value); },
	});

	console.defineObject('yap', null, {
		'on': function() {
			Sphere.Game.disableTalking = false;
			console.log("oh, yappy times are here again...");
		},
		'off': function() {
			Sphere.Game.disableTalking = true;
			console.log("the yappy times are OVER!");
		},
	});

	TestHarness.initialize();

	let dayNight = new DayNightEngine();
	await TestHarness.run('rsb2');
}

function clone(o, memo = [])
{
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
		'left':   (font, x, text) => x,
		'center': (font, x, text) => x - font.getStringWidth(text) / 2,
		'right':  (font, x, text) => x - font.getStringWidth(text),
	};

	x = Align[alignment](font, x, text);
	let oldColorMask = font.getColorMask();
	font.setColorMask(CreateColor(0, 0, 0, color.alpha));
	font.drawText(x + shadowDistance, y + shadowDistance, text);
	font.setColorMask(color);
	font.drawText(x, y, text);
	font.setColorMask(oldColorMask);
}
