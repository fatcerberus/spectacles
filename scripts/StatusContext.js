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
	terminal.log("Initializing status context " + unit.name + "->" + this.name);
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
// Applies static effects defined for the status, such as stat modifiers.
// Remarks:
//     This method should be called at the beginning of every CTB cycle, after
//     the subject's battler info has been refreshed.
StatusContext.prototype.beginCycle = function()
{
	if ('statModifiers' in this.statusDef) {
		for (var stat in Game.namedStats) {
			var multiplier = stat in this.statusDef.statModifiers
				? this.statusDef.statModifiers[stat]
				: 1.0;
			this.unit.battlerInfo.stats[stat] = Math.round(multiplier * this.unit.battlerInfo.stats[stat]);
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
	terminal.log("Invoking " + this.unit.name + "->" + this.name, "evt: " + eventID);
	this.unit.battle.suspend();
	this.statusDef[eventID].call(this.context, this.unit, data);
	this.unit.battle.resume();
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
