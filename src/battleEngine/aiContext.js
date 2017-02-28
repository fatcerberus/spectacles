/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleEngine/item.js');
RequireScript('battleEngine/skill.js');
RequireScript('battleEngine/weapon.js');

class AIContext
{
	constructor(unit, battle, aiType)
	{
		// handler function signature:
		//     function(aiContext, newPhase, lastPhase)
		this.phaseChanged = new events.Delegate();

		term.print(`initialize AI context for ${unit.fullName}`);
		this.battle = battle;
		this.data = {};
		this.defaultSkillID = null;
		this.moveQueue = [];
		this.phase = 0;
		this.phasePoints = null;
		this.targets = null;
		this.turnsTaken = 0;
		this.unit = unit;

		this.strategy = new aiType(this);
	}

	dispose()
	{
		term.print(`shut down AI for ${this.unit.fullName}`);
		if ('dispose' in this.strategy)
			this.strategy.dispose();
	}

	checkPhase(allowEvents = true)
	{
		var phaseToEnter;
		if (this.phasePoints !== null) {
			var milestone = from(this.phasePoints)
				.last(it => it >= this.unit.hp);
			phaseToEnter = 2 + this.phasePoints.indexOf(milestone);
		} else {
			phaseToEnter = 1;
		}
		var lastPhase = this.phase;
		this.phase = Math.max(phaseToEnter, this.phase);
		if (allowEvents && this.phase > lastPhase) {
			term.print(`${this.unit.name} is entering Phase ${this.phase}`,
				`prev: ${lastPhase > 0 ? lastPhase : "none"}`);
			this.phaseChanged.invoke(this, this.phase, lastPhase);
		}
	}

	definePhases(thresholds, sigma = 0)
	{
		term.print(`set up ${thresholds.length + 1} phases for ${this.unit.name}`);
		this.phasePoints = from(thresholds)
			.select(it => Math.round(random.normal(it, sigma)));
		var phaseIndex = 1;
		from(this.phasePoints).each(milestone => {
			++phaseIndex;
			term.print(`phase ${phaseIndex} will start at <= ${milestone} HP`);
		});
		this.phase = 0;
	}

	getNextMove()
	{
		var moveToUse = null;
		do {
			if (this.moveQueue.length == 0) {
				term.print(`defer to AI for ${this.unit.name}'s next move`);
				var enemyList = this.battle.enemiesOf(this.unit);
				this.enemies = [];
				for (var i = 0; i < enemyList.length; ++i) {
					var enemy = enemyList[i];
					this.enemies.push(enemy);
					this.enemies[enemy.id] = enemy;
				}
				var allyList = this.battle.alliesOf(this.unit);
				this.allies = [];
				for (var i = 0; i < allyList.length; ++i) {
					var ally = allyList[i];
					this.allies.push(ally);
					this.allies[ally.id] = ally;
				}
				this.targets = null;
				this.checkPhase();
				if (this.moveQueue.length == 0) {
					this.strategy.strategize(this.unit.stance, this.phase);
				}
				if (this.moveQueue.length == 0) {
					term.print(`no moves queued for ${this.unit.name}, using default`);
					if (this.defaultSkillID !== null) {
						this.queueSkill(this.defaultSkillID);
					} else {
						throw new Error("no moves queued and no default skill");
					}
				}
			}
			var candidateMove;
			var isMoveUsable;
			do {
				candidateMove = this.moveQueue.shift();
				var isMoveLegal = candidateMove.stance != Stance.Attack || candidateMove.usable.isUsable(this.unit, this.unit.stance);
				var isMoveUsable = isMoveLegal && candidateMove.predicate();
				if (!isMoveUsable) {
					term.print(`discard ${this.unit.name}'s ${candidateMove.usable.name}, not usable`);
				}
			} while (!isMoveUsable && this.moveQueue.length > 0);
			if (isMoveUsable) {
				moveToUse = candidateMove;
			} else if (this.defaultSkillID !== null) {
				this.queueSkill(this.defaultSkillID);
			}
		} while (moveToUse === null);
		++this.turnsTaken;
		return moveToUse;
	}

	hasMovesQueued()
	{
		return this.moveQueue.length > 0;
	}

	hasStatus(statusID)
	{
		return this.unit.hasStatus(statusID);
	}

	isItemQueued(itemID)
	{
		return from(this.moveQueue)
			.where(move => move.usable instanceof ItemUsable)
			.any(move => move.usable.itemID == itemID);
	}

	isItemUsable(itemID)
	{
		return from(this.unit.items)
			.where(v => v.itemID === itemID)
			.any(v => v.isUsable(this, this.unit.stance));
	}

	isSkillQueued(skillID)
	{
		return from(this.moveQueue)
			.where(move => move.usable instanceof SkillUsable)
			.any(move => move.usable.skillID == skillID);
	}

	isSkillUsable(skillID)
	{
		var skillToUse = new SkillUsable(skillID, 100);
		return skillToUse.isUsable(this.unit, this.unit.stance);
	}

	itemsLeft(itemID)
	{
		var itemUsable = from(this.unit.items)
			.first(v => v.itemID === itemID);
		term.print(`${this.unit.name} requested item count for ${itemUsable.name}`,
			`left: ${itemUsable.usesLeft}`);
		return itemUsable.usesLeft;
	}

	predictItemTurns(itemID)
	{
		if (!(itemID in Game.items))
			throw new ReferenceError(`no such item '${itemID}'`);
		var itemRank = 'rank' in Game.items[itemID] ? Game.items[itemID].rank : Game.defaultItemRank;
		var forecast = this.battle.predictTurns(this.unit, [ itemRank ]);
		term.print(`${this.unit.name} considering ${Game.items[itemID].name}`,
			`next: ${forecast[0].unit.name}`);
		return forecast;
	}

	predictSkillTurns(skillID)
	{
		if (!(skillID in Game.skills))
			throw new ReferenceError(`no such skill '${skillID}'`);
		var forecast = this.battle.predictTurns(this.unit, Game.skills[skillID].actions);
		term.print(`${this.unit.name} considering ${Game.skills[skillID].name}`,
			`next: ${forecast[0].unit.name}`);
		return forecast;
	}

	queueGuard()
	{
		this.moveQueue.push({
			usable: null,
			stance: Stance.Guard,
			predicate: () => true,
		});
	}

	queueItem(itemID, unitID = null)
	{
		var itemToUse = null;
		for (var i = 0; i < this.unit.items.length; ++i) {
			var item = this.unit.items[i];
			if (item.itemID == itemID && item.isUsable(this.unit, this.unit.stance)) {
				itemToUse = item;
				break;
			}
		}
		if (itemToUse == null)
			throw new Error(`${this.unit.name} tried to use an item '${itemID}' not owned`);
		var targets = this.targets !== null ? this.targets
			: unitID !== null ? [ this.battle.findUnit(unitID) ]
			: itemToUse.defaultTargets(this.unit);
		this.moveQueue.push({
			usable: itemToUse,
			stance: Stance.Attack,
			targets: targets,
			predicate: () => true,
		});
		term.print(`${this.unit.name} queued use of item ${itemToUse.name}`);
	}

	queueSkill(skillID, stance = Stance.Attack, unitID = null, predicate = () => true)
	{
		var skillToUse = new SkillUsable(skillID, 100);
		/*for (var i = 0; i < this.unit.skills.length; ++i) {
			var skill = this.unit.skills[i];
			if (skill.skillID == skillID) {
				skillToUse = skill;
				break;
			}
		}
		if (skillToUse == null) {
			Abort("AIContext.queueItem(): AI unit " + this.unit.name + " tried to use an unknown or unusable skill");
		}*/
		var targetUnit = unitID !== null ? this.battle.findUnit(unitID) : null;
		var targets = this.targets !== null ? this.targets
			: targetUnit !== null ? [ targetUnit ]
			: skillToUse.defaultTargets(this.unit);
		this.moveQueue.push({
			usable: skillToUse,
			stance: stance,
			targets: targets,
			predicate: predicate
		});
		term.print(`${this.unit.name} queued use of skill ${skillToUse.name}`);
	}

	queueWeapon(weaponID)
	{
		var weaponUsable = new WeaponUsable(weaponID);
		this.moveQueue.push({
			usable: weaponUsable,
			stance: Stance.Attack,
			targets: weaponUsable.defaultTargets(this.unit),
			predicate: () => true,
		});
		var weaponDef = Game.weapons[weaponID];
		term.print(`${this.unit.name} queued weapon change to ${weaponDef.name}`);
	}

	setDefaultSkill(skillID)
	{
		this.defaultSkillID = skillID;
		term.print(`${this.unit.name}'s default skill is ${Game.skills[skillID].name}`);
	}

	setTarget(targetID)
	{
		var unit = this.battle.findUnit(targetID);
		this.targets = unit !== null ? [ unit ] : null;
	}
}
