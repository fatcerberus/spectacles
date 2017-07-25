/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleEngine/item.js');
RequireScript('battleEngine/moveMenu.js');
RequireScript('battleEngine/mpPool.js');
RequireScript('battleEngine/skill.js');
RequireScript('battleEngine/stat.js');
RequireScript('battleEngine/statusEffect.js');

const Row =
{
	Front:  -1,
	Middle: 0,
	Rear:   1,
};

const Stance =
{
	Attack:  0,
	Guard:   1,
	Counter: 2,
	Charge:  3,
	Hippo:   4,
};

class BattleUnit
{
	constructor(battle, basis, position, startingRow, mpPool)
	{
		this.actionQueue = [];
		this.actor = null;
		this.affinities = [];
		this.ai = null;
		this.allowTargetScan = false;
		this.battle = battle;
		this.battlerInfo = {};
		this.counterTarget = null;
		this.cv = 0;
		this.hp = 0;
		this.lastAttacker = null;
		this.lazarusFlag = false;
		this.moveTargets = null;
		this.mpPool = null;
		this.newSkills = [];
		this.newStance = Stance.Attack;
		this.partyMember = null;
		this.row = startingRow;
		this.skills = [];
		this.stance = Stance.Attack;
		this.stats = {};
		this.statuses = [];
		this.tag = Random.string();
		this.turnRatio = 1.0;
		this.weapon = null;

		if (basis instanceof PartyMember) {
			this.partyMember = basis;
			this.id = this.partyMember.characterID;
			this.character = Game.characters[this.partyMember.characterID];
			this.baseStats = this.character.baseStats;
			this.tier = 1;
			this.maxHP = Math.round(Math.max(Game.math.hp(this.character, this.partyMember.level, this.tier), 1));
			this.hp = this.maxHP;
			this.name = this.partyMember.name;
			this.fullName = this.partyMember.fullName;
			this.allowTargetScan = this.partyMember.isTargetScanOn;
			this.skills = [ ...this.partyMember.getUsableSkills() ];
			this.items = clone(this.partyMember.items);
			for (let statID in this.baseStats)
				this.stats[statID] = this.partyMember.stats[statID];
			this.weapon = Game.weapons[this.partyMember.weaponID];
		} else {
			if (!(basis in Game.enemies))
				throw new ReferenceError(`enemy template '${basis}' doesn't exist!`);
			this.enemyInfo = Game.enemies[basis];
			this.baseStats = this.enemyInfo.baseStats;
			this.affinities = 'damageModifiers' in this.enemyInfo ? this.enemyInfo.damageModifiers : [];
			this.id = basis;
			this.name = this.enemyInfo.name;
			this.fullName = 'fullName' in this.enemyInfo ? this.enemyInfo.fullName : this.enemyInfo.name;
			for (let statID in this.baseStats)
				this.stats[statID] = new Stat(this.baseStats[statID], battle.getLevel(), false);
			if ('items' in this.enemyInfo) {
				this.items = from(this.enemyInfo.items)
					.select(v => new ItemUsable(v))
					.toArray();
			}
			else {
				this.items = [];
			}
			this.tier = 'tier' in this.enemyInfo ? this.enemyInfo.tier : 1;
			this.turnRatio = 'turnRatio' in this.enemyInfo ? this.enemyInfo.turnRatio : 1;
			this.maxHP = Math.round(Math.max(Game.math.hp(this.enemyInfo, battle.getLevel(), this.tier), 1));
			this.hp = this.maxHP;
			this.weapon = Game.weapons[this.enemyInfo.weapon];
			if ('hasLifeBar' in this.enemyInfo && this.enemyInfo.hasLifeBar)
				this.battle.ui.hud.createEnemyHPGauge(this);
			this.ai = Reflect.construct(this.enemyInfo.aiClass, [ this, battle ]);
			this.battle.registerAI(this.ai);
		}
		this.attackMenu = new MoveMenu(this, battle, Stance.Attack);
		this.counterMenu = new MoveMenu(this, battle, Stance.Counter);
		this.refreshInfo();
		this.mpPool = mpPool !== void null ? mpPool
			: new MPPool(`${this.id}MP`, Math.round(Math.max(Game.math.mp.capacity(this.battlerInfo), 0)));
		this.actor = battle.ui.createActor(this.name, position, this.row, this.isPartyMember() ? 'party' : 'enemy');
		if (this.isPartyMember())
			this.battle.ui.hud.setPartyMember(position == 2 ? 0 : position == 0 ? 2 : position, this, this.hp, this.maxHP);
		if (!this.isPartyMember())
			this.actor.enter(true);
		this.resetCounter(Game.defaultMoveRank, true);
		this.registerCommands();
		let unitType = this.ai === null ? "player" : "AI";
		Console.log(`create ${unitType} unit '${this.name}'`,
			`hp: ${this.hp}/${this.maxHP}`,
			`id: ${this.tag}`);
	}

	dispose()
	{
		if (this.ai !== null)
			this.battle.unregisterAI(this.ai);
		Console.undefineObject(this.id);
	}

	addStatus(statusID, isGuardable = false)
	{
		if (this.isAlive() && !this.hasStatus(statusID)) {
			let statusName = Game.statuses[statusID].name;
			let isOverruled = from(this.statuses)
				.any(v => v.overrules(statusID));
			if (!this.isPartyMember() && from(this.enemyInfo.immunities).anyIs(statusID)) {
				if (!isGuardable)
					this.actor.showHealing("immune", CreateColor(192, 192, 192, 255));
				Console.log(`${this.name} is immune to ${statusName}`);
			} else if (isOverruled) {
				if (!isGuardable)
					this.actor.showHealing("ward", CreateColor(192, 192, 192, 255));
				Console.log(`${statusName} overruled by another of ${this.name}'s statuses`);
			} else if (this.stance !== Stance.Guard || !isGuardable) {
				let eventData = { unit: this, statusID: statusID, cancel: false };
				this.battle.raiseEvent('unitAfflicted', eventData);
				if (!eventData.cancel)
					this.raiseEvent('afflicted', eventData);
				if (!eventData.cancel) {
					let effect = new StatusEffect(eventData.statusID, this);
					this.statuses.push(effect);
					this.battlerInfo.statuses = from(this.statuses)
						.select(v => v.statusID)
						.toArray();
					Console.log(`status ${effect.name} installed on ${this.name}`);
				} else {
					if (!isGuardable)
						this.actor.showHealing("ward", CreateColor(192, 192, 192, 255));
					Console.log(`status ${statusName} for ${this.name} blocked per status/FC`);
				}
			} else {
				Console.log(`status ${statusName} for ${this.name} blocked by Guard`);
			}
		}
	}

	announce(text)
	{
		let bannerColor = this.isPartyMember()
			? Color.mix(Color.Blue, Color.White, 75, 25).fade(0.75)
			: Color.mix(Color.Red, Color.White, 75, 25).fade(0.75);
		this.battle.ui.announceAction(text, this.isPartyMember() ? 'party' : 'enemy', bannerColor);
	}

	beginCycle()
	{
		if (!this.isAlive())
			return;

		this.refreshInfo();
		for (let i = 0; i < this.statuses.length; ++i)
			this.statuses[i].beginCycle();
		let eventData = { battlerInfo: this.battlerInfo };
		this.raiseEvent('beginCycle', eventData);
		let baseStatSum = 0;
		let statSum = 0;
		let numStats = 0;
		for (let statID in this.baseStats) {
			++numStats;
			this.battlerInfo.stats[statID] = Math.round(this.battlerInfo.stats[statID]);
			statSum += this.battlerInfo.stats[statID];
			this.battlerInfo.baseStats[statID] = Math.round(this.battlerInfo.baseStats[statID]);
			baseStatSum += this.battlerInfo.baseStats[statID];
		}
		this.battlerInfo.statAverage = Math.round(statSum / numStats);
		this.battlerInfo.baseStatAverage = Math.round(baseStatSum / numStats);
		this.mpPool.restore(this.battlerInfo.statAverage / 10);
	}

	beginTargeting(actingUnit)
	{
		this.lastAttacker = actingUnit;
	}

	clearQueue()
	{
		if (this.actionQueue.length > 0) {
			this.actionQueue = [];
			Console.log(`clear ${this.name}'s action queue`);
		}
	}

	die()
	{
		this.battle.notifyAIs('unitKilled', this.id);
		this.lazarusFlag = false;
		this.hp = 0;
		this.battle.ui.hud.setHP(this, this.hp);
		this.statuses = [];
		this.actor.animate('die');
		Console.log(`death comes near ${this.fullName}`);
	}

	endCycle()
	{
		if (!this.isAlive())
			return;

		if (this.stance === Stance.Counter) {
			this.cv = 0;
			if (this.ai == null) {
				this.actor.animate('active');
				this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this));
				Console.log(`ask player for ${this.name}'s GS counterattack`);
				chosenMove = this.counterMenu.open();
			} else {
				chosenMove = this.ai.getNextMove();
				chosenMove.targets = [ this.counterTarget ];
			}
			this.queueMove(chosenMove);
			this.performAction(this.getNextAction(), chosenMove);
			this.actor.animate('dormant');
			this.newStance = Stance.Attack;
		}
		if (this.newStance !== this.stance) {
			this.stance = this.newStance;
			this.battle.notifyAIs('stanceChanged', this.id, this.stance);
			let stanceName = this.stance === Stance.Guard ? "Guard"
				: this.stance === Stance.Counter ? "Counter"
				: "Attack";
			Console.log(`${this.name} now in ${stanceName} Stance`);
		}
	}

	endTargeting()
	{
		this.lastAttacker = null;
	}

	evade(actingUnit, action)
	{
		this.actor.showHealing("miss", CreateColor(192, 192, 192, 255));
		Console.log(`${this.name} evaded ${actingUnit.name}'s attack`);
		let isGuardBroken = 'preserveGuard' in action ? !action.preserveGuard : true;
		let isMelee = 'isMelee' in action ? action.isMelee : false;
		if (isMelee && this.stance === Stance.Guard && isGuardBroken) {
			this.stance = Stance.Counter;
			this.counterTarget = actingUnit;
			Console.log(`${this.name}'s Counter Stance activated`);
		}
	}

	getHealth()
	{
		return Math.ceil(100 * this.hp / this.maxHP);
	}

	getLevel()
	{
		if (this.partyMember != null) {
			return this.partyMember.level;
		} else {
			return this.battle.getLevel();
		}
	}

	growSkill(skillID, experience)
	{
		if (!this.isPartyMember())
			return;

		let hasSkill = false;
		for (let i = 0; i < this.skills.length; ++i) {
			if (skillID == this.skills[i].skillID) {
				hasSkill = true;
				this.skills[i].grow(experience);
			}
		}
		if (!hasSkill) {
			let skill = this.partyMember.learnSkill(skillID);
			this.skills.push(skill);
			this.newSkills.push(skill);
			Console.log(`${this.name} learned ${skill.name}`);
		}
	}

	getNextAction()
	{
		if (this.actionQueue.length > 0) {
			Console.log(`${this.actionQueue.length} outstanding action(s) for ${this.name}`);
			return this.actionQueue.shift();
		} else {
			return null;
		}
	}

	hasStatus(statusID)
	{
		return from(this.statuses)
			.any(v => v.statusID === statusID);
	}

	heal(amount, tags = [], isPriority = false)
	{
		if (!isPriority) {
			let eventData = {
				unit: this,
				amount: Math.round(amount),
				tags: tags,
				cancel: false
			};
			this.battle.raiseEvent('unitHealed', eventData);
			if (!eventData.cancel)
				this.raiseEvent('healed', eventData);
			if (!eventData.cancel)
				amount = Math.round(eventData.amount);
			else
				return;
		}
		if (amount > 0) {
			this.hp = Math.min(this.hp + amount, this.maxHP);
			this.actor.showHealing(amount);
			this.battle.ui.hud.setHP(this, this.hp);
			this.battle.notifyAIs('unitHealed', this, amount, tags);
			Console.log(`heal ${this.name} for ${amount} HP`, `now: ${this.hp}`);
		} else if (amount < 0) {
			this.takeDamage(-amount, [], true);
		}
	}

	isAlive()
	{
		return this.hp > 0 || this.lazarusFlag;
	}

	isPartyMember()
	{
		return this.partyMember != null;
	}

	liftStatus(statusID)
	{
		let eventData = {
			statusID: statusID,
			cancel: false
		};
		this.raiseEvent('unitCured', eventData);
		if (!eventData.cancel)
			this.raiseEvent('cured', eventData);
		if (!eventData.cancel) {
			from(this.statuses)
				.where(i => i.statusID === statusID)
				.besides(i => Console.log(`lift status effect ${this.name}->${i.name}`))
				.remove();
			this.battlerInfo.statuses = from(this.statuses)
				.select(v => v.statusID)
				.toArray();
		}
	}

	liftStatusTags(tags)
	{
		let activeStatuses = [ ...this.statuses ];
		from(activeStatuses)
			.where(v => from(v.statusDef.tags).anyIn(tags))
			.each(v => this.liftStatus(v.statusID));
	}

	performAction(action, move)
	{
		let targetsInfo = from(move.targets)
			.select(v => v.battlerInfo)
			.toArray();
		let eventData = { action, targetsInfo };
		this.raiseEvent('acting', eventData);
		eventData.action.rank = Math.max(Math.round(eventData.action.rank), 0);
		if (this.isAlive()) {
			if (this.stance === Stance.Counter)
				action.accuracyRate = 2.0;
			let unitsHit = this.battle.runAction(action, this, move.targets, move.usable.useAiming);
			if (move.usable.givesExperience && unitsHit.length > 0) {
				var allEnemies = this.battle.enemiesOf(this);
				var experience = {};
				for (let i = 0; i < unitsHit.length; ++i) {
					if (!unitsHit[i].isAlive() && this.battle.areEnemies(this, unitsHit[i])) {
						for (let statID in unitsHit[i].baseStats) {
							if (!(statID in experience)) {
								experience[statID] = 0;
							}
							experience[statID] += Game.math.experience.stat(statID, unitsHit[i].battlerInfo);
						}
					}
				}
				for (let statID in experience) {
					this.stats[statID].grow(experience[statID]);
					Console.log(`${this.name} got ${experience[statID]} EXP for ${Game.statNames[statID]}`,
						`value: ${this.stats[statID].value}`);
				}
			}
			this.resetCounter(action.rank);
		}
	}

	queueMove(move)
	{
		this.moveUsed = move;
		let alliesInBattle = this.battle.alliesOf(this.moveUsed.targets[0]);
		let alliesAlive = from(alliesInBattle)
			.where(v => v.isAlive())
			.toArray();
		this.moveUsed.targets = this.moveUsed.usable.isGroupCast
			? this.moveUsed.usable.allowDeadTarget ? alliesInBattle : alliesAlive
			: this.moveUsed.targets;
		if (!this.moveUsed.usable.isGroupCast && !this.moveUsed.targets[0].isAlive()
			&& !this.moveUsed.usable.allowDeadTarget)
		{
			this.moveUsed.targets[0] = Random.sample(alliesAlive);
		}
		let nextActions = this.moveUsed.usable.use(this, this.moveUsed.targets);
		if (move.stance === Stance.Counter || move.stance === Stance.Charge) {
			from(nextActions)
				.from(action => action.effects)
				.where(effect => 'power' in effect)
				.each(effect =>
			{
				effect.power *= Game.bonusMultiplier;
				effect.statusChance = 100;
				Console.log(`stance is Counter/Charge, boost attack`, `pow: ${effect.power}`);
			});
		}
		if (move.stance === Stance.Charge) {
			nextActions.splice(0, 0, {
				announceAs: "Charge",
				rank: 1,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'offGuard'
					}
				]
			});
		}
		if (nextActions !== null) {
			this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this, nextActions));
			for (let i = 0; i < nextActions.length; ++i)
				this.actionQueue.push(nextActions[i]);
			if (this.actionQueue.length > 0)
				Console.log(`queue ${this.actionQueue.length} action(s) for ${this.moveUsed.usable.name}`);
		} else {
			this.battle.ui.hud.turnPreview.set(this.battle.predictTurns());
		}
	}

	raiseEvent(eventID, data = null)
	{
		// event handlers can change the objects referenced in the data object, for example to
		// change the effects of an action taken by a battler.  if you pass in any objects from
		// the gamedef, they should be cloned first to prevent the event from inadvertantly
		// modifying the original definition.

		var statuses = [ ...this.statuses ];
		from(statuses)
			.each(v => v.invoke(eventID, data));
	}

	refreshInfo()
	{
		this.battlerInfo.name = this.name;
		this.battlerInfo.affinities = clone(this.affinities);
		this.battlerInfo.health = Math.ceil(100 * this.hp / this.maxHP);
		this.battlerInfo.level = this.getLevel();
		this.battlerInfo.weapon = clone(this.weapon);
		this.battlerInfo.tier = this.tier;
		this.battlerInfo.baseStats = {};
		this.battlerInfo.stats = { maxHP: this.maxHP };
		for (let statID in this.baseStats) {
			this.battlerInfo.baseStats[statID] = this.baseStats[statID];
			this.battlerInfo.stats[statID] = this.stats[statID].value;
		}
		this.battlerInfo.statuses = from(this.statuses)
			.select(v => v.statusID)
			.toArray();
		this.battlerInfo.stance = this.stance;
	}

	registerCommands()
	{
		Console.defineObject(this.id, this, {

			'add': function(statusID) {
				if (statusID in Game.statuses)
					this.addStatus(statusID);
				else
					Console.log(`invalid status ID '${statusID}'`);
			},

			'lift': function(statusID) {
				if (statusID in Game.statuses)
					this.liftStatus(statusID);
				else
					Console.log(`invalid status ID '${statusID}'`);
			},

			'damage': function(amount) {
				tags = [].slice.call(arguments, 1);
				amount = Math.max(parseInt(amount), 0);
				this.takeDamage(amount, tags);
			},

			'heal': function(amount) {
				tags = [].slice.call(arguments, 1);
				amount = Math.max(parseInt(amount), 0);
				this.heal(amount, tags);
			},

			'inv': function(instruction) {
				if (arguments.length < 1)
					return Console.log("'" + this.id + " inv': No instruction provided");
				switch (instruction) {
				case 'add':
					if (arguments.length < 2)
						return Console.log("'" + this.id + " inv add': Item ID required");
					var itemID = arguments[1];
					if (!(itemID in Game.items))
						return Console.log("no such item ID '" + itemID + "'");
					var defaultUses = 'uses' in Game.items[itemID] ? Game.items[itemID].uses : 1;
					var itemCount = arguments[2] > 0 ? arguments[2] : defaultUses;
					var addCount = 0;
					from(this.items)
						.where(item => item.itemID === itemID)
						.each(item =>
					{
						item.usesLeft += itemCount;
						addCount += itemCount;
					});
					if (addCount == 0) {
						var usable = new ItemUsable(itemID);
						usable.usesLeft = itemCount;
						this.items.push(usable);
						addCount = itemCount;
					}
					Console.log(addCount + "x " + Game.items[itemID].name + " added to " + this.name + "'s inventory");
					break;
				case 'munch':
					new Scene().playSound('Munch.wav').run();
					this.items.length = 0;
					Console.log("maggie ate " + this.name + "'s entire inventory");
					break;
				case 'rm':
					if (arguments.length < 2)
						return Console.log("'" + this.id + " inv add': Item ID required");
					var itemID = arguments[1];
					var itemCount = 0;
					from(this.items)
						.where(v => v.itemID === itemID)
						.besides(v => itemCount += v.usesLeft)
						.remove();
					if (itemCount > 0)
						Console.log(itemCount + "x " + Game.items[itemID].name
							+ " deleted from " + this.name + "'s inventory");
					else
						Console.log("No " + Game.items[itemID].name + " in " + this.name + "'s inventory");
					break;
				default:
					return Console.log("'" + this.id + " inv': Unknown instruction '" + instruction + "'");
				}
			},

			'revive': function() {
				this.resurrect();
			},

			'scan': function(flag) {
				flag = flag.toLowerCase();
				if (flag == 'on') this.allowTargetScan = true;
				if (flag == 'off') this.allowTargetScan = false;
				Console.log(`Target Scan for ${this.name} is ${this.allowTargetScan ? "ON" : "OFF"}`);
			},
		});
	}

	resetCounter(rank, isFirstTurn = false)
	{
		// note: Rank 0 is treated as a special case; passing 0 or less for rank will always give
		//       the unit its next turn immediately.

		let divisor = isFirstTurn ? 1.0 : this.turnRatio;
		this.cv = rank > 0
			? Math.max(Math.round(Game.math.timeUntilNextTurn(this.battlerInfo, rank) / divisor), 1)
			: 1;
		Console.log(`update ${this.name}'s CV to ${this.cv}`, `rank: ${rank}`);
	}

	restoreMP(amount)
	{
		amount = Math.round(amount);
		this.mpPool.restore(amount);
		var color = BlendColorsWeighted(CreateColor(255, 0, 255, 255), CreateColor(255, 255, 255, 255), 33, 66);
		this.actor.showHealing(`${amount}MP`, color);
	}

	resurrect(isFullHeal = false)
	{
		if (!this.isAlive()) {
			this.lazarusFlag = true;
			this.heal(isFullHeal ? this.maxHP : 1);
			this.actor.animate('revive');
			this.resetCounter(Game.reviveRank);
			Console.log(`${this.name} brought back from the dead`);
		} else {
			this.actor.showHealing("ward", CreateColor(192, 192, 192, 255));
		}
	}

	setGuard()
	{
		Console.log(`${this.name} will switch to Guard Stance`);
		this.announce("Guard");
		this.newStance = Stance.Guard;
		this.resetCounter(Game.stanceChangeRank);
	}

	setWeapon(weaponID)
	{
		var weaponDef = Game.weapons[weaponID];
		this.announce(`equip ${weaponDef.name}`);
		this.weapon = weaponDef;
		Console.log(`${this.name} equipped weapon ${weaponDef.name}`);
		this.resetCounter(Game.equipWeaponRank);
	}

	takeDamage(amount, tags = [], isPriority = false)
	{
		amount = Math.round(amount);
		var multiplier = 1.0;
		for (let i = 0; i < tags.length; ++i) {
			if (tags[i] in this.affinities) {
				multiplier *= this.affinities[tags[i]];
			}
		}
		amount = Math.round(amount * multiplier);
		if (amount > 0 && !isPriority) {
			var eventData = {
				unit: this, amount: amount, tags: tags,
				actingUnit: this.lastAttacker,
				cancel: false
			};
			this.battle.raiseEvent('unitDamaged', eventData);
			if (!eventData.cancel) {
				this.raiseEvent('damaged', eventData);
			}
			if (!eventData.cancel) {
				amount = Math.round(eventData.amount);
			} else {
				return;
			}
		}
		if (amount >= 0) {
			if (this.stance != Stance.Attack && this.lastAttacker !== null) {
				amount = Math.round(Game.math.guardStance.damageTaken(amount, tags));
				Console.log(`${this.name} hit in Guard Stance, reduce damage`);
			}
			let oldHPValue = this.hp;
			if (this.stance !== Stance.Hippo || amount < this.hp)
				this.hp = Math.max(this.hp - amount, 0);
			else
				this.hp = 1;
			this.battle.notifyAIs('unitDamaged', this, amount, tags, this.lastAttacker);
			Console.log(`damage ${this.name} for ${amount} HP`, `left: ${this.hp}`);
			if (oldHPValue > 0 || this.lazarusFlag) {
				let elementTags = from(tags).where(v => v in Game.elements);
				let damageColor = null;
				for (let tag of elementTags) {
					damageColor = damageColor !== null
						? BlendColors(damageColor, Game.elements[tag].color)
						: Game.elements[tag].color;
				}
				damageColor = damageColor !== null
					? BlendColorsWeighted(damageColor, CreateColor(255, 255, 255, 255), 33, 66)
					: CreateColor(255, 255, 255, 255);
				this.actor.showDamage(amount, damageColor);
			}
			this.battle.ui.hud.setHP(this, this.hp);
			if (this.hp <= 0 && (oldHPValue > 0 || this.lazarusFlag)) {
				Console.log(`${this.name} dying due to lack of HP`);
				this.lazarusFlag = true;
				var eventData = { unit: this, cancel: false };
				this.battle.raiseEvent('unitDying', eventData);
				if (!eventData.cancel) {
					this.raiseEvent('dying', eventData);
				}
				this.lazarusFlag = eventData.cancel;
				if (!this.lazarusFlag) {
					this.die();
				} else {
					Console.log(`suspend KO for ${this.name} per status/FC`);
				}
			}
		} else if (amount < 0) {
			this.heal(Math.abs(amount), tags);
		}
	}

	takeHit(actingUnit, action)
	{
		var eventData = {
			actingUnitInfo: actingUnit.battlerInfo,
			action: action,
			stance: actingUnit.stance
		};
		this.raiseEvent('attacked', eventData);
		var isGuardBroken = 'preserveGuard' in action ? !action.preserveGuard : true;
		var isMelee = 'isMelee' in action ? action.isMelee : false;
		if (this.stance === Stance.Guard && isMelee && isGuardBroken) {
			action.accuracyRate = 0.0; //'accuracyRate' in action ? 0.5 * action.accuracyRate : 0.5;
		}
		if (this.stance === Stance.Guard && isGuardBroken) {
			Console.log(`${this.name}'s Guard Stance broken`, `by: ${actingUnit.name}`);
			this.newStance = Stance.Attack;
			this.resetCounter(Game.guardBreakRank);
		}
	}

	tick()
	{
		if (!this.isAlive())
			return false;
		if (--this.cv == 0) {
			this.battle.suspend();
			if (this.stance === Stance.Guard) {
				this.stance = this.newStance = Stance.Attack;
				this.battle.notifyAIs('stanceChanged', this.id, this.stance);
				Console.log(`${this.name}'s Guard Stance expired`);
			} else if (this.stance === Stance.Counter) {
				this.newStance = Stance.Attack;
			}
			Console.log(`${this.name}'s turn is up`);
			this.actor.animate('active');
			this.battle.notifyAIs('unitReady', this.id);
			var eventData = { skipTurn: false };
			this.raiseEvent('beginTurn', eventData);
			if (!this.isAlive()) {
				this.battle.resume();
				return true;
			}
			if (eventData.skipTurn) {
				this.clearQueue();
				Console.log(`skip ${this.name}'s turn per status/FC`);
				this.resetCounter(Game.defaultMoveRank);
				this.battle.resume();
				return true;
			}
			var action = this.getNextAction();
			if (action == null) {
				var chosenMove = null;
				if (this.ai == null) {
					this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this));
					Console.log(`ask player for ${this.name}'s next move`);
					chosenMove = this.attackMenu.open();
				} else {
					chosenMove = this.ai.getNextMove();
				}
				if (chosenMove.stance != Stance.Guard) {
					this.queueMove(chosenMove);
					action = this.getNextAction();
				} else {
					this.setGuard();
				}
			}
			if (this.isAlive()) {
				if (action !== null) {
					this.performAction(action, this.moveUsed);
				}
				this.raiseEvent('endTurn');
			}
			var eventData = { actingUnit: this };
			this.battle.raiseEvent('endTurn', eventData);
			this.actor.animate('dormant');
			Console.log(`end of ${this.name}'s turn`);
			this.battle.resume();
			return true;
		} else {
			return false;
		}
	}

	timeUntilNextTurn()
	{
		return this.cv;
	}

	timeUntilTurn(turnIndex, assumedRank = Game.defaultMoveRank, nextActions = null)
	{
		if (this.isAlive()) {
			nextActions = nextActions !== null
				? this.actionQueue.concat(nextActions)
				: this.actionQueue;
			var timeLeft = this.cv;
			for (let i = 1; i <= turnIndex; ++i) {
				var rank = assumedRank;
				if (i <= nextActions.length) {
					rank = isNaN(nextActions[i - 1]) ? nextActions[i - 1].rank
						: nextActions[i - 1];
				}
				timeLeft += Math.max(Math.round(Game.math.timeUntilNextTurn(this.battlerInfo, rank) / this.turnRatio), 1);
			}
			return timeLeft;
		} else {
			return Infinity;
		}
	}
	
	turnIntoAHippo()
	{
		this.actor.animate('hippo');
		this.stance = Stance.Hippo;
	}
}
