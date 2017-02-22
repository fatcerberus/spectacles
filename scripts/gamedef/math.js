/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.math =
{
	// Attack accuracy functions
	accuracy: {
		bow: function(userInfo, targetInfo) {
			return userInfo.stats.foc / targetInfo.stats.agi * userInfo.level / userInfo.weapon.level;
		},
		breath: function(userInfo, targetInfo) {
			return 1.0;
		},
		devour: function(userInfo, targetInfo) {
			return (100 - targetInfo.health) / 100 / targetInfo.tier
				* userInfo.stats.agi / targetInfo.stats.agi;
		},
		gun: function(userInfo, targetInfo) {
			return 1.0;
		},
		magic: function(userInfo, targetInfo) {
			return 1.0;
		},
		physical: function(userInfo, targetInfo) {
			return 1.0;
		},
		shuriken: function(userInfo, targetInfo) {
			return userInfo.level / userInfo.weapon.level;
		},
		sword: function(userInfo, targetInfo) {
			return userInfo.stats.agi * 1.5 / targetInfo.stats.agi * userInfo.level / userInfo.weapon.level;
		}
	},
	
	// Damage output functions
	damage: {
		calculate: function(power, level, targetTier, attack, defense) {
			let multiplier = 1.0 + 4.0 * (level - 1) / 99;
			return 2.5 * power * multiplier * attack / defense;
		},
		bow: function(userInfo, targetInfo, power) {
			return Game.math.damage.calculate(power, userInfo.weapon.level, targetInfo.tier,
				userInfo.stats.str,
				Game.math.statValue(0, targetInfo.level));
		},
		breath: function(userInfo, targetInfo, power) {
			return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
				Math.round((userInfo.stats.vit * 2 + userInfo.stats.mag) / 3),
				targetInfo.stats.vit);
		},
		magic: function(userInfo, targetInfo, power) {
			return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
				Math.round((userInfo.stats.mag * 2 + userInfo.stats.foc) / 3),
				targetInfo.stats.foc);
		},
		gun: function(userInfo, targetInfo, power) {
			return Game.math.damage.calculate(power, userInfo.weapon.level, targetInfo.tier,
				Game.math.statValue(100, userInfo.level),
				targetInfo.stats.def);
		},
		physical: function(userInfo, targetInfo, power) {
			return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str,
				Math.round((targetInfo.stats.def * 2 + targetInfo.stats.str) / 3));
		},
		physicalRecoil: function(userInfo, targetInfo, power) {
			return Game.math.damage.calculate(power / 2, userInfo.level, targetInfo.tier,
				targetInfo.stats.str, userInfo.stats.str);
		},
		shuriken: function(userInfo, targetInfo, power) {
			return Game.math.damage.calculate(power, userInfo.weapon.level, targetInfo.tier,
				userInfo.stats.foc, targetInfo.stats.def);
		},
		sword: function(userInfo, targetInfo, power) {
			return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str, targetInfo.stats.def);
		}
	},
	
	// Battle experience functions
	experience: {
		skill: function(skillInfo, userInfo, targetsInfo) {
			var levelSum = 0;
			var statSum = 0;
			for (var i = 0; i < targetsInfo.length; ++i) {
				levelSum += targetsInfo[i].level;
				statSum += targetsInfo[i].baseStatAverage;
			}
			var levelAverage = Math.round(levelSum / targetsInfo.length);
			var statAverage = Math.round(statSum / targetsInfo.length);
			return levelAverage * statAverage;
		},
		stat: function(statID, enemyUnitInfo) {
			return enemyUnitInfo.level * enemyUnitInfo.baseStats[statID];
		}
	},
	
	// Guard Stance-related functions
	guardStance: {
		damageTaken: function(baseDamage, tags) {
			if (from(tags).anyIs('deathblow')) {
				return baseDamage - 1;
			} else if (from(tags).anyIn([ 'bow', 'omni', 'special', 'zombie' ])) {
				return baseDamage;
			} else {
				return baseDamage / 2;
			}
		}
	},
	
	// Healing output functions
	healing: function(userInfo, targetInfo, power) {
		return Game.math.damage.calculate(power, userInfo.level, targetInfo.tier,
			Math.round((userInfo.stats.mag * 2 + userInfo.stats.foc) / 3),
			Game.math.statValue(0, targetInfo.level));
	},
	
	// .hp() function
	// Calculates the current HP cap (maximum HP) for a battler.
	// Arguments:
	//     unitInfo: A battler info structure describing the unit whose HP cap is being calculated.
	//     level:    The battler's current overall growth level.
	//     tier:     The battler's tier.
	hp: function(unitInfo, level, tier) {
		var statAverage = Math.round((unitInfo.baseStats.vit * 10
			+ unitInfo.baseStats.str
			+ unitInfo.baseStats.def
			+ unitInfo.baseStats.foc
			+ unitInfo.baseStats.mag
			+ unitInfo.baseStats.agi) / 15);
		return 25 * tier * Game.math.statValue(statAverage, level);
	},
	
	// .mp() function
	// Calculates the current MP cap (maximum MP) for a battler.
	// Arguments:
	//     unitInfo: A battler info structure describing the unit whose MP cap is being calculated.
	mp: {
		capacity: function(unitInfo) {
			var statAverage = Math.round((unitInfo.baseStats.mag * 10
				+ unitInfo.baseStats.vit
				+ unitInfo.baseStats.str
				+ unitInfo.baseStats.def
				+ unitInfo.baseStats.foc
				+ unitInfo.baseStats.agi) / 15);
			return 10 * unitInfo.tier * Game.math.statValue(statAverage, unitInfo.level);
		},
		usage: function(skill, level, userInfo) {
			var baseCost = 'baseMPCost' in skill ? skill.baseMPCost : 0;
			return baseCost * (level + userInfo.baseStats.mag) / 100;
		}
	},
	
	// .retreatChance() function
	// Calculates the chance of successfully fleeing from battle.
	// Arguments:
	//     enemyUnitsInfo: An array of battler info structures describing the currently active
	//                     enemy battlers.
	retreatChance: function(enemyUnitsInfo) {
		return 1.0;
	},
	
	// .skillRank() function
	// Calculates the overall rank of a skill. Used for display purposes.
	// Arguments:
	//     skill: The skill definition of the skill whose rank is being calculated.
	skillRank: function(skill) {
		var rankTotal = 0;
		for (var i = 0; i < skill.actions.length; ++i) {
			rankTotal += skill.actions[i].rank;
		}
		return rankTotal;
	},
	
	// .statValue() function
	// Calculates an immediate stat value from a base stat and growth level.
	// Arguments:
	//     baseStat: The base stat value.
	//     level:    The growth level of the stat being calculated.
	statValue: function(baseStat, level) {
		return Math.round((50 + 0.5 * baseStat) * (10 + level) / 110);
	},
	
	// .timeUntilNextTurn() function
	// Calculates an initial counter value (ICV) for a specified unit and move rank.
	// Arguments:
	//     unitInfo: The acting unit's battler info structure.
	//     rank:     The rank of the action performed.
	timeUntilNextTurn: function(unitInfo, rank) {
		return rank * 10000 / unitInfo.stats.agi;
	}
};
