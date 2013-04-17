/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Party.js");
RequireScript("Game.js");

// Session() constructor
// Creates an object representing a game session.
function Session()
{
	this.party = new Party();
	for (var i = 0; i < Game.initialPartyMembers.length; ++i) {
		var name = Game.initialPartyMembers[i];
		this.party.add(Game.characters[name]);
	}
}
