/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2024 Fat Cerberus
**/

import { Party } from './battleSystem/index.js';
import { Game } from './gameDef/index.js';

export default
class GameSession
{
	static fromFile(fileName)
	{
		// TODO: implement me!
	}

	constructor(difficulty = Difficulty.Standard)
	{
		console.log("initialize new game session", `diff lv: ${difficulty}`);

		this.difficulty = difficulty;
		this.party = new Party(1);
		for (const characterID of Game.initialParty)
			this.party.add(characterID);
		this.battlesSeen = [];
		this.items = [];
	}
}

export
const Difficulty =
{
	Beginner: 1,
	Standard: 2,
	Proud:    3,
	Critical: 4,
};
