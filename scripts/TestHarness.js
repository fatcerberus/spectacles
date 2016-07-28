/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

// TestHarness object
// Handles what-if testing, e.g. dry runs of battles, maps, etc.
TestHarness = new (function()
{
	this.tests = null;
})();

TestHarness.initialize = function()
{
	terminal.log("Initializing Specs Engine test harness");
	terminal.register('harness', this, {
		'run': function(testID) {
			if (!(testID in this.tests))
				return terminal.log("Unknown test ID '" + testID + "'");
			this.run(testID);
		}
	});
	this.tests = {};
	this.isBattleRunning = false;
	
	var testScripts = GetFileList('~/scripts/testcases');
	for (var i = 0; i < testScripts.length; ++i) {
		terminal.log("Loading testcases from '" + testScripts[i] + "'");
		EvaluateScript('~/scripts/testcases/' + testScripts[i]);
	}
};

TestHarness.addBattle = function(testID, setupData)
{
	this.tests[testID] = {
		setup: setupData,
		run: function() {
			if (TestHarness.isBattleRunning) {
				terminal.log("Unable to run test battle, one is ongoing");
				return;
			}
			terminal.log("Preparing test battle", "battleID: " + this.setup.battleID);
			var session = new Session();
			link(Game.initialParty).each(function(id) {
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
			new scenes.Scene()
				.battle(this.setup.battleID, session)
				.run(true);
			TestHarness.isBattleRunning = false;
		}
	};
	terminal.log("Added battle test '" + testID + "'");
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
	terminal.register(testID, this.tests[testID], {
		'test': TestHarness.run.bind(TestHarness, testID)
	});
	terminal.log("Added generic test '" + testID + "'");
};

TestHarness.run = function(testID)
{
	terminal.log("Test harness invoked", "testID: " + testID);
	this.tests[testID].run(this.tests[testID].setup, testID);
};
