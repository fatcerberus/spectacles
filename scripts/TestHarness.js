/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

// TestHarness object
// Handles what-if testing, e.g. dry runs of battles, maps.
TestHarness = new (function()
{
	this.tests = null;
})();

TestHarness.initialize = function()
{
	mini.Console.write("Initializing Specs Engine test harness");
	mini.Console.register('harness', this, {
		'run': function(testID) {
			if (!(testID in this.tests))
				return mini.Console.write("Unknown test ID '" + testID + "'");
			this.runTest(testID);
		}
	});
	this.tests = {};
	this.isBattleRunning = false;
};

TestHarness.addBattle = function(testID, setupData)
{
	this.tests[testID] = {
		setup: setupData,
		run: function() {
			if (TestHarness.isBattleRunning) {
				mini.Console.write("Unable to run test battle, one is ongoing");
				return;
			}
			mini.Console.write("Preparing test battle");
			mini.Console.append("battleID: " + this.setup.battleID);
			var session = new Session();
			mini.Link(Game.initialParty).each(function(id) {
				session.party.remove(id);
			});
			for (var id in this.setup.party) {
				var memberInfo = this.setup.party[id];
				session.party.add(id, memberInfo.level);
				if ('weapon' in memberInfo) {
					session.party.members[id].setWeapon(memberInfo.weapon);
				}
				for (var iItem = 0; iItem < memberInfo.items.length; ++iItem) {
					session.party.members[id].items.push(new ItemUsable(memberInfo.items[iItem]));
				}
			}
			TestHarness.isBattleRunning = true;
			new mini.Scene()
				.battle(this.setup.battleID, session)
				.run(true);
			TestHarness.isBattleRunning = false;
		}
	};
	mini.Console.write("Added battle test '" + testID + "'");
};

TestHarness.addTest = function(testID, func)
{
	this.tests[testID] = {
		func: func,
		context: {},
		run: function() {
			this.func.call(this.context);
		}
	};
	mini.Console.register(testID, this.tests[testID], {
		'test': TestHarness.runTest.bind(TestHarness, testID)
	});
	mini.Console.write("Added generic test '" + testID + "'");
};

TestHarness.runTest = function(testID)
{
	mini.Console.write("Test harness invoked");
	mini.Console.append("testID: " + testID);
	this.tests[testID].run(this.tests[testID].setup, testID);
};
