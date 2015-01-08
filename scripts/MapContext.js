/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2015 Power-Command
***/

function MapContext(mapID)
{
	if (!(mapID in Game.maps)) {
		Abort("MapContext(): The map definition '" + mapID + "' doesn't exist!");
	}
	this.mapID = mapID;
	this.mapDef = Game.maps[this.mapID];
	this.sprites = [];
	this.state = {};
}

MapContext.prototype.invoke = function(eventID, field)
{
	if (eventID in this.mapDef) {
		Console.writeLine("Invoking map event " + this.mapID + "->" + eventID);
		this.mapDef[eventID].call(this.state, field);
	}
};
