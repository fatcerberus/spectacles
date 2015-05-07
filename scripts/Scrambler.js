/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// Scrambler() constructor
// Creates a random battle scrambler, which monitors the movement of an entity
// to determine when to trigger random battles.
// Arguments:
//     name: The person entity to be monitored.
// Remarks:
//     The scrambler starts out in a paused state. No battles will be triggered until
//     the scrambler's .start() method is called. This enables scramblers to be created
//     prior to starting the map engine without generating runtime errors.
function Scrambler(name)
{
	this.name = name;
	this.encounterRate = 0.01;
	this.battleIDs = [];
	mini.Console.write("Created random battle scrambler for person '" + this.name + "'");
	mini.Console.append("encRate: ~" + Math.round(this.encounterRate * 100) + "%");
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
	this.lastX = GetPersonX(this.name);
	this.lastY = GetPersonY(this.name);
	mini.Threads.create(this);
	mini.Console.write("Started random battle scrambler for '" + this.name + "'");
};

Scrambler.prototype.update = function()
{
	if (this.battleIDs.length > 0) {
		var x = GetPersonX(this.name);
		var y = GetPersonY(this.name);
		if ((x != this.lastX || y != this.lastY) && RNG.chance(this.encounterRate)) {
			var inputPerson = IsInputAttached() ? GetInputPerson() : null;
			DetachInput();
			var battleID = RNG.sample(this.battleIDs);
			mini.Console.write("Random battle triggered by person '" + this.name + "'");
			mini.Console.append("battleID: " + battleID);
			new mini.Scene()
				.battle(battleID, analogue.getWorld().session)
				.run(true);
			if (inputPerson !== null) {
				AttachInput(inputPerson);
			}
		}
		this.lastX = x;
		this.lastY = y;
	}
	return true;
};
