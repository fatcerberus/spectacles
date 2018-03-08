/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from } from 'sphere-runtime';

export
const Maths =
{
	accuracy: {
		bow: function(userInfo, targetInfo) {
			return userInfo.stats.foc / targetInfo.stats.agi;
		},
		breath: function(userInfo, targetInfo) {
			return 1.0;
		},
		devour: function(userInfo, targetInfo) {
			return (100 - targetInfo.health * targetInfo.tier) / 100
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
			return 1.0;
		},
		sword: function(userInfo, targetInfo) {
			return userInfo.stats.agi * 1.5 / targetInfo.stats.agi;
		}
	},

	damage: {
		calculate: function(power, level, targetTier, attack, defense) {
			return power * level**0.5 * attack / defense;
		},
		bow: function(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str,
				Maths.statValue(0, targetInfo.level));
		},
		breath: function(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				Math.round((userInfo.stats.vit * 2 + userInfo.stats.mag) / 3),
				targetInfo.stats.vit);
		},
		magic: function(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				Math.round((userInfo.stats.mag * 2 + userInfo.stats.foc) / 3),
				targetInfo.stats.foc);
		},
		gun: function(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				Maths.statValue(100, userInfo.level),
				targetInfo.stats.def);
		},
		physical: function(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str,
				Math.round((targetInfo.stats.def * 2 + targetInfo.stats.str) / 3));
		},
		physicalRecoil: function(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power / 2, userInfo.level, targetInfo.tier,
				targetInfo.stats.str, userInfo.stats.str);
		},
		shuriken: function(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.foc, targetInfo.stats.def);
		},
		sword: function(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str, targetInfo.stats.def);
		}
	},

	experience: {
		skill: function(skillInfo, userInfo, targetsInfo) {
			let levelSum = 0;
			let statSum = 0;
			for (let i = 0; i < targetsInfo.length; ++i) {
				levelSum += targetsInfo[i].level;
				statSum += targetsInfo[i].baseStatAverage;
			}
			let levelAverage = Math.round(levelSum / targetsInfo.length);
			let statAverage = Math.round(statSum / targetsInfo.length);
			return levelAverage * statAverage;
		},
		stat: function(statID, enemyUnitInfo) {
			return enemyUnitInfo.level * enemyUnitInfo.baseStats[statID];
		}
	},

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

	healing: function(userInfo, targetInfo, power) {
		return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
			Math.round((userInfo.stats.mag * 2 + userInfo.stats.foc) / 3),
			Maths.statValue(0, targetInfo.level));
	},

	hp: function(unitInfo, level, tier) {
		let statAverage = Math.round((unitInfo.baseStats.vit * 10
			+ unitInfo.baseStats.str
			+ unitInfo.baseStats.def
			+ unitInfo.baseStats.foc
			+ unitInfo.baseStats.mag
			+ unitInfo.baseStats.agi) / 15);
		statAverage = Maths.statValue(statAverage, level);
		return 25 * tier**2 * statAverage;
	},

	mp: {
		capacity: function(unitInfo) {
			let statAverage = Math.round((unitInfo.baseStats.mag * 10
				+ unitInfo.baseStats.vit
				+ unitInfo.baseStats.str
				+ unitInfo.baseStats.def
				+ unitInfo.baseStats.foc
				+ unitInfo.baseStats.agi) / 15);
			statAverage = Maths.statValue(statAverage, unitInfo.level);
			return 10 * unitInfo.tier * statAverage;
		},
		usage: function(skill, level, userInfo) {
			let baseCost = 'baseMPCost' in skill ? skill.baseMPCost : 0;
			return baseCost * level**0.5 * userInfo.baseStats.mag / 100;
		}
	},

	retreatChance: function(enemyUnitsInfo) {
		return 1.0;
	},

	skillRank: function(skill) {
		let rankTotal = 0;
		for (let i = 0; i < skill.actions.length; ++i) {
			rankTotal += skill.actions[i].rank;
		}
		return rankTotal;
	},

	statValue: function(baseStat, level) {
		return Math.round((50 + 0.5 * baseStat) * (10 + level) / 110);
	},

	timeUntilNextTurn: function(unitInfo, rank) {
		return rank * 10000 / unitInfo.stats.agi;
	}
};
