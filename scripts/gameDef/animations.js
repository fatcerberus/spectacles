/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

import { Scene } from 'sphere-runtime';

export
const Animations =
{
	// Move Animations
	// Each animation is implemented by a function which is called with
	// 'this' bound to a context object used to manage the timing of attack
	// effects, and the following arguments:
	//     user:     The BattleUnit performing the move.
	//     targets:  The BattleUnit(s) targeted by the move.
	//     doesMiss: true if the move was determined to have missed, false otherwise.

	async munch(user, targets, doesMiss) {
		await new Scene()
			.playSound('sounds/munch.wav')
			.run();
		this.nextEffect();
	},

	tripleShot(user, targets, doesMiss) {
		for (let i = 0; i < 3; ++i)
			this.nextEffect();
	},
};
