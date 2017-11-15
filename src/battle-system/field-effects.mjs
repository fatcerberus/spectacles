/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { console } from '$/main.mjs';

import { Conditions, StatNames, Statuses } from '$/game-data/index.mjs';

export
class FieldCondition
{
	constructor(conditionID, battle)
	{
		if (!(conditionID in Conditions))
			throw new ReferenceError(`no such field condition '${conditionID}'`);

		this.battle = battle;
		this.context = {};
		this.name = Conditions[conditionID].name;
		this.conditionDef = Conditions[conditionID];
		this.conditionID = conditionID;
		console.log(`initialize FC context ${this.name}`);
		if ('overrules' in this.conditionDef) {
			for (let i = 0; i < this.conditionDef.overrules.length; ++i)
				this.battle.liftCondition(this.conditionDef.overrules[i]);
		}
		if ('initialize' in this.conditionDef)
			this.conditionDef.initialize.call(this.context, this.battle);
	}

	beginCycle()
	{
		// TODO: implement me? maybe?
	}

	invoke(eventID, data = null)
	{
		if (!(eventID in this.conditionDef))
			return;
		console.log(`invoke FC ${this.name}`, `evt: ${eventID}`);
		this.conditionDef[eventID].call(this.context, this.battle, data);
	}
}

export
class StatusEffect
{
	constructor(statusID, unit)
	{
		if (!(statusID in Statuses))
			throw new ReferenceError(`no such status '${statusID}'`);

		this.context = {};
		this.name = Statuses[statusID].name;
		this.statusDef = Statuses[statusID];
		this.statusID = statusID;
		this.unit = unit;
		console.log(`initialize status effect ${unit.name}->${this.name}`);
		if ('overrules' in this.statusDef) {
			for (let i = 0; i < this.statusDef.overrules.length; ++i)
				this.unit.liftStatus(this.statusDef.overrules[i]);
		}
		if ('initialize' in this.statusDef)
			this.statusDef.initialize.call(this.context, this.unit);
	}

	beginCycle()
	{
		if ('statModifiers' in this.statusDef) {
			for (let stat in StatNames) {
				let multiplier = stat in this.statusDef.statModifiers
					? this.statusDef.statModifiers[stat]
					: 1.0;
				this.unit.battlerInfo.stats[stat] = Math.round(multiplier * this.unit.battlerInfo.stats[stat]);
			}
		}
	}

	invoke(eventID, data = null)
	{
		if (!(eventID in this.statusDef))
			return;  // no-op if no handler
		console.log(`invoke ${this.unit.name}->${this.name}`, `evt: ${eventID}`);
		this.unit.battle.suspend();
		this.statusDef[eventID].call(this.context, this.unit, data);
		this.unit.battle.resume();
	}

	overrules(statusID)
	{
		if (!('overrules' in this.statusDef))
			return false;
		for (let i = 0; i < this.statusDef.overrules.length; ++i) {
			if (statusID == this.statusDef.overrules[i])
				return true;
		}
		return false;
	}
}
