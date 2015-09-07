/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

Game.animations =
{
	// Move Animations
	// Each animation is implemented by a function which takes the following
	// parameters:
	//     user:     The BattleUnit performing the move.
	//     targets:  The BattelUnit(s) targeted by the move.
	//     doesMiss: true if the move was determined to have missed, false otherwise.
	
	munch: function(user, targets, doesMiss) {
		new mini.Scene()
			.playSound("Munch.wav")
			.run();
		this.apply();
	},
};
