/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('Party.js');

// GameDifficulty enumeration
// Specifies the difficulty level of the game.
GameDifficulty =
{
	beginner: 0,  // Beginner mode (easy)
	standard: 1,  // Standard mode (normal)
	proud:    2,  // Proud mode (hard)
	critical: 3   // Critical mode (unforgiving)
};

// Session() constructor
// Creates an object representing a game session.
// Arguments:
//     difficulty: Optional. A member of the GameDifficulty enumeration specifying the difficulty
//                 level for the new session. (default: standard)
function Session(difficulty)
{
	difficulty = difficulty !== void null ? difficulty : GameDifficulty.standard;
	
	this.difficulty = difficulty;
	this.party = new Party();
	Link(Game.initialParty).each(function(characterID) {
		this.party.add(characterID);
	}.bind(this));
}

// Session.fromFile() constructor
// Loads a session in progress from a save file.
// Arguments:
//     fileName: The name of the save file to load the session from.
Session.fromFile = function(fileName)
{
	//TODO: implement me!
};
