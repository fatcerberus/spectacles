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
	this.manifest = GetGameManifest();
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
	if (this.manifest.disableTitleScreen) {
		return new Session();
	}
	this.choice = null;
	this.mode = 'transitionIn';
	if (this.manifest.disableAnimation) {
		this.fadeness = 0.0;
	}
	this.transition = new scenes.Scene()
		.adjustBGM(1.0)
		.pushBGM(this.themeTrack)
		.tween(this, 2.0, 'linear', { fadeness: 0.0 })
		.run();
	threads.join(threads.create(this));
	music.pop();
	music.adjust(1.0);
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
				if (this.manifest.disableAnimation) {
					this.fadeness = 1.0;
				}
				this.transition = new scenes.Scene()
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
