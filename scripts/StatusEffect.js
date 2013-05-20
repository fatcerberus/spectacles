/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// StatusEffect() constructor
// Creates an object representing a status effect.
// Arguments:
//     subject: The BattleUnit affected by the status effect.
//     handle:  The status definition handle, e.g. 'zombie', as listed in Game.js.
function StatusEffect(subject, handle)
{
	if (!(handle in Game.statuses)) {
		Abort("StatusEffect(): Status definition '" + handle + "' doesn't exist.");
	}
	this.statusHandle = handle;
	this.statusClass = Game.statuses[this.statusHandle];
	this.subject = subject;
	this.context = {};
}

// .name property
// Gets the display name of the status effect
StatusEffect.prototype.name getter = function()
{
	return this.statusClass.name;
};

// .statusID property
// Gets the ID of the status manifested by this StatusEffect.
StatusEffect.prototype.statusID getter = function()
{
	return this.statusHandle;
};

// .invoke() method
// Invokes the status, raising a specified status event.
// Arguments:
//     eventHandle: The handle of the event to raise. If the correct event hook doesn't exist in
//                  the status definition, .invoke() does nothing.
//     event:     An object specifying the parameters for the event. Note that the hook function may
//                add or change properties in the event object.
StatusEffect.prototype.invoke = function(eventHandle, event)
{
	if (!(eventHandle in this.statusClass)) {
		return;
	}
	Console.writeLine("Invoking status " + this.name);
	Console.append("event: " + eventHandle);
	this.statusClass[eventHandle].call(this.context, this.subject, event);
};
