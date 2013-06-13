/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// StatusContext() constructor
// Creates an object representing a manifestation of a status.
// Arguments:
//     statusID: The ID of the status, as defined in the gamedef.
//     unit:     The battler to be subjected to the status's effects.
function StatusContext(statusID, unit)
{
	if (!(statusID in Game.statuses)) {
		Abort("StatusContext(): The status definition '" + statusID + "' doesn't exist!");
	}
	this.context = {};
	this.name = Game.statuses[statusID].name;
	this.statusDef = Game.statuses[statusID];
	this.statusID = statusID;
	this.unit = unit;
	if ('overrules' in this.statusDef) {
		for (var i = 0; i < this.statusDef.overrules.length; ++i) {
			this.unit.liftStatus(this.statusDef.overrules[i]);
		}
	}
	if ('initialize' in this.statusDef) {
		this.statusDef.initialize.call(this.context, this.unit);
	}
}

// .beginCycle() method
// Applies static effects defined for the status, such as stat modifiers. This method should
// be called at the beginning of every CTB cycle.
StatusContext.prototype.beginCycle = function()
{
	if ('statModifiers' in this.statusDef) {
		for (var stat in Game.namedStats) {
			if (!(stat in this.statusDef.statModifiers)) {
				continue;
			}
			var multiplier = this.statusDef.statModifiers[stat];
			this.unit.battlerInfo.stats[stat] = Math.floor(multiplier * this.unit.battlerInfo.stats[stat]);
		}
	}
};

// .invoke() method
// Invokes the status effect, calling a specified event handler.
// Arguments:
//     eventID: The ID of the event to raise.
//     data:    Optional. An object containing data for the event. Note that the event handler is allowed
//              to add or change properties of this object.
// Remarks:
//     If the status definition doesn't contain a handler for the event, nothing happens.
StatusContext.prototype.invoke = function(eventID, data)
{
	data = data !== void null ? data : null;
	
	if (!(eventID in this.statusDef)) {
		return;
	}
	Console.writeLine("Invoking " + this.unit.name + "->" + this.name);
	Console.append("event: " + eventID);
	this.statusDef[eventID].call(this.context, this.unit, data);
};

// .overrules() method
// Determines whether a specified status is overruled by this one.
// Arguments:
//     statusID: The status to check, as defined in the gamedef.
// Remarks:
//     true if the specified status is overruled by this one; false otherwise.
StatusContext.prototype.overrules = function(statusID)
{
	if (!('overrules' in this.statusDef)) {
		return false;
	}
	for (var i = 0; i < this.statusDef.overrules.length; ++i) {
		if (statusID == this.statusDef.overrules[i]) {
			return true;
		}
	}
	return false;
};
