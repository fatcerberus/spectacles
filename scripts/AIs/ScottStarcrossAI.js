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
	this.phasePoints = [ 4000, 2000, 500 ];
	for (var i = 0; i < this.phasePoints.length; ++i) {
		this.phasePoints[i] = Math.round(this.phasePoints[i] + 200 * (0.5 - Math.random()));
	}
	
	// Scott's move combos
	// Each entry should have the following components:
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
	this.mainTactic = null;
	this.decoyTactic = null;
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

ScottStarcrossAI.prototype.selectCombo = function()
{
	return Link(this.combos)
		.where(function(combo) { return this.phase >= combo.phase; }.bind(this))
		.random(1)[0];
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
		if (this.mainTactic === null) {
			var combos = [ this.selectCombo(), this.selectCombo() ]
				.sort(function(a, b) { return b.rating - a.rating });
			var targetID = RNG.fromArray([ 'bruce', 'robert' ]);
			var decoyID = targetID != 'bruce' ? 'bruce' : 'robert';
			this.mainTactic = { moves: combos[0].moves, moveIndex: 0, unitID: targetID };
			this.decoyTactic = { moves: combos[1].moves, moveIndex: 0, unitID: decoyID };
		}
		var tactic = RNG.chance(0.5) ? this.mainTactic : this.decoyTactic;
		if (tactic == this.mainTactic && tactic.moveIndex == tactic.moves.length - 1
			&& this.decoyTactic.moveIndex < this.decoyTactic.moves.length)
		{
			tactic = this.decoyTactic;
		}
		if (tactic == this.decoyTactic && tactic.moveIndex == tactic.moves.length) {
			tactic = this.mainTactic;
		}
		this.aic.queueSkill(tactic.moves[tactic.moveIndex], tactic.unitID);
		++tactic.moveIndex;
		if (this.mainTactic.moveIndex == this.mainTactic.moves.length) {
			this.mainTactic = null;
		}
	}
};
