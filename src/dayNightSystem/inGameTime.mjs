/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

export default
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
		return `${hourText}:${minuteText}:${secondText}`;
	}
}
