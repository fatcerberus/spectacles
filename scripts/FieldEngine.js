/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2015 Power-Command
***/

RequireScript('FieldSprite.js');
RequireScript('MapContext.js');

// FieldEngine() constructor
// Creates an object representing a field engine instance.
// Arguments:
//     session: The game session hosting this map engine.
function FieldEngine(session)
{
	Console.writeLine("Initializing field engine");
	this.cameraX = 0;
	this.cameraY = 0;
	this.mapContext = null;
}

FieldEngine.prototype.loadMap = function(mapID)
{
	if (this.mapContext !== null) {
		this.mapContext.invoke('onLeave');
	}
	this.mapContext = new MapContext(mapID);
	BGM.change(this.mapContext.mapDef.bgm);
	this.mapContext.invoke('onEnter');
};

FieldEngine.prototype.render = function()
{
};

FieldEngine.prototype.run = function(mapID)
{
	Console.writeLine("Starting field engine");
	Console.append("mapID: " + mapID);
	this.loadMap(mapID);
	Threads.waitFor(Threads.createEntityThread(this));
};

FieldEngine.prototype.update = function()
{
	return true;
};
