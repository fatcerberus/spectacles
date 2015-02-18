/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("MenuStrip.js");
RequireScript("Session.js");

// TitleScreen() constructor
// Creates an object representing the title screen.
// Arguments:
//     themeTrack: The name of the BGM track to be played when the title screen
//                 is active.
function TitleScreen(themeTrack)
{
	this.fadeness = 1.0;
	this.image = LoadImage("TitleScreen.png");
	this.themeTrack = themeTrack;
}

// .render() method
// Renders the title screen
TitleScreen.prototype.render = function()
{
	this.image.blit(0, 0);
	ApplyColorMask(CreateColor(0, 0, 0, this.fadeness * 255));
};

// .show() method
// Activates the title screen and waits for the player to choose an action to take.
TitleScreen.prototype.show = function()
{
	if (DBG_DISABLE_TITLE_SCREEN) {
		return new Session();
	}
	this.choice = null;
	this.mode = 'transitionIn';
	if (DBG_DISABLE_TRANSITIONS) {
		this.fadeness = 0.0;
	}
	this.transition = new Scenario()
		.adjustBGM(1.0)
		.playBGM(this.themeTrack)
		.tween(this, 2.0, 'linear', { fadeness: 0.0 })
		.run();
	Threads.waitFor(Threads.createEntityThread(this));
	BGM.reset();
	BGM.adjustVolume(1.0);
	return new Session();
};

// .update() method
// Updates the title screen for the next frame.
TitleScreen.prototype.update = function()
{
	switch (this.mode) {
		case 'idle':
			return true;
		case 'transitionIn':
			if (!this.transition.isRunning()) {
				this.mode = 'idle';
				this.choice = new MenuStrip("", false, [ "New Game", "Continue" ]).open();
				if (DBG_DISABLE_TRANSITIONS) {
					this.fadeness = 1.0;
				}
				this.transition = new Scenario()
					.fork()
						.adjustBGM(0.0, 2.0)
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
