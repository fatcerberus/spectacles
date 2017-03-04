/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

// Game object
// Defines basic gameplay parameters.
const Game =
{
	title: "Spectacles: Bruce's Story",

	bossHPPerBar: 500,
	partyHPPerBar: 250,

	bonusMultiplier: 1.5,
	defaultBattleBGM: 'CreepFight',
	defaultMoveRank: 2,
	defaultItemRank: 2,
	equipWeaponRank: 2,
	guardBreakRank: 1,
	reviveRank: 2,
	stanceChangeRank: 5,
};

EvaluateScript('gameDef/animations.js');
EvaluateScript('gameDef/battles.js');
EvaluateScript('gameDef/characters.js');
EvaluateScript('gameDef/conditions.js');
EvaluateScript('gameDef/items.js');
EvaluateScript('gameDef/maps.js');
EvaluateScript('gameDef/math.js');
EvaluateScript('gameDef/moveEffects.js');
EvaluateScript('gameDef/skills.js');
EvaluateScript('gameDef/statuses.js');
EvaluateScript('gameDef/stats.js');
EvaluateScript('gameDef/weapons.js');
