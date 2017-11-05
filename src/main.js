/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

const from     = require('from').default,
      Console  = require('console').default,
      Delegate = require('delegate').default,
      Image    = require('image').default,
      Joypad   = require('joypad').default,
      Music    = require('music').default,
      Prim     = require('prim').default,
      Random   = require('random').default,
      Scene    = require('scene').default,
      Thread   = require('thread').default;

const clone = require('$/main.mjs').clone,
      drawTextEx = require('$/main.mjs').drawTextEx,
      { DayNightEngine } = require('$/inGameClock'),
      MenuStrip = require('$/menuStrip').default,
      { Session, Difficulty } = require('$/sessions'),
      TestHarness = require('$/testHarness').default;

RequireScript('battleEngine/battle.js');
RequireScript('gameOverScreen.js');
RequireScript('scenelets.js');
RequireScript('titleScreen.js');

EvaluateScript('gameDef/game.js');

global.console = require('$/main.mjs').console;

async function game()
{
	// note: a game() function is needed for now because the engine was
	//       originally written for Sphere 1.x.  the goal is to eventually
	//       convert the Specs Engine entirely to Sphere v2.  that effort
	//       is ongoing,  but a full conversion will take a while.

	let mainModule = await import('$/main.mjs');
	await mainModule.default();
}
