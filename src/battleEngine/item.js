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
		Abort("ItemUsable(): item definition `" + itemID + "` doesn't exist.");
	}
	this.givesExperience = false;
	this.isUnlimited = false;
	this.itemDef = clone(Game.items[itemID]);
	if (!('rank' in this.itemDef.action)) {
		this.itemDef.action.rank = Game.defaultItemRank;
	}
	this.isGroupCast = false;
	this.itemID = itemID;
	this.name = this.itemDef.name;
	this.useAiming = false;
	this.allowDeadTarget = 'allowDeadTarget' in this.itemDef
		? this.itemDef.allowDeadTarget
		: false;
	this.usesLeft = 'uses' in this.itemDef ? this.itemDef.uses : 1;
}

// .clone() method
// Creates a copy of the ItemUsable in its current state.
ItemUsable.prototype.clone = function()
{
	var newCopy = new ItemUsable(this.itemID);
	newCopy.usesLeft = this.usesLeft;
	return newCopy;
};

// .defaultTargets() method
// Determines the default targets for the item.
// Arguments:
//     user: The battle unit which will use the item.
// Returns:
//     An array of battle unit references specifying the default targets.
ItemUsable.prototype.defaultTargets = function(user)
{
	var target = user;
	var allies = user.battle.alliesOf(user);
	if (this.allowDeadTarget && from(allies).any(unit => !unit.isAlive())) {
		target = from(allies)
			.where(unit => !unit.isAlive())
			.sample(1).first();
	}
	return [ target ];
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
//     unit:   The battle unit for which to check for usability.
//     stance: Optional. The user's stance. (default: Stance.Attack)
// Returns:
//     true if the item can be used; false otherwise.
ItemUsable.prototype.isUsable = function(user, stance)
{
	stance = stance !== void null ? stance : Stance.Attack;
	
	return (this.isUnlimited || this.usesLeft > 0)
		&& stance == Stance.Attack;
};

// .mpCost() method
// Calculates the MP cost of using the item.
// Remarks:
//     Item use does not require MP, so this method will always return 0.
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
//     will change the underlying item definition, which is probably not what you want.
ItemUsable.prototype.peekActions = function()
{
	return [ this.itemDef.action ];
};

// .use() method
// Utilizes the item, consuming one of its uses.
// Arguments:
//     unit:    The battler using the item.
//     targets: An array of BattleUnit references specifying the battler(s) to use the item on.
// Returns:
//     An array of battle actions to be executed. Unlike with peekActions(), the contents of the array may
//     be freely modified without changing the underlying item definition.
ItemUsable.prototype.use = function(unit, targets)
{
	if (!this.isUsable(unit, unit.stance)) {
		throw new Error(unit.name + " tried to use " + this.name + ", which was unusable.");
	}
	--this.usesLeft;
	term.print(unit.name + " is using " + this.name,
		"targ: " + (targets.length > 1 ? "[multi]" : targets[0].name),
		"left: " + this.usesLeft);
	var eventData = { item: clone(this.itemDef) };
	unit.raiseEvent('useItem', eventData);
	unit.battle.itemUsed.invoke(unit.id, this.itemID,
        from(targets).select(v => v.id));
	return [ eventData.item.action ];
}
