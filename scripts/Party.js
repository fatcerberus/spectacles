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

// .growthLevel property
// Retrieves the average growth level of all party members.
Party.prototype.growthLevel getter = function()
{
	if (this.members.length > 0) {
		var total = 0;
		var memberCount = 0;
		for (var i in this.members) {
			++memberCount;
			total += this.members[i].battleLevel;
			
		}
		return Math.floor(total / memberCount);
	} else {
		return 50;
	}
}

// .add() method
// Adds a character to the party.
// Arguments:
//     character: The character to be added.
Party.prototype.add = function(character)
{
	var newMember = new PartyMember(character, this.growthLevel);
	this.members[character.name] = newMember;
};

// .hasMember() method
// Determines whether a character is currently in the party.
// Arguments:
//     character: The character to check for.
// Returns:
//     true if the character is in the party, false otherwise.
Party.prototype.hasMember = function(character)
{
	for (var i in this.members) {
		if (this.members[i].character === character) {
			return true; 
		}
	}
	return false;
};

// .remove() method
// Removes a character from the party.
// Arguments:
//     character: The character to be removed.
Party.prototype.remove = function(character)
{
	for (var i in this.members) {
		if (this.members[i].character === character) {
			delete this.members[i];
		}
	}
};
