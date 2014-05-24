/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// Game object
// Represents the game.
Game = {
	title: "Spectacles: Bruce's Story",
	
	bossHPPerBar: 500,
	partyHPPerBar: 250,
	
	bonusMultiplier: 1.5,
	defaultBattleBGM: null,
	defaultMoveRank: 2,
	defaultItemRank: 2,
	guardBreakRank: 1,
	stanceChangeRank: 5,
};

EvaluateScript('GameDef/battles.js');
EvaluateScript('GameDef/characters.js');
EvaluateScript('GameDef/conditions.js');
EvaluateScript('GameDef/enemies.js');
EvaluateScript('GameDef/items.js');
EvaluateScript('GameDef/math.js');
EvaluateScript('GameDef/moveEffects.js');
EvaluateScript('GameDef/skills.js');
EvaluateScript('GameDef/statuses.js');
EvaluateScript('GameDef/stats.js');
EvaluateScript('GameDef/weapons.js');
