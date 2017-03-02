/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleEngine/battleScreen.js');
RequireScript('battleEngine/battleUnit.js');
RequireScript('battleEngine/fieldCondition.js');
RequireScript('battleEngine/mpPool.js');

const BattleResult =
{
	Win:  1,
	Flee: 2,
	Lose: 3,
};

class Battle
{
	constructor(session, battleID)
	{
		if (!(battleID in Game.battles))
			throw new ReferenceError(`no encounter data for '${battleID}'`);

		this.itemUsed = new events.Delegate();
		this.skillUsed = new events.Delegate();
		this.stanceChanged = new events.Delegate();
		this.unitDamaged = new events.Delegate();
		this.unitHealed = new events.Delegate();
		this.unitKilled = new events.Delegate();
		this.unitReady = new events.Delegate();
		this.unitTargeted = new events.Delegate();

		term.print(`initialize battle context for '${battleID}'`);
		this.battleID = battleID;
		this.mode = null;
		this.parameters = Game.battles[battleID];
		this.partyMPPool = null;
		this.session = session;
		this.suspendCount = 0;
		this.timer = 0;
		this.battleLevel = 'battleLevel' in this.parameters ? this.parameters.battleLevel : session.party.level;
	}

	update() {
		switch (this.mode) {
			case 'setup':
				var heading = ('isFinalBattle' in this.parameters && this.parameters.isFinalBattle) ? "Final Battle: " : "Boss Battle: ";
				this.ui.go('title' in this.parameters ? heading + this.parameters.title : null);
				var walkInThreads = [];
				from(this.enemyUnits, this.playerUnits)
					.each(function(unit)
				{
					var thread = unit.actor.enter();
					walkInThreads.push(thread);
				});
				this.ui.hud.turnPreview.show();
				if (!from(this.session.battlesSeen).anyIs(this.battleID)) {
					this.session.battlesSeen.push(this.battleID);
					 if ('onFirstStart' in this.parameters) {
						term.print(`call onFirstStart() for battleID '${this.battleID}'`);
						this.parameters.onFirstStart.call(this);
					 }
				}
				if ('onStart' in this.parameters) {
					term.print(`call onStart() for battleID '${this.battleID}'`);
					this.parameters.onStart.call(this);
				}
				this.ui.showTitle();
				this.mode = 'battle';
				break;
			case 'battle':
				this.tick();
				break;
		}
		if (this.result !== null) {
			term.print("shut down battle engine");
			from(this.battleUnits)
				.each(unit => unit.dispose());
			this.ui.dispose();
			music.pop();
			music.adjust(1.0, 0);
			term.undefine('battle');
			return false;
		}
		else {
			return true;
		}
	}

	addCondition(conditionID)
	{
		if (this.hasCondition(conditionID))
			return;  // nop if already installed
		let eventData = { conditionID: conditionID, cancel: false };
		this.raiseEvent('conditionInstalled', eventData);
		if (!eventData.cancel) {
			let effect = new FieldCondition(eventData.conditionID, this);
			this.conditions.push(effect);
			term.print(`install field condition ${effect.name}`);
		} else {
			term.print(`cancel FC '${conditionID}' per existing FC`);
		}
	}

	alliesOf(unit)
	{
		if (unit.isPartyMember())
			return this.playerUnits;
		else
			return this.enemyUnits;
	}

	areEnemies(unit1, unit2)
	{
		return from(this.enemiesOf(unit1)).anyIs(unit2);
	}

	enemiesOf(unit)
	{
		if (unit.isPartyMember()) {
			return this.enemyUnits;
		} else {
			return this.playerUnits;
		}
	}

	findUnit(unitID)
	{
		let unit = from(this.enemyUnits, this.playerUnits)
			.first(v => v.id == unitID);
		return unit !== undefined ? unit : null;
	}

	getLevel()
	{
		return this.battleLevel;
	}

	go()
	{
		if (Sphere.Game.disableBattles) {
			term.print("battles disabled, automatic win", `battleID: ${this.battleID}`);
			this.result = BattleResult.Win;
			return null;
		}
		term.print("");
		term.print("start battle engine", `battleID: ${this.battleID}`);
		var partyMaxMP = 0;
		for (id in this.session.party.members) {
			var battlerInfo = this.session.party.members[id].getInfo();
			var mpDonated = Math.round(Game.math.mp.capacity(battlerInfo));
			partyMaxMP += mpDonated;
			term.print(Game.characters[battlerInfo.characterID].name + " donated " + mpDonated + " MP to shared pool");
		}
		partyMaxMP = Math.min(Math.max(partyMaxMP, 0), 9999);
		var partyMPPool = new MPPool('partyMP', Math.min(Math.max(partyMaxMP, 0), 9999));
		partyMPPool.gainedMP.add(function(mpPool, availableMP) {
			this.ui.hud.mpGauge.set(availableMP);
		}, this);
		partyMPPool.lostMP.add(function(mpPool, availableMP) {
			this.ui.hud.mpGauge.set(availableMP);
		}, this);
		this.ui = new BattleScreen(partyMaxMP);
		this.battleUnits = [];
		this.playerUnits = [];
		this.enemyUnits = [];
		this.conditions = [];
		for (let i = 0; i < this.parameters.enemies.length; ++i) {
			var enemyID = this.parameters.enemies[i];
			var unit = new BattleUnit(this, enemyID, i == 0 ? 1 : i == 1 ? 0 : i, Row.Middle);
			this.battleUnits.push(unit);
			this.enemyUnits.push(unit);
		}
		var i = 0;
		for (let name in this.session.party.members) {
			var unit = new BattleUnit(this, this.session.party.members[name], i == 0 ? 1 : i == 1 ? 0 : i, Row.Middle, partyMPPool);
			this.battleUnits.push(unit);
			this.playerUnits.push(unit);
			++i;
		}
		var battleBGMTrack = Game.defaultBattleBGM;
		if ('bgm' in this.parameters) {
			battleBGMTrack = this.parameters.bgm;
		}
		this.ui.hud.turnPreview.set(this.predictTurns());
		music.push(battleBGMTrack !== null
			? `music/${battleBGMTrack}.ogg`
			: null);
		this.result = null;
		this.timer = 0;
		this.mode = 'setup';
		term.define('battle', this, {
			'spawn': this.spawnEnemy
		});
		var battleThread = threads.create(this);
		return battleThread;
	}

	hasCondition(conditionID)
	{
		return from(this.conditions)
			.mapTo(it => it.conditionID)
			.anyIs(conditionID);
	}

	isActive()
	{
		return this.result === null;
	}

	liftCondition(conditionID)
	{
		from(this.conditions)
			.where(i => i.conditionID === conditionID)
			.besides(i => term.print(`lift field condition ${this.conditions[i].name}`))
			.remove();
	}

	predictTurns(actingUnit = null, nextActions = null)
	{
		var forecast = [];
		for (let turnIndex = 0; turnIndex < 8; ++turnIndex) {
			var bias = 0;
			from(this.enemyUnits, this.playerUnits)
				.where(i => i !== actingUnit || turnIndex > 0)
				.each(unit =>
			{
				++bias;
				var timeUntilUp = unit.timeUntilTurn(turnIndex, Game.defaultMoveRank,
					actingUnit === unit ? nextActions : null);
				forecast.push({
					bias: bias,
					remainingTime: timeUntilUp,
					turnIndex: turnIndex,
					unit: unit
				});
			});
		}
		forecast.sort(function(a, b) {
			var sortOrder = a.remainingTime - b.remainingTime;
			var biasOrder = a.bias - b.bias;
			return sortOrder !== 0 ? sortOrder : biasOrder;
		});
		forecast = forecast.slice(0, 10);
		return forecast;
	}

	raiseEvent(eventID, data = null)
	{
		var conditions = [ ...this.conditions ];
		from(conditions).each(function(condition) {
			condition.invoke(eventID, data);
		});
	}

	resume()
	{
		--this.suspendCount;
		if (this.suspendCount < 0) {
			this.suspendCount = 0;
		}
	}

	runAction(action, actingUnit, targetUnits, useAiming)
	{
		useAiming = useAiming !== void null ? useAiming : true;
		
		var eventData = { action: action, targets: targetUnits };
		this.raiseEvent('actionTaken', eventData);
		targetUnits = eventData.targets;
		if ('announceAs' in action && action.announceAs != null) {
			actingUnit.announce(action.announceAs);
		}
		from(action.effects)
			.where(it => it.targetHint === 'user')
			.each(effect =>
		{
			term.print(`apply effect '${effect.type}'`, `retarg: ${effect.targetHint}`);
			var effectHandler = Game.moveEffects[effect.type];
			effectHandler(actingUnit, [ actingUnit ], effect);
		});
		from(targetUnits).each(unit => {
			unit.takeHit(actingUnit, action);
		});
		if (action.effects === null) {
			return [];
		}
		var targetsHit = [];
		var accuracyRate = 'accuracyRate' in action ? action.accuracyRate : 1.0;
		for (let i = 0; i < targetUnits.length; ++i) {
			var baseOdds = 'accuracyType' in action ? Game.math.accuracy[action.accuracyType](actingUnit.battlerInfo, targetUnits[i].battlerInfo) : 1.0;
			var aimRate = 1.0;
			if (useAiming) {
				var eventData = {
					action: clone(action),
					aimRate: 1.0,
					targetInfo: clone(targetUnits[i].battlerInfo)
				};
				actingUnit.raiseEvent('aiming', eventData);
				aimRate = eventData.aimRate;
			}
			var odds = Math.min(Math.max(baseOdds * accuracyRate * aimRate, 0.0), 1.0);
			var isHit = random.chance(odds);
			term.print(`odds of hitting ${targetUnits[i].name} at ~${Math.round(odds * 100)}%`,
				isHit ? "hit" : "miss");
			if (isHit) {
				this.unitTargeted.invoke(targetUnits[i], action, actingUnit);
				targetsHit.push(targetUnits[i]);
			} else {
				targetUnits[i].evade(actingUnit, action);
			}
		}
		if (targetsHit.length == 0) {
			return [];
		}
		
		// apply move effects to target(s)
		from(targetsHit).each(function(unit) {
			unit.beginTargeting(actingUnit);
		});
		var animContext = {
			effects: from(action.effects)
				.where(it => from([ 'selected', 'random' ]).anyIs(it.targetHint))
				.where(it => it.type != null)
				.select(),
			pc: 0,
			nextEffect: function() {
				if (this.pc < this.effects.length) {
					var effect = this.effects[this.pc++];
					var targets = effect.targetHint == 'random'
						? [ random.sample(targetsHit) ]
						: targetsHit;
					term.print(`apply effect '${effect.type}'`, `retarg: ${effect.targetHint}`);
					Game.moveEffects[effect.type](actingUnit, targets, effect);
				}
				return this.pc < this.effects.length;
			}
		};
		if (action.animation in Game.animations) {
			Game.animations[action.animation]
				.call(animContext, actingUnit, targetsHit, false);
		}
		while (animContext.nextEffect());
		from(targetsHit).each(function(unit) {
			unit.endTargeting();
		});
		return targetsHit;
	}

	spawnEnemy(enemyClass)
	{
		term.print(`spawn new enemy '${enemyClass}'`);
		var newUnit = new BattleUnit(this, enemyClass);
		this.battleUnits.push(newUnit);
		this.enemyUnits.push(newUnit);
	}

	suspend()
	{
		++this.suspendCount;
	}

	tick()
	{
		if (this.suspendCount > 0 || this.result != null)
			return;
		term.print("");
		term.print(`begin CTB turn cycle #${this.timer + 1}`);
		++this.timer;
		var isUnitDead = unit => !unit.isAlive();
		var unitLists = [ this.enemyUnits, this.playerUnits ];
		from(...unitLists)
			.each(unit => unit.beginCycle());
		from(this.conditions)
			.each(condition => condition.beginCycle());
		this.raiseEvent('beginCycle');
		var actionTaken = false;
		while (!actionTaken) {
			from(...unitLists).each(unit => {
				actionTaken = unit.tick() || actionTaken;
			});
			if (from(this.playerUnits).all(isUnitDead)) {
				music.adjust(0.0, 120);
				this.ui.fadeOut(2.0);
				this.result = BattleResult.Lose;
				term.print("all player characters have been KO'd");
				return;
			}
			if (from(this.enemyUnits).all(isUnitDead)) {
				music.adjust(0.0, 60);
				this.ui.fadeOut(1.0);
				this.result = BattleResult.Win;
				term.print("all enemies have been KO'd");
				return;
			}
		}
		from(...unitLists)
			.each(unit => unit.endCycle());
	}
}
