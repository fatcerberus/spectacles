/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2015 Power-Command
***/

// FieldSprite() constructor
// Creates an object representing a field sprite.
// Arguments:
//     id:        A string used to identify the sprite.
//     spriteset: The filename of the spriteset used for this sprite.
//     mapID:     The ID of the map the sprite occupies.
//     x:         The X coordinate of the sprite's location on the map.
//     y:         The Y coordinate of the sprite's location on the map.
function FieldSprite(id, spriteset, mapID, x, y)
{
	this.id = id;
	this.image = new SpriteImage(spriteset);
	this.image.stop();
	this.direction = null;
	this.mapID = mapID;
	this.x = x;
	this.y = y;
	Console.writeLine("Created field sprite '" + this.id + "'");
	Console.append("map: " + this.mapID);
}

FieldSprite.prototype.render = function(xOffset, yOffset)
{
	this.image.blit(this.x + xOffset, this.y + yOffset);
};

FieldSprite.prototype.stop = function()
{
	if (this.direction !== null) {
		this.direction = null;
		this.image.stop();
		Console.writeLine("Field sprite '" + this.id + "' stopped walking");
	}
};

FieldSprite.prototype.update = function()
{
	this.image.update();
	switch (this.direction) {
		case 'north': --this.y; break;
		case 'south': ++this.y; break;
		case 'west': --this.x; break;
		case 'east': ++this.x; break;
	}
};

FieldSprite.prototype.walk = function(directionID)
{
	if (directionID != this.direction) {
		Console.writeLine("Field sprite '" + this.id + "' is walking " + directionID);
		this.direction = directionID;
		this.image.direction = this.direction;
		this.image.resume();
	}
};
