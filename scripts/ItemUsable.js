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
	this.useAiming = false;
	this.usesLeft = 'uses' in this.itemDef ? this.itemDef.uses : 1;
}

// .defaultTargets() method
// Determines the default targets for the item.
// Arguments:
//     user: The battle unit which will use the item.
// Returns:
//     An array of battle unit references specifying the default targets.
ItemUsable.prototype.defaultTargets = function(user)
{
	return [ user ];
};

// .getRank() method
// Calculates the move rank of using the item.
ItemUsable.prototype.getRank = function()
{
	return 'rank' in this.itemDef.action ? this.itemDef.action.rank
		: Game.defaultItemRank;
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
//     unit:    The battler using the item.
//     targets: An array of BattleUnit references specifying the battler(s) to use the item on.
// Returns:
//     An array of battle actions to be executed. Unlike with peekActions(), the contents of the array may
//     be freely modified without changing the item definition.
ItemUsable.prototype.use = function(unit, targets)
{
	if (!this.isUsable(unit)) {
		Abort("ItemUsable.use(): " + unit.name + " tried to use " + this.name + ", which was unusable.");
	}
	Console.writeLine(unit.name + " is using " + this.name);
	Console.append("targ: " + (targets.length > 1 ? "[multi]" : targets[0].name));
	--this.usesLeft;
	Console.append("left: " + this.usesLeft);
	var eventData = { item: clone(this.itemDef) };
	eventData.item.action.rank = 'rank' in eventData.item.action ? eventData.item.action.rank : Game.defaultItemRank;
	unit.raiseEvent('useItem', eventData);
	unit.battle.itemUsed.invoke(unit.id, this.itemID, Link(targets).pluck('id').toArray());
	return [ eventData.item.action ];
}
