/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

const DayMask      = Color.Transparent;
const TwilightMask = new Color(0.5, 0.125, 0.0625, 0.625);
const NightMask    = new Color(0, 0, 0.125, 0.5625);

class InGameClock
{
	static initialize()
	{
		term.print("initialize in-game clock", `time: ${this.getTime()}`);

		this.currentMask = Color.Transparent
		threads.create(this, 1);
	}
	
	static update()
	{
		var now = this.getTime();
		var toMask;
		var fromMask;
		var alpha;
		if (now.hour < 5 || now.hour >= 19) {
			this.currentMask = NightMask;
		} else if (now.hour >= 7 && now.hour < 17) {
			this.currentMask = DayMask;
		} else if (now.hour >= 5 && now.hour < 6) {
			fromMask = NightMask;
			toMask = TwilightMask;
			alpha = now.minute / 60;
			this.currentMask = Color.mix(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 6 && now.hour < 7) {
			fromMask = TwilightMask;
			toMask = DayMask;
			alpha = now.minute / 60;
			this.currentMask = Color.mix(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 17 && now.hour < 18) {
			fromMask = DayMask;
			toMask = TwilightMask;
			alpha = now.minute / 60;
			this.currentMask = Color.mix(toMask, fromMask, alpha, 1.0 - alpha);
		} else if (now.hour >= 18 && now.hour < 19) {
			fromMask = TwilightMask;
			toMask = NightMask;
			alpha = now.minute / 60;
			this.currentMask = Color.mix(toMask, fromMask, alpha, 1.0 - alpha);
		}
		return true;
	}
	
	static render()
	{
		prim.fill(screen, this.currentMask);
	}
	
	static getTime()
	{
		let realTime = new Date();
		let currentTime = 3600 * realTime.getHours() + 60 * realTime.getMinutes() + realTime.getSeconds();
		currentTime = (currentTime * 10) % 86400;
		let hour = Math.floor(currentTime / 3600);
		let minute = Math.floor((currentTime / 60) % 60);
		let second = currentTime % 60;
		return new InGameTime(hour, minute, second);
	}
}

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
