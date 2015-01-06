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
	this.cameraSprite = null;
	this.inputSprite = null;
	this.mapContext = null;
}

// .attachCamera() method
// Attaches the camera to a field sprite so that when the sprite moves, the map scrolls
// to follow it.
// Arguments:
//     sprite: The FieldSprite the camera is being attached to.
FieldEngine.prototype.attachCamera = function(sprite)
{
};

// .attachInput() method
// Attaches a player's input to a field sprite, allowing that player to control the sprite's movements.
// Arguments:
//     sprite: A reference to the FieldSprite to be controlled.
//     player: Optional. A player constant specifying which player will control the sprite.
//             (default: PLAYER_1)
FieldEngine.prototype.attachInput = function(sprite, player)
{
	player = player !== void null ? player : PLAYER_1;
	
	this.inputSprite = sprite;
};

FieldEngine.prototype.getInput = function()
{
	
};

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
