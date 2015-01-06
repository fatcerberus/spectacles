/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2015 Power-Command
***/

// FieldSprite() constructor
// Creates an object representing a field sprite.
// Arguments:
//     spriteset: The filename of the spriteset used for this sprite.
//     x:         The X coordinate of the sprite's location on the map.
//     y:         The Y coordinate of the sprite's location on the map.
function FieldSprite(spriteset, x, y)
{
	this.sprite = new SpriteImage(spriteset);
}

FieldSprite.prototype.render = function()
{
};

FieldSprite.prototype.update = function()
{
};
