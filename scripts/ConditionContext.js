/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// ConditionContext() constructor
// Creates an object representing a manifestation of a battle condition.
// Arguments:
//     conditionID: The ID of the battle condition, as defined in the gamedef.
//     battle:      The battle to which the condition applies.
function ConditionContext(conditionID, battle)
{
	if (!(conditionID in Game.conditions)) {
		Abort("ConditionContext(): The field condition definition '" + conditionID + "' doesn't exist!");
	}
	this.battle = battle;
	this.context = {};
	this.name = Game.conditions[conditionID].name;
	this.conditionDef = Game.conditions[conditionID];
	this.conditionID = conditionID;
	terminal.log("Initializing FC context " + this.name);
	if ('overrules' in this.conditionDef) {
		for (var i = 0; i < this.conditionDef.overrules.length; ++i) {
			this.battle.liftCondition(this.conditionDef.overrules[i]);
		}
	}
	if ('initialize' in this.conditionDef) {
		this.conditionDef.initialize.call(this.context, this.battle);
	}
}

// .beginCycle() method
// Prepares the battle condition for a new CTB cycle.
// Remarks:
//     As battle conditions apply to all units, this method should be called only
//     after all units have had their own beginCycle() methods called. Otherwise, any changes
//     made to the units' battler info here will be overwritten.
ConditionContext.prototype.beginCycle = function()
{
	// TODO: implement me? maybe?
};

// .invoke() method
// Invokes the battle condition, calling a specified event handler.
// Arguments:
//     eventID: The ID of the event to raise.
//     data:    Optional. An object containing data for the event. Note that the event handler is allowed
//              to add or change properties of this object.
// Remarks:
//     If the battle condition definition doesn't contain a handler for the event, nothing happens.
ConditionContext.prototype.invoke = function(eventID, data)
{
	data = data !== void null ? data : null;
	
	if (!(eventID in this.conditionDef)) {
		return;
	}
	terminal.log("Invoking FC " + this.name, "evt: " + eventID);
	this.conditionDef[eventID].call(this.context, this.battle, data);
};
