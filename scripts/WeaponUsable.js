/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// WeaponUsable() constructor
// Creates a Usable that causes the user to change weapons.
// Arguments:
//     weaponID: The weapon ID of the weapon to equip.
function WeaponUsable(weaponID)
{
	if (!(weaponID in Game.weapons)) {
		Abort("WeaponUsable(): The weapon ID '" + weaponID + "' doesn't exist. I think it mysteriously disappeared...");
	}
	this.givesExperience = false;
	this.isUnlimited = true;
	this.weaponDef = clone(Game.weapons[weaponID]);
	this.isGroupCast = false;
	this.weaponID = weaponID;
	this.name = this.weaponDef.name;
	this.useAiming = false;
	this.allowDeadTarget = false;
}

// .clone() method
// Creates a copy of the WeaponUsable in its current state.
WeaponUsable.prototype.clone = function()
{
	var newCopy = new WeaponUsable(this.weaponID);
	return newCopy;
};

// .defaultTargets() method
// Determines the default targets for the usable.
// Arguments:
//     user: The battle unit which will use the Usable.
// Returns:
//     An array of battle unit references specifying the default targets.
WeaponUsable.prototype.defaultTargets = function(user)
{
	return [ user ];
};

// .getRank() method
// Calculates the move rank of using the item.
WeaponUsable.prototype.getRank = function()
{
	return Game.equipWeaponRank;
};

// .isUsable() method
// Determines whether the Usable can be used by a specified battler.
// Arguments:
//     unit:   The battle unit for which to check for usability.
//     stance: Optional. The user's stance. (default: BattleStance.attack)
// Returns:
//     true if the item can be used; false otherwise.
WeaponUsable.prototype.isUsable = function(user, stance)
{
	return stance == BattleStance.attack;
};

// .mpCost() method
// Calculates the MP cost of using the Usable.
// Remarks:
//     Equipping weapons does not require MP, so this method will always return 0.
WeaponUsable.prototype.mpCost = function(user)
{
	return 0;
};

// .use() method
// Uses the WeaponUsable, which triggers a weapon change.
// Arguments:
//     unit:    The battler using the WeaponUsable.
//     targets: An array of BattleUnit references specifying the battler(s) being equipped.
WeaponUsable.prototype.use = function(unit, targets)
{
	if (!this.isUsable(unit, unit.stance)) {
		Abort("WeaponUsable.use(): " + unit.name + " tried to change weapons, which is not currently possible.");
	}
	mini.Console.write(unit.name + " is equipping " + this.name);
	mini.Console.append("targ: " + (targets.length > 1 ? "[multi]" : targets[0].name));
	link(targets).invoke('setWeapon', this.weaponID);
	return null;
}
