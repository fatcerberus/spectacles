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
	this.thread = Threads.createEntityThread(this, 100);
};

TestHarness.addBattleTest = function(testID, setupData)
{
	this.tests[testID] = {
		setup: setupData,
		run: function() {
			Console.writeLine("Preparing test battle");
			Console.append("battleID: " + this.setup.battleID);
			var session = new Session();
			Link(Game.initialParty).each(function(id) {
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
			new Scenario()
				.battle(this.setup.battleID, session)
				.run(true);
		}
	};
	Console.writeLine("Added battle test '" + testID + "'");
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
	Console.writeLine("Added generic test '" + testID + "'");
};

TestHarness.update = function()
{
	return true;
};

TestHarness.render = function()
{
	this.background.blitMask(0, 0, CreateColor(255, 255, 255, this.fadeness * 255));
}

TestHarness.getInput = function()
{
	if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_MENU))) {
		this.run();
	}
}

TestHarness.run = function()
{
	var musicID = Link(GetFileList("~/sounds/BGM")).random()[0].slice(0, -4);
	Console.writeLine("Opening beta test menu");
	new Scenario()
		.fork()
			.adjustBGM(0.0, 0.125)
			.playBGM(musicID)
			.adjustBGM(1.0, 0.125)
		.end()
		.tween(this, 0.25, 'linear', { fadeness: 1.0 })
		.run();
	var menu = new MenuStrip("Beta testers' menu", true);
	for (var testID in this.tests) {
		menu.addItem(testID, this.tests[testID]);
	}
	var test = menu.open();
	new Scenario()
		.tween(this, 0.25, 'linear', { fadeness: 0.0 })
		.run();
	if (test !== null) {
		test.run.call(test);
	}
	new Scenario()
		.adjustBGM(0.0)
		.resetBGM()
		.adjustBGM(1.0, 0.25)
		.run();
}

TestHarness.runTest = function(testID)
{
	Console.writeLine("Test harness invoked directly");
	Console.append("testID: " + testID);
	this.tests[testID].run(this.tests[testID].setup, testID);
};
