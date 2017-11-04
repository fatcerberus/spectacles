/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

const Game =
{
	title: "Spectacles: Bruce's Story",

	bossHPPerBar: 1000,
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

FS.evaluateScript('$/gameDef/animations.js');
FS.evaluateScript('$/gameDef/battles.js');
FS.evaluateScript('$/gameDef/characters.js');
FS.evaluateScript('$/gameDef/conditions.js');
FS.evaluateScript('$/gameDef/items.js');
FS.evaluateScript('$/gameDef/maps.js');
FS.evaluateScript('$/gameDef/math.js');
FS.evaluateScript('$/gameDef/moveEffects.js');
FS.evaluateScript('$/gameDef/skills.js');
FS.evaluateScript('$/gameDef/statuses.js');
FS.evaluateScript('$/gameDef/stats.js');
FS.evaluateScript('$/gameDef/weapons.js');
