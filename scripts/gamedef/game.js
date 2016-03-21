/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// Game object
// Defines basic gameplay parameters.
Game =
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

EvaluateScript('gamedef/animations.js');
EvaluateScript('gamedef/battles.js');
EvaluateScript('gamedef/characters.js');
EvaluateScript('gamedef/conditions.js');
EvaluateScript('gamedef/items.js');
EvaluateScript('gamedef/maps.js');
EvaluateScript('gamedef/math.js');
EvaluateScript('gamedef/moveEffects.js');
EvaluateScript('gamedef/scenes.js');
EvaluateScript('gamedef/skills.js');
EvaluateScript('gamedef/statuses.ts');
EvaluateScript('gamedef/stats.js');
EvaluateScript('gamedef/weapons.js');
