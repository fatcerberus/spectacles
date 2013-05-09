/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("PartyMember.js");

// Party() constructor
// Creates an object representing a travelling party.
function Party()
{
	this.members = {};
}

// .level property
// Retrieves the average level of all party members.
Party.prototype.level getter = function()
{
	if (this.members.length > 0) {
		var total = 0;
		var memberCount = 0;
		for (var i in this.members) {
			++memberCount;
			total += this.members[i].level;
			
		}
		return Math.floor(total / memberCount);
	} else {
		return 10;
	}
}

// .add() method
// Adds a character to the party.
// Arguments:
//     character: The ID of the character to be added.
Party.prototype.add = function(characterID)
{
	var newMember = new PartyMember(characterID, this.level);
	this.members[characterID] = newMember;
};

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
			delete this.members[i];
		}
	}
};
