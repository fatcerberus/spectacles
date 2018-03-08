/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Console, Music, Scene } from 'sphere-runtime';

import { DayNightClock } from '$/dayNightSystem';
import { TestHarness } from '$/testSystem';

import './defineScenelets';

global.console =
	new Console({ hotKey: Key.Tilde });

export default
async function main()
{
	Scene.defaultPriority = 99;

	console.defineObject('bgm', null, {
		override(fileName) { Music.override(fileName); },
		pop() { Music.pop(); },
		play(fileName) { Music.play(fileName); },
		push(fileName) { Music.push(fileName); },
		reset() { Music.reset(); },
		stop() { Music.override(null); },
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

	await TestHarness.initialize();

	let dayNight = new DayNightClock();
	await TestHarness.run('rsb2');
}
