/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// StatusEffect() constructor
// Creates an object representing a manifestation of a status.
// Arguments:
//     subject: The BattleUnit affected by the status.
//     handle:  The status ID for the status to be manifested.
function StatusEffect(subject, statusID)
{
	if (!(statusID in Game.statuses)) {
		Abort("StatusEffect(): The status definition '" + statusID + "' doesn't exist!");
	}
	this.status = Game.statuses[statusID];
	this.subject = subject;
	this.context = {};
	
	this.name = this.status.name;
	this.statusID = statusID;
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
