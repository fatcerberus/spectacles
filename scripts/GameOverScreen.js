/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("MenuStrip.js");

GameOverAction =
{
	retry: 1,
	quit: 2
};

function GameOverScreen()
{
	this.fadeScene = null;
	this.fadeness = 1.0;
	this.image = LoadImage("GameOverScreen.png");
}

GameOverScreen.prototype.render = function()
{
	this.image.blit(0, 0);
	ApplyColorMask(CreateColor(0, 0, 0, this.fadeness * 255));
};

GameOverScreen.prototype.show = function()
{
	Console.writeLine("Showing game over screen");
	this.action = null;
	this.mode = 'transitionIn';
	if (DBG_DISABLE_TRANSITIONS) {
		this.fadeness = 0.0;
	}
	this.fadeScene = new Scenario()
		.changeBGM("GameOver")
		.adjustBGMVolume(1.0)
		.tween(this, 5.0, 'linear', { fadeness: 0.0 })
		.run();
	Threads.waitFor(Threads.createEntityThread(this));
	BGM.change(null);
	BGM.adjustVolume(1.0);
	return this.action;
};

GameOverScreen.prototype.update = function()
{
	switch (this.mode) {
		case 'idle':
			return true;
		case 'transitionIn':
			if (!this.fadeScene.isRunning()) {
				this.mode = 'idle';
				var menu = new MenuStrip("Game Over", false);
				menu.addItem("Retry Battle", GameOverAction.retry);
				menu.addItem("Title Screen", GameOverAction.quit);
				this.action = menu.open();
				if (DBG_DISABLE_TRANSITIONS) {
					this.fadeness = 1.0;
				}
				this.transition = new Scenario()
					.fork()
						.adjustBGMVolume(0.0, 2.0)
					.end()
					.tween(this, 2.0, 'linear', { fadeness: 1.0 })
					.run();
				this.mode = 'transitionOut';
			}
			break;
		case 'transitionOut':
			return this.transition.isRunning();
	}
	return true;
};
