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
// Loads the map represented by this map context from disk.
MapContext.prototype.loadMap = function()
{
};
