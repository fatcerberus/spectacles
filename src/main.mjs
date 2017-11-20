/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { Console, Music, Scene } from 'sphere-runtime';

import { DayNightEngine } from './in-game-clock.mjs';
import { Party } from './party-manager.mjs';
import { TestHarness } from './test-harness.mjs';

import './scenelets.mjs';

export const console =
	new Console({ hotKey: Key.Tilde });

export default
class SpecsEngine
{
	constructor()
	{
		Scene.defaultPriority = 99;

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
	}

	async start()
	{
		await TestHarness.initialize();

		let dayNight = new DayNightEngine();
		await TestHarness.run('rsb2');
	}
}

export
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

export
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
