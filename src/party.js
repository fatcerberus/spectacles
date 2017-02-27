/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('partyMember.js');

class Party
{
	constructor(level = 1)
	{
		term.print("initialize party manager");

		this.defaultLevel = level;
		this.members = {};
	}

	add(characterID, level = this.getLevel())
	{
		var newMember = new PartyMember(characterID, level);
		this.members[characterID] = newMember;
		term.print("add PC " + newMember.name + " to party");
	}

	getLevel()
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

	hasMember(characterID)
	{
		return characterID in this.members;
	}

	remove(characterID)
	{
		for (var id in this.members) {
			if (id === characterID) {
				term.print("remove PC " + this.members[id].name + " from party");
				delete this.members[id];
			}
		}
	}
}
