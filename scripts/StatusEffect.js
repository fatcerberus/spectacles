/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// StatusEffect() constructor
// Creates an object representing the manifestation of a status.
// Arguments:
//     subject: The battle unit affected by the status effect.
//     handle:  The ID of the status as defined in the gamedef.
function StatusEffect(subject, statusID)
{
	if (!(statusID in Game.statuses)) {
		Abort("StatusEffect(): The status definition '" + statusID + "' doesn't exist!");
	}
	this.context = {};
	this.name = Game.statuses[statusID].name;
	this.status = Game.statuses[statusID];
	this.statusID = statusID;
	this.subject = subject;
}

// .invoke() method
// Invokes the status, raising a specified status event.
// Arguments:
//     eventID: The ID of the event to raise. If the correct event hook doesn't exist in
//              the status definition, .invoke() does nothing.
//     event:   An object specifying the parameters for the event. Note that the hook function may
//              add or change properties in the event object.
StatusEffect.prototype.invoke = function(eventID, event)
{
	if (!(eventID in this.status)) {
		return;
	}
	Console.writeLine("Invoking status " + this.name);
	Console.append("event: " + eventID);
	this.status[eventID].call(this.context, this.subject, event);
};
