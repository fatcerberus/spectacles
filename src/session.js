/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('party.js');

const Difficulty =
{
	Beginner: 1,
	Standard: 2,
	Proud:    3,
	Critical: 4,
};

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
		from(Game.initialParty).each(function(characterID) {
			this.party.add(characterID);
		}.bind(this));
		this.battlesSeen = [];
	}
}
