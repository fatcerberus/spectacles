/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript("menuStrip.js");
RequireScript("session.js");

class TitleScreen
{
	constructor(themeTrack)
	{
		this.fadeness = 1.0;
		this.image = new Texture('images/titleScreen.png');
		this.themeTrack = themeTrack;
	}

	show()
	{
		if (Sphere.Game.disableTitleScreen) {
			return new Session();
		}
		this.choice = null;
		this.mode = 'transitionIn';
		if (Sphere.Game.disableAnimations) {
			this.fadeness = 0.0;
		}
		this.transition = new Scene()
			.adjustBGM(1.0)
			.pushBGM(this.themeTrack)
			.tween(this, 120, 'linear', { fadeness: 0.0 })
			.run();
		Thread.join(Thread.create(this));
		Music.pop();
		Music.adjust(1.0);
		return new Session();
	}

	update()
	{
		switch (this.mode) {
			case 'idle':
				return true;
			case 'transitionIn':
				if (!this.transition.isRunning()) {
					this.mode = 'idle';
					this.choice = new MenuStrip("", false, [ "New Game", "Continue" ]).open();
					if (Sphere.Game.disableAnimations) {
						this.fadeness = 1.0;
					}
					this.transition = new Scene()
						.fork()
							.adjustBGM(0.0, 120)
						.end()
						.tween(this, 120, 'linear', { fadeness: 1.0 })
						.run();
					this.mode = 'transitionOut';
				}
				break;
			case 'transitionOut':
				return this.transition.isRunning();
		}
		return true;
	}

	render()
	{
		Prim.blit(screen, 0, 0, this.image);
		Prim.fill(screen, Color.Black.fade(this.fadeness));
	}
}
