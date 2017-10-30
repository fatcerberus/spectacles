/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript("menuStrip.js");

const GameOverAction =
{
	Retry: 1,
	Quit:  2,
};

class GameOverScreen extends Thread
{
	constructor()
	{
		super();

		this.fadeness = 1.0;
		this.image = new Texture('images/gameOverScreen.png');
		this.transition = null;
	}

	show()
	{
		this.action = null;
		this.mode = 'transitionIn';
		if (Sphere.Game.disableAnimations) {
			this.fadeness = 0.0;
		}
		Music.play(null);
		this.transition = new Scene()
			.pushBGM('gameOver')
			.adjustBGM(1.0)
			.tween(this, 300, 'linear', { fadeness: 0.0 });
		this.transition.run();
		this.start();
		return this;
	}

	on_render()
	{
		Prim.blit(Surface.Screen, 0, 0, this.image);
		Prim.fill(Surface.Screen, Color.Black.fadeTo(this.fadeness));
	}

	async on_update()
	{
		switch (this.mode) {
			case 'idle':
				break;
			case 'transitionIn':
				if (!this.transition.running) {
					this.mode = 'idle';
					var menu = new MenuStrip("Game Over", false);
					menu.addItem("Retry Battle", GameOverAction.Retry);
					menu.addItem("Give Up", GameOverAction.Quit);
					this.action = await menu.open();
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
				if (!this.transition.running) {
					Music.pop();
					Music.adjustVolume(1.0);
					this.stop();
				}
				break;
		}
	}
}
