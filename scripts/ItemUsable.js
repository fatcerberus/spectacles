/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// ItemUsable() constructor
// Creates an object representing a usable item.
// Arguments:
//     itemID: The ID of the item as defined in the gamedef.
function ItemUsable(itemID)
{
	if (!(itemID in Game.items)) {
		Abort("ItemUsable(): The item definition '" + itemID + "' doesn't exist.");
	}
	this.isUnlimited = false;
	this.itemID = itemID;
	this.name = Game.items[itemID].name;
	this.usesLeft = Game.items[itemID].uses;
}

// .isUsable() method
// Determines whether the item can be used.
// Returns:
//     true if the item is currently usable; false otherwise.
ItemUsable.prototype.isUsable = function()
{
	return this.isUnlimited || this.usesLeft > 0;
};

// .use() method
// Utilizes the item, consuming one of its uses.
// Returns:
//     A list of battle actions to be executed by the item user.
ItemUsable.prototype.use = function()
{
	if (!this.isUsable()) {
		return null;
	}
	--this.usesLeft;
	return [ Game.items[this.itemID].action ];
}
