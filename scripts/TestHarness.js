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
	mini.Console.writeLine("Initializing Specs Engine test harness");
	this.background = LoadImage('TitleScreen.png');
	this.fadeness = 0.0;
	this.tests = {};
	this.thread = mini.Threads.create(this, 100);
};

TestHarness.addBattleTest = function(testID, setupData)
{
	this.tests[testID] = {
		setup: setupData,
		run: function() {
			mini.Console.writeLine("Preparing test battle");
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
			new mini.Scene()
				.battle(this.setup.battleID, session)
				.run(true);
		}
	};
	mini.Console.writeLine("Added battle test '" + testID + "'");
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
	mini.Console.writeLine("Added generic test '" + testID + "'");
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
	if (IsKeyPressed(KEY_B) && IsKeyPressed(KEY_CTRL)) {
		this.run();
	}
}

TestHarness.run = function()
{
	var musicID = mini.Link(GetFileList("~/sounds/BGM")).random()[0].slice(0, -4);
	mini.Console.writeLine("Opening beta test menu");
	new mini.Scene()
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
	new mini.Scene()
		.tween(this, 0.25, 'linear', { fadeness: 0.0 })
		.run();
	if (test !== null) {
		test.run.call(test);
	}
	new mini.Scene()
		.adjustBGM(0.0)
		.resetBGM()
		.adjustBGM(1.0, 0.25)
		.run();
}

TestHarness.runTest = function(testID)
{
	mini.Console.writeLine("Test harness invoked directly");
	mini.Console.append("testID: " + testID);
	this.tests[testID].run(this.tests[testID].setup, testID);
};
