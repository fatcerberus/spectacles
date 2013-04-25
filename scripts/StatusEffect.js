/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Game.js");

function StatusEffect(subject, name)
{
	if (!name in Game.statuses) {
		Abort("[StatusEffect.js] Status():\nStatus class '" + name + "' doesn't exist.");
	}
	this.subject = subject;
	this.statusClass = Game.statuses[name];
	this.context = {};
}

StatusEffect.prototype.invoke = function(eventName, event)
{
	if (eventName in this.statusClass) {
		this.statusClass[eventName].call(this.context, this.subject, event);
	}
};
