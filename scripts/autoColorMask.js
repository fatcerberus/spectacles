/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2024 Fat Cerberus
**/

import { Prim, Scene, Task } from 'sphere-runtime';

export default
class AutoColorMask extends Task
{
	constructor(initialMask = Color.Transparent)
	{
		super({ priority: Infinity });

		this.mask = initialMask;
		this.scene = null;

		this.start();
	}

	on_render()
	{
		Prim.fill(Surface.Screen, this.mask);
	}

	async fadeTo(newMask, numFrames = 60)
	{
		if (this.scene !== null)
			this.scene.stop();
		this.scene = new Scene()
			.tween(this.mask, numFrames, 'linear', newMask);
		await this.scene.run();
	}
}
