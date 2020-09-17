/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2020 Fat Cerberus
***/

import { Prim, Scene, Thread } from '/lib/sphere-runtime.js';

export default
class AutoColorMask extends Thread
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
