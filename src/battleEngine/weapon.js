/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

class WeaponUsable
{
	constructor(weaponID)
	{
		if (!(weaponID in Game.weapons))
			throw new ReferenceError(`no weapon definition for '${weaponID}'`);

		this.givesExperience = false;
		this.isUnlimited = true;
		this.weaponDef = clone(Game.weapons[weaponID]);
		this.isGroupCast = false;
		this.weaponID = weaponID;
		this.name = this.weaponDef.name;
		this.useAiming = false;
		this.allowDeadTarget = false;
	}

	clone()
	{
		var newCopy = new WeaponUsable(this.weaponID);
		return newCopy;
	}

	defaultTargets(user)
	{
		return [ user ];
	}

	getRank()
	{
		return Game.equipWeaponRank;
	}

	isUsable(user, stance = Stance.Attack)
	{
		return stance == Stance.Attack;
	}

	mpCost(user)
	{
		return 0;
	}

	use(unit, targets)
	{
		if (!this.isUsable(unit, unit.stance)) {
			Abort("WeaponUsable.use(): " + unit.name + " tried to change weapons, which is not currently possible.");
		}
		term.print(unit.name + " is equipping " + this.name,
			"targ: " + (targets.length > 1 ? "[multi]" : targets[0].name));
		from(targets).each(function(x) {
			x.setWeapon(this.weaponID);
		}.bind(this));
		return null;
	}
}
