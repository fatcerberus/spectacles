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
	this.phasePoints = [ 4000, 3000, 2000, 1000, 500 ];
	for (var i = 0; i < this.phasePoints.length; ++i) {
		this.phasePoints[i] = Math.round(this.phasePoints[i] + 200 * (0.5 - Math.random()));
	}
	
	// Scott's move combos
	// Each entry should have the following components:
	//     phase:  The earliest phase in which the combination will be used.
	//     moves:  The list of moves that make up the combination. Moves will be performed
	//             in the order they are listed.
	//     weight: The relative weight of the combination. Combos with heavier weights will
	//             be selected more often.
	// Remarks:
	//     The AI will consider combinations earlier in the list to be more devastating.
	this.combos = [
		{ phase: 1, moves: [ 'necromancy', 'heal' ], weight: 1 },
		{ phase: 2, moves: [ 'hellfire', 'windchill' ], weight: 1 },
		{ phase: 2, moves: [ 'windchill', 'hellfire' ], weight: 1 },
		{ phase: 3, moves: [ 'electrocute', 'heal', 'rejuvenate' ], weight: 1 },
		{ phase: 5, moves: [ 'inferno', 'subzero', 'omni', 'renewal' ], weight: 1 },
		{ phase: 6, moves: [ 'necromancy', 'berserkCharge' ], weight: 1 }
	];
	
	// AI state variables
	this.phase = 0;
	this.mainTactic = null;
	this.decoyTactic = null;
	this.isOpenerPending = true;
	this.targetingMode = 'random';
	this.targetID = 'robert';
	
	// Prepare the AI for use
	this.aic.setDefaultSkill('berserkCharge');
}

// .dispose() method
// Relinquishes resources and shuts down the AI.
ScottStarcrossAI.prototype.dispose = function()
{
};

// .selectCombo() method
// Returns a random, combo from Scott's the list of combos. The current
// phase will be accounted for when selecting.
ScottStarcrossAI.prototype.selectCombo = function()
{
	var candidate;
	do {
		candidate = RNG.fromArray(this.combos);
	} while (this.phase < candidate.phase);
	return candidate;
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
		var decoyComboIndex = Math.floor(Math.random() * this.combos.length);
		var mainComboIndex = Math.floor(Math.random() * this.combos.length);
		if (mainComboIndex < decoyComboIndex) {
			var newMainIndex = decoyComboIndex;
			decoyComboIndex = mainComboIndex;
			mainComboIndex = newMainIndex;
		}
		if (this.targetingMode == 'random') {
			this.targetID = RNG.fromArray([ 'bruce', 'robert' ]);
		}
		this.mainTactic = { moves: this.combos[mainComboIndex], moveIndex: 0 };
		this.decoyTactic = { moves: this.combos[decoyComboIndex], moveIndex: 0 };
	}
};
