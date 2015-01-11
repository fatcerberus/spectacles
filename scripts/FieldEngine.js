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
	this.mapID = null;
	this.mapContext = null;
	this.mapDef = null;
	this.sprites = [];
	this.tileset = LoadImage('MapTiles/Grass.png');
}

// .attachCamera() method
// Attaches the camera to a field sprite so that when the sprite moves, the map scrolls
// to follow it.
// Arguments:
//     sprite: The FieldSprite the camera is being attached to.
FieldEngine.prototype.attachCamera = function(sprite)
{
	this.cameraSprite = sprite;
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
	
	if (this.inputSprite !== null) {
		this.inputSprite.stop();
	}
	this.inputSprite = sprite;
};

FieldEngine.prototype.changeMap = function(mapID)
{
	if (mapID !== this.mapID) {
		if (this.mapContext !== null) {
			this.mapContext.invoke('onLeave');
		}
		this.mapID = mapID;
		this.mapContext = new MapContext(this.mapID);
		this.mapDef = this.mapContext.mapDef;
		BGM.change(this.mapDef.bgm);
		this.mapContext.invoke('onEnter');
	}
};

// .detachInput() method
// Detaches a player's input from any sprites it may be attached to.
//     player: Optional. A player constant specifying the player whose input will be detached.
//             (default: PLAYER_1)
FieldEngine.prototype.detachInput = function(player)
{
	player = player !== void null ? player : PLAYER_1;
	
	if (this.inputSprite !== null) {
		this.inputSprite.stop();
	}
	this.inputSprite = null;
};

FieldEngine.prototype.getInput = function()
{
	if (this.inputSprite !== null && this.inputSprite.mapID == this.mapID) {
		if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_UP))) {
			this.inputSprite.walk('north');
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN))) {
			this.inputSprite.walk('south');
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT))) {
			this.inputSprite.walk('west');
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT))) {
			this.inputSprite.walk('east');
		} else {
			this.inputSprite.stop();
		}
	}
};

FieldEngine.prototype.registerSprite = function(sprite)
{
	if (!Link(this.sprites).contains(sprite)) {
		this.sprites.push(sprite);
	}
};

FieldEngine.prototype.render = function()
{
	if (this.mapID !== null) {
		var fillColor = 'canvasColor' in this.mapDef ? this.mapDef.canvasColor : CreateColor(0, 0, 0, 255);
		var cameraX = Math.max(this.cameraX, Math.round(GetScreenWidth() / 2));
		var cameraY = Math.max(this.cameraY, Math.round(GetScreenHeight() / 2));
		var mapX = cameraX - Math.round(GetScreenWidth() / 2);
		var mapY = cameraY - Math.round(GetScreenHeight() / 2);
		var tileX = Math.floor(mapX / 32);
		var tileY = Math.floor(mapY / 32);
		var offX = -(mapX % 32);
		var offY = -(mapY % 32);
		Rectangle(offX, offY, 1280, 1280, fillColor);
		for (var z = 0; z < 3; ++z) {
			for (var y = tileY; y < 10 + tileY; ++y) {
				for (var x = tileX; x < 12 + tileX; ++x) {
					this.tileset.blit((x - tileX) * 32 + offX, (y - tileY) * 32 + offY);
				}
			}
		}
		Link(this.sprites).filterBy('mapID', this.mapID).each(function(sprite) {
			sprite.render(-mapX, -mapY);
		}.bind(this));
	}
};

// .run() method
// Starts the field engine.
// Arguments:
//     mapID: Optional. The ID of the map to load at startup. If not provided or null,
//            no map will be loaded.
// Remarks:
//     If the camera is attached to a sprite when this method is called, the map
//     occupied by that sprite will be loaded instead of the one specified.
FieldEngine.prototype.run = function(mapID)
{
	mapID = mapID !== void null ? mapID : null;
	
	Console.writeLine("Starting field engine");
	Console.append("mapID: " + mapID);
	
	if (mapID !== null && this.cameraSprite !== null) {
		this.changeMap(mapID);
	}
	while (AreKeysLeft()) {
		GetKey();
	}
	Threads.waitFor(Threads.createEntityThread(this));
};

FieldEngine.prototype.update = function()
{
	Link(this.sprites).invoke('update');
	if (this.cameraSprite !== null) {
		this.changeMap(this.cameraSprite.mapID);
		this.cameraX = this.cameraSprite.x;
		this.cameraY = this.cameraSprite.y;
	}
	return true;
};
