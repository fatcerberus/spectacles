/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("MenuStrip.js");
RequireScript("Session.js");

function TitleScreen(themeTrack)
{
	this.render = function() {
		this.image.blit(0, 0);
		ApplyColorMask(CreateColor(0, 0, 0, this.fadeness * 255));
	};
	this.update = function() {
		switch (this.mode) {
			case 'idle':
				return true;
			case 'transitionIn':
				if (!this.transition.isRunning()) {
					this.mode = 'idle';
					this.choice = new MenuStrip("Battle Demo", false, [ "Start Demo" ]).open();
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
	
	this.fadeness = 1.0;
	this.image = LoadImage("TitleScreen.png");
	this.themeTrack = themeTrack;
}

TitleScreen.prototype.show = function()
{
	if (DBG_DISABLE_TITLE_SCREEN) {
		return new Session();
	}
	this.choice = null;
	this.mode = 'transitionIn';
	this.transition = new Scenario()
		.adjustBGMVolume(1.0)
		.changeBGM(this.themeTrack)
		.tween(this, 2.0, 'linear', { fadeness: 0.0 })
		.run();
	Threads.waitFor(Threads.createEntityThread(this));
	BGM.change(null);
	BGM.adjustVolume(1.0);
	return new Session();
};
