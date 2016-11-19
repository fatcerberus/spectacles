/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('FieldMenu.js');
RequireScript('Party.js');

// GameDifficulty enumeration
// Specifies the difficulty level of the game.
GameDifficulty =
{
	beginner: 1,  // Easy
	standard: 2,  // Normal
	proud:    3,  // Hard
	critical: 4   // Unforgiving
};

// Session() constructor
// Creates an object representing a game session.
// Arguments:
//     difficulty: Optional. A member of the GameDifficulty enumeration specifying the difficulty
//                 level for the new session. (default: standard)
function Session(difficulty)
{
	difficulty = difficulty !== void null ? difficulty : GameDifficulty.standard;
	
	term.print("Initializing new game session", "diff lv: " + difficulty);
	this.difficulty = difficulty;
	this.party = new Party(50);
	from(Game.initialParty).each(function(characterID) {
		this.party.add(characterID);
	}.bind(this));
	this.battlesSeen = [];
	this.fieldMenu = new FieldMenu(this);
}

// Session.fromFile() constructor
// Loads a session in progress from a save file.
// Arguments:
//     fileName: The name of the save file to load the session from.
Session.fromFile = function(fileName)
{
	//TODO: implement me!
};
