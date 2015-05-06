/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

Game.elements =
{
	fire: { name: "Fire", color: CreateColor(255, 0, 0, 255) },
	ice: { name: "Ice", color: CreateColor(0, 128, 255, 255) },
	lightning: { name: "Lightning", color: CreateColor(255, 192, 0, 255) },
	earth: { name: "Earth", color: CreateColor(255, 128, 0, 255) },
	cure: { name: "Cure", color: CreateColor(64, 255, 128, 255) },
	omni: { name: "Omni", color: CreateColor(255, 255, 255, 255) },
	fat: { name: "Fat", color: CreateColor(255, 0, 255, 255) },
	zombie: { name: "Zombie", color: CreateColor(128, 255, 0, 255) }
};

Game.moveEffects =
{
	addCondition: function(actor, targets, effect) {
		actor.battle.addCondition(effect.condition);
	},
	
	addStatus: function(actor, targets, effect) {
		mini.Link(targets).invoke('addStatus', effect.status);
	},
	
	damage: function(actor, targets, effect) {
		var userInfo = actor.battlerInfo;
		for (var i = 0; i < targets.length; ++i) {
			var targetInfo = targets[i].battlerInfo;
			var damageTags = [ effect.damageType ];
			if ('element' in effect) {
				damageTags.push(effect.element);
			}
			var damage = Math.max(Math.round(Game.math.damage[effect.damageType](userInfo, targetInfo, effect.power)), 1);
			var tolerance = Math.round(damage / 10);
			targets[i].takeDamage(Math.max(RNG.vary(damage, tolerance), 1), damageTags);
			var recoilFunction = effect.damageType + "Recoil";
			if (recoilFunction in Game.math.damage) {
				var recoil = Math.round(Game.math.damage[recoilFunction](userInfo, targetInfo, effect.power));
				var tolerance = Math.round(recoil / 10);
				actor.takeDamage(Math.max(RNG.vary(recoil, tolerance), 1), [ 'recoil' ], true);
			}
			if ('addStatus' in effect) {
				var statusChance = 'statusChance' in effect ? effect.statusChance / 100 : 1.0;
				if (statusChance > Math.random()) {
					targets[i].addStatus(effect.addStatus, true);
				}
			}
		}
	},
	
	devour: function(actor, targets, effect) {
		for (var i = 0; i < targets.length; ++i) {
			if (!targets[i].isPartyMember()) {
				var munchData = targets[i].enemyInfo.munchData;
				var experience = Game.math.experience.skill(munchData.skill, actor.battlerInfo, [ targets[i].battlerInfo ]);
				actor.growSkill(munchData.skill, experience);
			}
			mini.Console.writeLine(targets[i].fullName + " got eaten by " + actor.name);
			new mini.Scene()
				.playSound("Munch.wav")
				.run();
			targets[i].die();
		}
		actor.heal(actor.maxHP - actor.hp, [], true);
	},
	
	fullRecover: function(actor, targets, effect) {
		mini.Link(targets)
			.where(function(unit) { return !unit.hasStatus('zombie'); })
			.each(function(unit)
		{
			unit.heal(unit.maxHP - unit.hp, [ 'cure' ]);
		});
	},
	
	heal: function(actor, targets, effect) {
		var userInfo = actor.battlerInfo;
		for (var i = 0; i < targets.length; ++i) {
			var targetInfo = targets[i].battlerInfo;
			var healing = Math.max(Math.round(Game.math.healing(userInfo, targetInfo, effect.power)), 1);
			var tolerance = Math.round(healing / 10);
			targets[i].heal(Math.max(RNG.vary(healing, tolerance), 1), [ 'cure' ]);
			if ('addStatus' in effect) {
				var statusChance = 'statusChance' in effect ? effect.statusChance / 100 : 1.0;
				if (statusChance > Math.random()) {
					targets[i].addStatus(effect.addStatus);
				}
			}
		}
	},
	
	instaKill: function(actor, targets, effect) {
		for (var i = 0; i < targets.length; ++i) {
			targets[i].takeDamage(Math.max(targets[i].hp, 1), [ effect.damageType, 'deathblow' ]);
		}
	},
	
	liftStatus: function(actor, targets, effect) {
		for (var i = 0; i < targets.length; ++i) {
			for (var i2 = 0; i2 < effect.statuses.length; ++i2) {
				targets[i].liftStatus(effect.statuses[i2]);
			}
		}
	},
	
	liftStatusTags: function(actor, targets, effect) {
		mini.Link(targets).invoke('liftStatusTags', effect.tags);
	},
	
	recoverHP: function(actor, targets, effect) {
		for (var i = 0; i < targets.length; ++i) {
			var vitality = targets[i].battlerInfo.stats.vit;
			var tier = targets[i].battlerInfo.tier;
			targets[i].heal(effect.strength * vitality / tier, [ 'cure' ]);
		}
	},
	
	recoverMP: function(actor, targets, effect) {
		mini.Link(targets).each(function(unit) {
			var amount = Math.round(Game.math.mp.capacity(unit.battlerInfo));
			unit.restoreMP(amount);
		});
	},
	
	revive: function(actor, targets, effect) {
		mini.Link(targets).invoke('resurrect', effect.healToFull);
	}
};
