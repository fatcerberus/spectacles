/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// Scrambler() constructor
// Creates a random battle scrambler, which monitors the movement of an entity
// to determine when to trigger random battles.
// Arguments:
//     field:  The field engine the scrambler will run under. Needed to disable field
//             input when a battle starts.
//     sprite: The FieldSprite to be monitored.
// Remarks:
//     The scrambler starts out in a paused state. No battles will be triggered until
//     the scrambler's .start() method is called. This enables scramblers to be created
//     prior to starting the map engine without generating runtime errors.
function Scrambler(field, sprite)
{
	this.field = field;
	this.sprite = sprite;
	this.encounterRate = 0.01;
	this.battleIDs = [];
	Console.writeLine("Created random battle scrambler for '" + this.sprite.id + "'");
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
	this.lastX = this.sprite.x;
	this.lastY = this.sprite.y;
	Threads.createEntityThread(this);
	Console.writeLine("Started random battle scrambler for '" + this.sprite.id + "'");
};

Scrambler.prototype.update = function()
{
	if (this.battleIDs.length > 0) {
		var x = this.sprite.x;
		var y = this.sprite.y;
		if ((x != this.lastX || y != this.lastY) && RNG.chance(this.encounterRate)) {
			var inputSprite = this.field.inputSprite;
			this.field.detachInput();
			var battleID = RNG.fromArray(this.battleIDs);
			Console.writeLine("Random battle triggered by '" + this.sprite.id + "'");
			Console.append("battleID: " + battleID);
			new Scenario()
				.battle(battleID)
				.run(true);
			this.field.attachInput(inputSprite);
		}
		this.lastX = x;
		this.lastY = y;
	}
	return true;
};
