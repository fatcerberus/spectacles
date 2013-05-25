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

// .getRank() method
// Calculates the move rank of using the item.
ItemUsable.prototype.getRank = function()
{
	return Game.useItemMoveRank;
};

// .isUsable() method
// Determines whether the item can be used by a specified battler.
// Arguments:
//     unit: The battle unit for which to check for usability.
// Returns:
//     true if the item can be used; false otherwise.
ItemUsable.prototype.isUsable = function(user)
{
	return this.isUnlimited || this.usesLeft > 0;
};

// .mpCost() method
// Calculates the MP cost of using the item.
ItemUsable.prototype.mpCost = function(user)
{
	return 0;
};

// .use() method
// Utilizes the item, consuming one of its uses.
// Arguments:
//     unit: The battle unit using the item.
// Returns:
//     A list of battle actions to be executed.
ItemUsable.prototype.use = function(unit)
{
	if (!this.isUsable(unit)) {
		Abort("ItemUsable.use(): " + unit.name + " tried to use " + this.name + ", which was unusable.");
	}
	--this.usesLeft;
	return [ Game.items[this.itemID].action ];
}
