/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Game.js");

// StatusEffect() constructor
// Creates an object representing a status effect.
// Arguments:
//     subject: The BattleUnit affected by the status effect.
//     name:    The name of the status class (e.g. "Poison") this effect represents.
function StatusEffect(subject, name)
{
	if (!name in Game.statuses) {
		Abort("[StatusEffect.js] Status():\nStatus class '" + name + "' doesn't exist.");
	}
	this.displayName = name;
	this.subject = subject;
	this.statusClass = Game.statuses[name];
	this.context = {};
}

// .name property
// Gets the display name of the status effect
StatusEffect.prototype.name getter = function()
{
	return this.displayName;
};

// .invoke() method
// Invokes the status, raising a specified status event.
// Arguments:
//     eventName: The name of the event to raise. If the correct hook function doesn't exist in
//                the status definition, .invoke() does nothing.
//     event:     An object specifying the parameters for the event. Note that the hook function may
//                add or change properties in the event object.
StatusEffect.prototype.invoke = function(eventName, event)
{
	if (!eventName in this.statusClass) {
		return null;
	}
	this.statusClass[eventName].call(this.context, this.subject, event);
};
