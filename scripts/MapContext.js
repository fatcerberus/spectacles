/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2015 Power-Command
***/

// MapContext() constructor
// Creates a map context to maintain state for a map.
function MapContext(mapID)
{
	if (!(mapID in Game.maps)) {
		Abort("MapContext(): The map definition '" + mapID + "' doesn't exist!");
	}
	Console.writeLine("Creating map context for map '" + mapID + "'");
	this.mapID = mapID;
	this.mapDef = Game.maps[this.mapID];
	this.sprites = [];
	this.state = {};
}

// .invoke() method
// Calls one of the map's event handlers.
// Arguments:
//     eventID: The event ID of the event to be raised.
MapContext.prototype.invoke = function(eventID)
{
	if (eventID in this.mapDef) {
		Console.writeLine("Invoking map event " + this.mapID + "->" + eventID);
		this.mapDef[eventID].call(this.state);
	}
};

// .loadMap() method
// Loads the map into a specified field engine.
// Arguments:
//     engine: The FieldEngine that the map will be loaded into.
MapContext.prototype.loadMap = function(engine)
{
	Console.writeLine("Loading map " + this.mapID + " into field engine");
	engine.createGrid(10, 8);
};

// .unloadMap() method
// Unloads the map from the field engine, cleaning up any associated
// entities in the process.
MapContext.prototype.unloadMap = function()
{
	
};
