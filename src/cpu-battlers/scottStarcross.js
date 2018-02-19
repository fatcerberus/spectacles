/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

// ScottStarcrossAI() constructor		
// Creates an AI to control Scott Starcross in the Spectacles III final battle.
// Arguments:
//     battle:    The battle session this AI is participating in.
//     unit:      The battle unit to be controlled by this AI.
//     aiContext: The AI context that this AI will execute under.
function ScottStarcrossAI(aiContext)
{
	this.aic = aiContext;
	
	// Scott's move combos
	// Each entry should include the following properties:
	//     phase:  The earliest phase in which the combination will be used.
	//     moves:  The list of moves that make up the combination. Moves will be performed
	//             in the order they are listed.
	//     rating: The power rating of the combination. When combos are chosen at the
	//             start of a combo cycle, the lower-rated combo will typically be used as a
	//             decoy.
	this.combos = [
		{ phase: 1, moves: [ 'electrocute', 'heal' ], rating: 1 },
		{ phase: 1, moves: [ 'hellfire', 'windchill' ], rating: 2 },
		{ phase: 1, moves: [ 'windchill', 'hellfire' ], rating: 2 },
		{ phase: 2, weaponID: 'powerBow', moves: [ 'flareShot', 'chillShot' ], rating: 2 },
		{ phase: 2, moves: [ 'necromancy', 'rejuvenate' ], rating: 3 },
		{ phase: 3, moves: [ 'necromancy', 'rejuvenate', 'renewal' ], rating: 4 },
		{ phase: 3, moves: [ 'electrocute', 'heal', 'rejuvenate' ], rating: 4 },
		{ phase: 4, moves: [ 'inferno', 'subzero', 'renewal' ], rating: 5 }
	];
	
	// AI state variables
	this.tactics = null;
	this.isOpenerPending = true;
	this.targetingMode = 'random';
	this.weaponID = 'templeSword';
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('swordSlash');
	this.aic.definePhases([ 4500, 2500, 1000 ], 50);
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
ScottStarcrossAI.prototype.dispose = function()
{
};

// .strategize() method
// Allows Scott to decide what he will do next when his turn arrives.
ScottStarcrossAI.prototype.strategize = function(stance, currentPhase)
{
	if (this.isOpenerPending) {
		this.aic.queueSkill('berserkCharge');
		this.isOpenerPending = false;
	} else {
		if (this.tactics === null) {
			var targets = from(this.aic.battle.enemiesOf(this.aic.unit))
				.shuffle()
				.select();
			var combos = from(this.combos)
				.where(it => currentPhase >= it.phase)
				.random(targets.length)
				.descending(it => it.rating)
				.select();
			this.tactics = [];
			for (var i = 0; i < targets.length; ++i) {
				this.tactics.push({ moves: combos[i].moves, moveIndex: 0, unit: targets[i] });
			}
		}
		this.tactics = from(this.tactics)
			.where(it => it.unit.isAlive())
			.where(it => it.moveIndex < it.moves.length)
			.select();
		var tactic;
		do {
			tactic = random.sample(this.tactics);
		} while (tactic === this.tactics[0] && tactic.moveIndex == tactic.moves.length - 1
			&& this.tactics.length > 1);
		this.aic.queueSkill(tactic.moves[tactic.moveIndex], tactic.unit.id);
		++tactic.moveIndex;
		if (this.tactics[0].moveIndex == this.tactics[0].moves.length) {
			this.tactics = null;
		}
	}
};
