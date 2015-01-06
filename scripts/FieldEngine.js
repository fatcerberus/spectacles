/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2015 Power-Command
***/

// FieldEngine() constructor
// Creates an object representing a field engine instance.
// Arguments:
//     session: The game session hosting this map engine.
function FieldEngine(session)
{
	Console.writeLine("Initializing field engine");
	this.cameraX = 0;
	this.cameraY = 0;
}

FieldEngine.prototype.render = function()
{
};

FieldEngine.prototype.run = function(mapID)
{
	Console.writeLine("Starting field engine");
	Console.append("mapID: " + mapID);
	Threads.waitFor(Threads.createEntityThread(this));
};

FieldEngine.prototype.update = function()
{
	return true;
};
