/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

class TestHarness
{
	static initialize()
	{
		Console.log("initialize Specs Engine test harness");

		Console.defineObject('harness', this, {
			'run': function(testID) {
				if (!(testID in this.tests))
					return Console.log(`unknown test ID '${testID}'`);
				this.run(testID);
			}
		});
		this.tests = {};
		this.isBattleRunning = false;

		let fileNames = from(new DirectoryStream('$/testCases'))
			.where(it => it.fileName.endsWith('.js'))
			.select(it => it.fullPath)
			.besides(it => Console.log(`found ${it}`));
		for (let fileName of fileNames)
			EvaluateScript(fileName);
	}

	static addBattle(testID, setupData)
	{
		this.tests[testID] = {
			setup: setupData,
			run: function() {
				if (TestHarness.isBattleRunning) {
					Console.log("cannot start test battle, one is ongoing");
					return;
				}
				Console.log("initiate test battle", `battleID: ${this.setup.battleID}`);
				var session = new Session();
				for (let characterID of Game.initialParty)
					session.party.remove(characterID);
				for (let id in this.setup.party) {
					var memberInfo = this.setup.party[id];
					session.party.add(id, memberInfo.level);
					if ('weapon' in memberInfo) {
						session.party.members[id].setWeapon(memberInfo.weapon);
					}
					for (let iItem = 0; iItem < memberInfo.items.length; ++iItem) {
						session.party.members[id].items.push(new ItemUsable(memberInfo.items[iItem]));
					}
				}
				TestHarness.isBattleRunning = true;
				new Scene()
					.battle(this.setup.battleID, session)
					.run(true);
				TestHarness.isBattleRunning = false;
			}
		};
		Console.log(`add battle test '${testID}'`);
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
		Console.defineObject(testID, this.tests[testID], {
			'test': TestHarness.run.bind(TestHarness, testID)
		});
		Console.log(`add generic test '${testID}'`);
	}

	static run(testID)
	{
		Console.log("test harness invoked", `testID: ${testID}`);
		this.tests[testID].run(this.tests[testID].setup, testID);
	}
}
