/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { console } from '$/main';
import { Party } from '$/battleSystem';
import { Game } from '$/gameDef';

export
const Difficulty =
{
	Beginner: 1,
	Standard: 2,
	Proud:    3,
	Critical: 4,
};

export default
class Session
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
	}
}
