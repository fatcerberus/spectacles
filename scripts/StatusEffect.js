/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// StatusEffect() constructor
// Creates an object representing the manifestation of a status.
// Arguments:
//     statusID: The ID of the status, as defined in the gamedef.
//     unit:     The battler to be subjected to the status's effects.
function StatusEffect(statusID, unit)
{
	if (!(statusID in Game.statuses)) {
		Abort("StatusEffect(): The status definition '" + statusID + "' doesn't exist!");
	}
	this.context = {};
	this.name = Game.statuses[statusID].name;
	this.status = Game.statuses[statusID];
	this.statusID = statusID;
	this.unit = unit;
	
	if ('overrules' in this.status) {
		for (var i = 0; i < this.status.overrules.length; ++i) {
			this.unit.liftStatus(this.status.overrules[i]);
		}
	}
	if ('initialize' in this.status) {
		this.status.initialize.call(this.context, this.unit);
	}
}

// .invoke() method
// Invokes the status, raising a specified status event.
// Arguments:
//     eventID: The ID of the event to raise. If the correct event hook doesn't exist in
//              the status definition, .invoke() does nothing.
//     data:    An object containing data for the event. Note that the event handler is allowed
//              to add or change properties of this object.
StatusEffect.prototype.invoke = function(eventID, data)
{
	if (!(eventID in this.status)) {
		return;
	}
	Console.writeLine("Invoking status " + this.name);
	Console.append("event: " + eventID);
	this.status[eventID].call(this.context, this.unit, data);
};
