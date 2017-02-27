/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

class TestHarness
{
	static initialize()
	{
		term.print("initializing Specs Engine test harness");
		
		term.define('harness', this, {
			'run': function(testID) {
				if (!(testID in this.tests))
					return term.print("Unknown test ID '" + testID + "'");
				this.run(testID);
			}
		});
		this.tests = {};
		this.isBattleRunning = false;
		
		var testScripts = GetFileList('~/scripts/testcases');
		for (var i = 0; i < testScripts.length; ++i) {
			term.print("loading testcases from '" + testScripts[i] + "'");
			EvaluateScript('~/scripts/testcases/' + testScripts[i]);
		}
	}

	static addBattle(testID, setupData)
	{
		this.tests[testID] = {
			setup: setupData,
			run: function() {
				if (TestHarness.isBattleRunning) {
					term.print("cannot run test battle, one is ongoing");
					return;
				}
				term.print("running test battle", "battleID: " + this.setup.battleID);
				var session = new Session();
				from(Game.initialParty).each(charID => {
					session.party.remove(charID);
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
		term.print("added battle test '" + testID + "'");
	}

	static addTest(testID, func)
	{
		this.tests[testID] = {
			func: func,
			context: {},
			run: function() {
				this.func.call(this.context);
			}
		};
		term.define(testID, this.tests[testID], {
			'test': TestHarness.run.bind(TestHarness, testID)
		});
		term.print("added generic test '" + testID + "'");
	}

	static run(testID)
	{
		term.print("test harness invoked", "testID: " + testID);
		this.tests[testID].run(this.tests[testID].setup, testID);
	}
}
