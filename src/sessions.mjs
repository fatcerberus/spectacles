/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { from } from 'sphere-runtime';

import { console } from '$/main.mjs';
import { Party, PartyMember } from './party-manager.mjs';

import { Game } from '$/game-data/index.mjs';

export
const Difficulty =
{
	Beginner: 1,
	Standard: 2,
	Proud:    3,
	Critical: 4,
};

export
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
