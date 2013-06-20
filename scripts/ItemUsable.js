/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// ItemUsable() constructor
// Creates an object representing a consumable item.
// Arguments:
//     itemID: The ID of the item as defined in the gamedef.
function ItemUsable(itemID)
{
	if (!(itemID in Game.items)) {
		Abort("ItemUsable(): The item definition '" + itemID + "' doesn't exist.");
	}
	this.givesExperience = false;
	this.isUnlimited = false;
	this.itemDef = Game.items[itemID];
	this.itemID = itemID;
	this.name = Game.items[itemID].name;
	this.usesLeft = 1;
	
	if ('uses' in this.itemDef) {
		this.usesLeft = this.itemDef.uses;
	}
}

// .getRank() method
// Calculates the move rank of using the item.
ItemUsable.prototype.getRank = function()
{
	return !('rank' in this.itemDef.action) ? Game.defaultItemRank
		: this.itemDef.action.rank;
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

// .peekActions() method
// Peeks at the battle actions that will be executed if the item is used.
// Returns:
//     A list of battle actions that will be executed when the item is used.
// Remarks:
//     The array returned by this method should be considered read-only. Changing its contents
//     will change the item definition, which is probably not what you want.
ItemUsable.prototype.peekActions = function()
{
	return [ Game.items[this.itemID].action ];
};

// .use() method
// Utilizes the item, consuming one of its uses.
// Arguments:
//     unit: The battler using the item.
// Returns:
//     An array of battle actions to be executed. Unlike with peekActions(), the contents of the array may
//     be freely modified without changing the item definition.
ItemUsable.prototype.use = function(unit)
{
	if (!this.isUsable(unit)) {
		Abort("ItemUsable.use(): " + unit.name + " tried to use " + this.name + ", which was unusable.");
	}
	Console.writeLine(unit.name + " is using item " + this.name);
	--this.usesLeft;
	Console.append("usesLeft: " + this.usesLeft);
	var eventData = { item: clone(this.itemDef) };
	eventData.item.action.rank = 'rank' in eventData.item.action ? eventData.item.action.rank : Game.defaultItemRank;
	unit.raiseEvent('useItem', eventData);
	return [ eventData.item.action ];
}
