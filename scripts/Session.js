/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('Party.js');

// GameDifficulty enumeration
// Specifies the difficulty level of the game.
GameDifficulty =
{
	beginner: 1,  // Beginner mode (easy)
	standard: 2,  // Standard mode (normal)
	proud:    3,  // Proud mode (hard)
	critical: 4   // Critical mode (unforgiving)
};

// Session() constructor
// Creates an object representing a game session.
// Arguments:
//     difficulty: Optional. A member of the GameDifficulty enumeration specifying the difficulty
//                 level for the new session. (default: standard)
function Session(difficulty)
{
	difficulty = difficulty !== void null ? difficulty : GameDifficulty.standard;
	
	Console.writeLine("Initializing new game session");
	Console.append("diff lv: " + difficulty);
	this.difficulty = difficulty;
	this.party = new Party(50);
	Link(Game.initialParty).each(function(characterID) {
		this.party.add(characterID);
	}.bind(this));
	this.battlesSeen = [];
}

// Session.fromFile() constructor
// Loads a session in progress from a save file.
// Arguments:
//     fileName: The name of the save file to load the session from.
Session.fromFile = function(fileName)
{
	//TODO: implement me!
};
