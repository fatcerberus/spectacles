/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// Scrambler() constructor
// Creates a random battle scrambler, which monitors the movement of an entity
// to determine when to trigger random battles.
// Arguments:
//     personID: The name of the entity, as passed to CreatePerson().
// Remarks:
//     The scrambler starts out in a paused state. No battles will be triggered until
//     the scrambler's .start() method is called. This enables scramblers to be created
//     prior to starting the map engine without generating runtime errors.
function Scrambler(personID)
{
	this.encounterRate = 0.01;
	this.personID = personID;
	Console.writeLine("Created random battle scrambler for '" + this.personID + "'");
	Console.append("encRate: ~" + Math.round(this.encounterRate * 100) + "%");
}

Scrambler.prototype.setBattles = function(battleIDs)
{
	this.battleIDs = clone(battleIDs);
};

Scrambler.prototype.setEncounterRate = function(newRate)
{
	this.encounterRate = Math.min(Math.max(newRate, 0.0), 1.0);
};

Scrambler.prototype.start = function()
{
	this.lastX = GetPersonX(this.personID);
	this.lastY = GetPersonY(this.personID);
	Threads.createEntityThread(this);
	Console.writeLine("Started random battle scrambler for '" + this.personID + "'");
};

Scrambler.prototype.update = function()
{
	var x = GetPersonX(this.personID);
	var y = GetPersonY(this.personID);
	if ((x != this.lastX || y != this.lastY) && IsCommandQueueEmpty(this.personID)
	    && RNG.chance(this.encounterRate))
	{
		var inputPerson = GetInputPerson();
		DetachInput(inputPerson);
		var battleID = RNG.fromArray(this.battleIDs);
		Console.writeLine("Random battle triggered by '" + this.personID + "'");
		Console.append("battleID: " + battleID);
		new Scenario()
			.battle(battleID)
			.run(true);
		AttachInput(inputPerson);
	}
	this.lastX = x;
	this.lastY = y;
	return true;
};
