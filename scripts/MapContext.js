/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2015 Power-Command
***/

function MapContext(mapID)
{
	if (!(mapID in Game.maps)) {
		Abort("MapContext(): The map definition '" + mapID + "' doesn't exist!");
	}
	this.mapDef = Game.maps[mapID];
	this.state = {};
}

MapContext.prototype.invoke = function(eventID)
{
	if (eventID in this.mapDef) {
		this.mapDef[eventID].call(this.state);
	}
};
