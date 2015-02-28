/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

function RunTestBattle(difficulty, setup)
{
	Console.writeLine("Setting up battle engine test harness");
	var session = new Session();
	Link(Game.initialParty).each(function(id) {
		session.party.remove(id);
	});
	for (var id in setup.party) {
		var memberInfo = setup.party[id];
		session.party.add(id, memberInfo.level);
		if ('weapon' in memberInfo) {
			session.party.members[id].setWeapon(memberInfo.weapon);
		}
		for (var iItem = 0; iItem < memberInfo.items.length; ++iItem) {
			session.party.members[id].items.push(new ItemUsable(memberInfo.items[iItem]));
		}
	}
	new Scenario()
		.battle(setup.battleID, session)
		.run(true);
}
