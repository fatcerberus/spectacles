/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
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
	
	// HP thresholds for phase transitions
	this.phasePoints = Link([ 4500, 2500, 1000 ])
		.map(function(value) { return Math.round(RNG.fromNormal(value, 50)); })
		.toArray();
	
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
		{ phase: 2, moves: [ 'necromancy', 'rejuvenate' ], rating: 3 },
		{ phase: 3, moves: [ 'necromancy', 'rejuvenate', 'renewal' ], rating: 4 },
		{ phase: 3, moves: [ 'electrocute', 'heal', 'rejuvenate' ], rating: 4 },
		{ phase: 4, moves: [ 'inferno', 'subzero', 'renewal' ], rating: 5 }
	];
	
	// AI state variables
	this.phase = 0;
	this.tactics = null;
	this.isOpenerPending = true;
	this.targetingMode = 'random';
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('berserkCharge');
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
ScottStarcrossAI.prototype.dispose = function()
{
};

// .strategize() method
// Allows Scott to decide what he will do next when his turn arrives.
ScottStarcrossAI.prototype.strategize = function()
{
	var milestone = Link(this.phasePoints)
		.where(function(value) { return value >= this.aic.unit.hp; }.bind(this))
		.last()[0];
	var phaseToEnter = 2 + Link(this.phasePoints).indexOf(milestone);
	var lastPhase = this.phase;
	this.phase = Math.max(phaseToEnter, this.phase);
	if (this.isOpenerPending) {
		this.aic.queueSkill('berserkCharge');
		this.isOpenerPending = false;
	} else {
		if (this.tactics === null) {
			var party = Link(this.aic.battle.enemiesOf(this.aic.unit)).shuffle();
			var combos = Link(Link(this.combos)
				.where(function(combo) { return this.phase >= combo.phase; }.bind(this))
				.random(party.length))
				.sort(function(a, b) { return b.rating - a.rating; });
			this.tactics = [];
			for (var i = 0; i < party.length; ++i) {
				this.tactics.push({ moves: combos[i].moves, moveIndex: 0, unit: party[i] });
			}
		}
		var validTactics = Link(this.tactics)
			.where(function(tactic) { return tactic.unit.isAlive(); })
			.where(function(tactic) { return tactic.moveIndex < tactic.moves.length; })
			.toArray();
		var tactic;
		do {
			tactic = RNG.fromArray(validTactics);
		} while (tactic === this.tactics[0] && tactic.moveIndex == tactic.moves.length - 1 && validTactics.length > 1);
		this.aic.queueSkill(tactic.moves[tactic.moveIndex], tactic.unit.id);
		++tactic.moveIndex;
		if (this.tactics[0].moveIndex == this.tactics[0].moves.length) {
			this.tactics = null;
		}
	}
};
