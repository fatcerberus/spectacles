/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

// note: don't run more than one day/night engine at a time.  doing so
//       will cause multiple day/night masks to be applied to the screen,
//       which won't look too nice. :o)

import { Prim, Thread } from 'sphere-runtime';

import { console } from '$/main.mjs';

const DayMask = Color.Transparent,
      TwilightMask = new Color(0.5, 0.125, 0.0625, 0.625),
      NightMask = new Color(0.0, 0.0, 0.125, 0.5625);

export
class DayNightEngine extends Thread
{
	constructor()
	{
		super({ priority: 1 });

		console.log("initialize day/night engine", `time: ${this.now()}`);
		this.currentMask = Color.Transparent;
		this.start();
	}

	now()
	{
		let realTime = new Date();
		let currentTime = 3600 * realTime.getHours() + 60 * realTime.getMinutes() + realTime.getSeconds();
		currentTime = (currentTime * 10) % 86400;
		let hour = Math.floor(currentTime / 3600);
		let minute = Math.floor((currentTime / 60) % 60);
		let second = currentTime % 60;
		return new InGameTime(hour, minute, second);
	}

	on_render()
	{
		Prim.fill(Surface.Screen, this.currentMask);
	}

	on_update()
	{
		let now = this.now();
		if (now.hour < 5 || now.hour >= 19) {
			this.currentMask = NightMask;
		} else if (now.hour >= 7 && now.hour < 17) {
			this.currentMask = DayMask;
		} else if (now.hour >= 5 && now.hour < 6) {
			let fromMask = NightMask;
			let toMask = TwilightMask;
			let alpha = now.minute / 60;
			this.currentMask = Color.mix(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 6 && now.hour < 7) {
			let fromMask = TwilightMask;
			let toMask = DayMask;
			let alpha = now.minute / 60;
			this.currentMask = Color.mix(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 17 && now.hour < 18) {
			let fromMask = DayMask;
			let toMask = TwilightMask;
			let alpha = now.minute / 60;
			this.currentMask = Color.mix(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 18 && now.hour < 19) {
			let fromMask = TwilightMask;
			let toMask = NightMask;
			let alpha = now.minute / 60;
			this.currentMask = Color.mix(toMask, fromMask, alpha, 1.0 - alpha);
		}
	}
}

export
class InGameTime
{
	constructor(hour, minute, second)
	{
		this.hour = hour;
		this.minute = minute;
		this.second = second;
	}

	toString()
	{
		let hourText = ("0" + this.hour).slice(-2);
		let minuteText = ("0" + this.minute).slice(-2);
		let secondText = ("0" + this.second).slice(-2);
		return `${hourText}:${minuteText}`;
	}
}
