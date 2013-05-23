/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function Item(itemID)
{
	this.isUnlimited = false;
	this.usesLeft = itemID.uses;
	
	this.itemID = itemID;
	this.name = itemID.name;
}

Item.prototype.isUsable = function()
{
	return this.isUnlimited || this.usesLeft > 0;
};

Item.prototype.use = function()
{
	if (!this.isUnlimited && this.usesLeft <= 0) {
		return null;
	}
	--this.usesLeft;
	return Game.items[this.itemID].action;
}
