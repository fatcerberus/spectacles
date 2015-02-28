/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

// TestHarness object
// Handles what-if testing, e.g. dry runs of battles.
TestHarness = new (function()
{
	this.tests = null;
})();

TestHarness.initialize = function()
{
	Console.writeLine("Initializing Specs Engine test harness");
	this.fadeness = 0.0;
	this.tests = {};
	this.thread = Threads.createEntityThread(this);
};

TestHarness.addBattleTest = function(testID, setupData)
{
	this.tests[testID] = {
		setup: setupData,
		run: function(setup) {
			Console.writeLine("Preparing test battle");
			Console.append("battleID: " + setup.battleID);
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
	};
	Console.writeLine("Registered battle test '" + testID + "'");
};

TestHarness.update = function()
{
	return true;
};

TestHarness.render = function()
{
	ApplyColorMask(CreateColor(0, 0, 0, this.fadeness * 255));
}

TestHarness.run = function()
{
	Console.writeLine("Opening test harness menu");
	new Scenario()
		.tween(this, 0.5, 'linear', { fadeness: 1.0 })
		.run();
	var menu = new MenuStrip("Beta Tests", true);
	for (var testID in this.tests) {
		menu.addItem(testID, this.tests[testID]);
	}
	do {
		var test = menu.open();
		if (test !== null) {
			test.run(test.setup);
		}
	} while (test !== null);
	new Scenario()
		.tween(this, 0.5, 'linear', { fadeness: 0.0 })
		.run();
}

TestHarness.runTest = function(testID)
{
	Console.writeLine("Test harness invoked directly");
	Console.append("testID: " + testID);
	this.tests[testID].run(this.tests[testID].setup, testID);
};
