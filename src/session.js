/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('FieldMenu.js');
RequireScript('Party.js');

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
		term.print("initializing new game session", "diff lv: " + difficulty);

		this.difficulty = difficulty;
		this.party = new Party(50);
		from(Game.initialParty).each(function(characterID) {
			this.party.add(characterID);
		}.bind(this));
		this.battlesSeen = [];
		this.fieldMenu = new FieldMenu(this);
	}
}
