/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("menuStrip.js");

// GameOverAction enumeration
// Specifies the action to take following a Game Over event.
GameOverAction =
{
	retry: 1,  // retry: Try the last battle again with full health and magic.
	quit: 2    // quit:  Return to the title screen.
};

// GameOverScreen() constructor
// Creates an object representing the Game Over screen.
function GameOverScreen()
{
	this.fadeness = 1.0;
	this.image = LoadImage('GameOverScreen.png');
	this.transition = null;
}

// .render() method
// Renders the Game Over screen.
GameOverScreen.prototype.render = function()
{
	this.image.blit(0, 0);
	ApplyColorMask(CreateColor(0, 0, 0, this.fadeness * 255));
};

// .show() method
// Activates the Game Over screen and allows the player to choose a course
// of action.
GameOverScreen.prototype.show = function()
{
	this.action = null;
	this.mode = 'transitionIn';
	if (Sphere.Game.disableAnimations) {
		this.fadeness = 0.0;
	}
	music.play(null);
	this.transition = new scenes.Scene()
		.pushBGM('gameOver')
		.adjustBGM(1.0)
		.tween(this, 300, 'linear', { fadeness: 0.0 })
		.run();
	return threads.create(this);
};

// .update() method
// Updates the Game Over screen for the next frame.
GameOverScreen.prototype.update = function()
{
	switch (this.mode) {
		case 'idle':
			return true;
		case 'transitionIn':
			if (!this.transition.isRunning()) {
				this.mode = 'idle';
				var menu = new MenuStrip("Game Over", false);
				menu.addItem("Retry Battle", GameOverAction.retry);
				menu.addItem("Give Up", GameOverAction.quit);
				this.action = menu.open();
				if (Sphere.Game.disableAnimations) {
					this.fadeness = 1.0;
				}
				this.transition = new scenes.Scene()
					.fork()
						.adjustBGM(0.0, 120)
					.end()
					.tween(this, 120, 'linear', { fadeness: 1.0 })
					.run();
				this.mode = 'transitionOut';
			}
			break;
		case 'transitionOut':
			if (!this.transition.isRunning()) {
				music.pop();
				music.adjust(1.0);
			}
			return this.transition.isRunning();
	}
	return true;
};
