/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Music, Scene, Thread } from 'sphere-runtime';

import MenuStrip from '$/menuStrip';

export
class TitleScreen extends Thread
{
	constructor(themeTrack)
	{
		super();

		this.fadeness = 1.0;
		this.image = new Texture('images/titleScreen.png');
		this.themeTrack = themeTrack;
	}

	async show()
	{
		if (Sphere.Game.disableTitleScreen)
			return new Session();
		this.choice = null;
		this.mode = 'transitionIn';
		if (Sphere.Game.disableAnimations)
			this.fadeness = 0.0;
		this.transition = new Scene()
			.adjustBGM(1.0)
			.pushBGM(this.themeTrack)
			.tween(this, 120, 'linear', { fadeness: 0.0 });
		this.transition.run();
		this.start();
		await Thread.join(this);
		Music.pop();
		Music.adjustVolume(1.0);
		return new Session();
	}

	on_render()
	{
		Prim.blit(Surface.Screen, 0, 0, this.image);
		Prim.fill(Surface.Screen, Color.Black.fadeTo(this.fadeness));
	}

	on_update()
	{
		switch (this.mode) {
			case 'idle':
				break;
			case 'transitionIn':
				if (!this.transition.running) {
					this.mode = 'idle';
					this.choice = new MenuStrip("", false, [ "New Game", "Continue" ]).run();
					if (Sphere.Game.disableAnimations)
						this.fadeness = 1.0;
					this.transition = new Scene()
						.fork()
							.adjustBGM(0.0, 120)
						.end()
						.tween(this, 120, 'linear', { fadeness: 1.0 });
					this.transition.run();
					this.mode = 'transitionOut';
				}
				break;
			case 'transitionOut':
				if (!this.transition.running)
					this.stop();
				break;
		}
	}
}
