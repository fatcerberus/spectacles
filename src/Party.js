/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('PartyMember.js');

// Party() constructor
// Creates an object representing a party of player characters.
// Arguments:
//     level: Optional. The initial battle level of the party. The first character
//            added to the party will have his/her stats initialized using this level.
//            (default: 1)
function Party(level)
{
	level = level !== void null ? level : 1;
	
	this.defaultLevel = level;
	this.members = {};
	term.print("Created party manager");
}

// .add() method
// Adds a character to the party.
// Arguments:
//     characterID: The ID of the character to be added, as defined in the gamedef.
//     level:       Optional. The level the character will be added at. If not specified,
//                  the current party average will be used.
Party.prototype.add = function(characterID, level)
{
	level = level !== void null ? level : this.getLevel();
	
	var newMember = new PartyMember(characterID, level);
	this.members[characterID] = newMember;
	term.print("Added PC " + newMember.name + " to party");
};

// .getLevel() method
// Gets the average level of all party members.
Party.prototype.getLevel = function()
{
	if (this.members.length > 0) {
		var total = 0;
		var memberCount = 0;
		for (var i in this.members) {
			++memberCount;
			total += this.members[i].getLevel();
			
		}
		return Math.floor(total / memberCount);
	} else {
		return this.defaultLevel;
	}
}

// .hasMember() method
// Determines whether a character is currently in the party.
// Arguments:
//     characterID: The ID of the character to check for.
// Returns:
//     true if the character is in the party, false otherwise.
Party.prototype.hasMember = function(characterID)
{
	return characterID in this.members;
};

// .remove() method
// Removes a character from the party.
// Arguments:
//     character: The ID of the character to be removed.
Party.prototype.remove = function(characterID)
{
	for (var id in this.members) {
		if (id === characterID) {
			term.print("Removing PC " + this.members[id].name + " from party");
			delete this.members[id];
		}
	}
};
