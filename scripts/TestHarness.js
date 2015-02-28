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
	Console.writeLine("Initializing Specs Engine test harness");
	this.background = LoadImage('TitleScreen.png');
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
	this.background.blitMask(0, 0, CreateColor(255, 255, 255, this.fadeness * 255));
}

TestHarness.run = function()
{
	var musicID = Link(GetFileList("~/sounds/BGM")).random()[0].slice(0, -4);
	Console.writeLine("Opening beta test menu");
	new Scenario()
		.fork()
			.adjustBGM(0.0, 0.5)
			.playBGM(musicID)
			.adjustBGM(1.0, 0.5)
		.end()
		.tween(this, 1.0, 'linear', { fadeness: 1.0 })
		.run();
	var menu = new MenuStrip("Beta Test Harness", true);
	for (var testID in this.tests) {
		menu.addItem(testID, this.tests[testID]);
	}
	do {
		var test = menu.open();
		if (test !== null) {
			test.run(test.setup);
			new Scenario()
				.fork()
					.adjustBGM(0.0)
					.playBGM(musicID)
					.adjustBGM(1.0, 0.5)
				.endFork()
				.run();
		}
	} while (test !== null);
	new Scenario()
		.fork()
			.adjustBGM(0.0, 1.0)
			.resetBGM()
		.end()
		.tween(this, 1.0, 'linear', { fadeness: 0.0 })
		.run();
}

TestHarness.runTest = function(testID)
{
	Console.writeLine("Test harness invoked directly");
	Console.append("testID: " + testID);
	this.tests[testID].run(this.tests[testID].setup, testID);
};
