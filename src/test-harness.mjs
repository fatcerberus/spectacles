/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { from, Scene } from 'sphere-runtime';

import { console } from '$/main.mjs';
import ItemUsable from '$/battleEngine/itemUsable.mjs';
import { Session } from '$/sessions.mjs';
import { Game } from '$/gameDef';

export default
class TestHarness
{
	static async initialize()
	{
		console.log("initialize Specs Engine test harness");

		console.defineObject('harness', this, {
			run(testID) {
				if (!(testID in this.tests))
					return console.log(`unknown test ID '${testID}'`);
				this.run(testID);
			}
		});
		this.tests = {};
		this.isBattleRunning = false;

		let fileNames = from(new DirectoryStream('$/testCases'))
			.where(it => it.fileName.endsWith('.mjs'))
			.select(it => it.fullPath)
			.besides(it => console.log(`found '${it}'`));
		for (const fileName of fileNames)
			await import(fileName);
	}

	static addBattle(testID, setupData)
	{
		this.tests[testID] = {
			setup: setupData,
			async run() {
				if (TestHarness.isBattleRunning) {
					console.log("cannot start test battle, one is ongoing");
					return;
				}
				console.log("initiate test battle", `battleID: ${this.setup.battleID}`);
				let session = new Session();
				for (let characterID of Game.initialParty)
					session.party.remove(characterID);
				for (let id in this.setup.party) {
					let memberInfo = this.setup.party[id];
					session.party.add(id, memberInfo.level);
					if ('weapon' in memberInfo)
						session.party.members[id].setWeapon(memberInfo.weapon);
					for (let iItem = 0; iItem < memberInfo.items.length; ++iItem)
						session.party.members[id].items.push(new ItemUsable(memberInfo.items[iItem]));
				}
				TestHarness.isBattleRunning = true;
				await new Scene()
					.battle(this.setup.battleID, session)
					.run();
				TestHarness.isBattleRunning = false;
			}
		};
		console.log(`add battle test '${testID}'`);
	}

	static addTest(testID, func)
	{
		this.tests[testID] = {
			func: func,
			context: {},
			run() {
				this.func.call(this.context);
			}
		};
		console.defineObject(testID, this.tests[testID], {
			'test': TestHarness.run.bind(TestHarness, testID)
		});
		console.log(`add generic test '${testID}'`);
	}

	static async run(testID)
	{
		console.log("test harness invoked", `testID: ${testID}`);
		await this.tests[testID].run(this.tests[testID].setup, testID);
	}
}
