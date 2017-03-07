/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleEngine/item.js');
RequireScript('battleEngine/skill.js');
RequireScript('battleEngine/weapon.js');

class BattleAI
{
	constructor(unit, battle)
	{
		term.print(`initialize AI for ${unit.fullName}`);
		this.battle = battle;
		this.data = {};
		this.defaultSkillID = null;
		this.moveQueue = [];
		this.currentPhase = 0;
		this.phasePoints = null;
		this.targets = null;
		this.turnsTaken = 0;
		this.unit = unit;
	}

	get defaultSkill()
	{
		return this.defaultSkillID;
	}
	
	get phase()
	{
		return this.currentPhase;
	}
	
	set defaultSkill(value)
	{
		term.print(`default skill for ${this.unit.name} is ${Game.skills[value].name}`);
		this.defaultSkillID = value;
	}

	definePhases(thresholds, sigma = 0)
	{
		term.print(`set up ${thresholds.length + 1} phases for ${this.unit.name}`);
		this.phasePoints = from(thresholds)
			.select(v => Math.round(random.normal(v, sigma)));
		let phase = 1;
		from(this.phasePoints)
			.each(v => term.print(`phase ${++phase} will start at <= ${v} HP`));
		this.currentPhase = 0;
		this.lastPhase = 0;
	}

	getNextMove()
	{
		var moveToUse = null;
		do {
			if (this.moveQueue.length == 0) {
				term.print(`defer to AI for ${this.unit.name}'s next move`);
				let enemyList = this.battle.enemiesOf(this.unit);
				this.enemies = [];
				for (let i = 0; i < enemyList.length; ++i) {
					var enemy = enemyList[i];
					this.enemies.push(enemy);
					this.enemies[enemy.id] = enemy;
				}
				let allyList = this.battle.alliesOf(this.unit);
				this.allies = [];
				for (let i = 0; i < allyList.length; ++i) {
					var ally = allyList[i];
					this.allies.push(ally);
					this.allies[ally.id] = ally;
				}
				this.targets = null;
				this.updatePhase();
				if (this.moveQueue.length == 0)
					this.strategize();
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
			var isUsable;
			do {
				candidateMove = this.moveQueue.shift();
				let isLegal = candidateMove.stance != Stance.Attack || candidateMove.usable.isUsable(this.unit, this.unit.stance);
				isUsable = isLegal && candidateMove.predicate();
				if (!isUsable)
					term.print(`discard ${this.unit.name}'s ${candidateMove.usable.name}, not usable`);
			} while (!isUsable && this.moveQueue.length > 0);
			if (isUsable)
				moveToUse = candidateMove;
			else if (this.defaultSkillID !== null)
				this.queueSkill(this.defaultSkillID);
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
			.where(v => v.usable instanceof ItemUsable)
			.any(v => v.usable.itemID == itemID);
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
			.where(v => v.usable instanceof SkillUsable)
			.any(v => v.usable.skillID == skillID);
	}

	isSkillUsable(skillID)
	{
		var skillToUse = new SkillUsable(skillID, 100);
		return skillToUse.isUsable(this.unit, this.unit.stance);
	}

	itemsLeft(itemID)
	{
		let item = from(this.unit.items)
			.where(v => v.itemID === itemID)
			.besides(v => term.print(`${this.unit.name} counting remaining ${v.name}`, `left: ${v.usesLeft}`))
			.first();
		return item.usesLeft;
	}

	predictItemTurns(itemID)
	{
		if (!(itemID in Game.items))
			throw new ReferenceError(`no item definition for '${itemID}'`);

		var itemRank = 'rank' in Game.items[itemID] ? Game.items[itemID].rank : Game.defaultItemRank;
		var forecast = this.battle.predictTurns(this.unit, [ itemRank ]);
		term.print(`${this.unit.name} considering ${Game.items[itemID].name}`,
			`next: ${forecast[0].unit.name}`);
		return forecast;
	}

	predictSkillTurns(skillID)
	{
		if (!(skillID in Game.skills))
			throw new ReferenceError(`no skill definition for '${skillID}'`);

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
		let itemToUse = from(this.unit.items)
			.where(v => v.itemID === itemID)
			.where(v => v.isUsable(this.unit, this.unit.stance))
			.first();
		if (itemToUse === undefined)
			throw new Error(`${this.unit.name} tried to use an item '${itemID}' not owned`);
		let targets = this.targets !== null ? this.targets
			: unitID !== null ? [ this.battle.findUnit(unitID) ]
			: itemToUse.defaultTargets(this.unit);
		this.moveQueue.push({
			usable: itemToUse,
			stance: Stance.Attack,
			targets,
			predicate: () => true,
		});
		term.print(`${this.unit.name} queued use of item ${itemToUse.name}`);
	}

	queueSkill(skillID, stance = Stance.Attack, unitID = null, predicate = () => true)
	{
		let skillToUse = new SkillUsable(skillID, 100);
		let targetUnit = unitID !== null ? this.battle.findUnit(unitID) : null;
		let targets = this.targets !== null ? this.targets
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

	setTarget(targetID)
	{
		var unit = this.battle.findUnit(targetID);
		this.targets = unit !== null ? [ unit ] : null;
	}

	strategize()
	{
		if (this.defaultSkillID !== null)
			this.queueSkill(this.defaultSkillID);
		else
			throw new Error("AI has no strategy");
	}

	updatePhase()
	{
		let phaseToEnter = 1;
		if (this.phasePoints !== null) {
			let milestone = from(this.phasePoints)
				.last(v => v >= this.unit.hp);
			phaseToEnter = 2 + this.phasePoints.indexOf(milestone);
		}
		let lastPhase = this.currentPhase;
		this.currentPhase = Math.max(phaseToEnter, this.currentPhase);  // ratcheting
		if (this.currentPhase > lastPhase) {
			term.print(`${this.unit.name} is entering phase ${this.currentPhase}`,
				`prev: ${lastPhase > 0 ? lastPhase : "none"}`);
			this.on_phaseChanged(this.currentPhase, lastPhase);
		}
	}

	on_itemUsed      (userID, targetIDs, itemID) {}
	on_skillUsed     (userID, targetIDs, skillID) {}
	on_stanceChanged (userID, stance) {}
	on_phaseChanged  (phase, lastPhase) {}
	on_unitDamaged   (unitID, amount, tags, attacker) {}
	on_unitHealed    (unitID, amount, tags) {}
	on_unitKilled    (unitID) {}
	on_unitReady     (unitID) {}
	on_unitTargeted  (targetID, action, unitID) {}
}
