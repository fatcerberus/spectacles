/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Core/Tween.js");
RequireScript("MenuStrip.js");

function TitleScreen(themeTrack)
{
	this.render = function() {
		this.image.blit(0, 0);
		ApplyColorMask(CreateColor(0, 0, 0, this.fadeness * 255));
	};
	this.update = function() {
		switch (this.mode) {
			case "fade-in":
				if (this.fadeTween.isFinished()) {
					this.choice = new MenuStrip("Tech Demo", false, [ "Start Demo" ]).open();
					this.fadeTween = new Tween(this, 2.0, 'linear', { fadeness: 1.0 });
					this.fadeTween.start();
					this.mode = "fade-out";
					BGM.adjustVolume(0.0, 2.0);
				}
				break;
			case "fade-out":
				if (this.fadeTween.isFinished()) {
					this.mode = "finish";
				}
				break;
			case "finish":
				return BGM.isAdjusting();
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
	BGM.change(this.themeTrack);
	this.mode = "fade-in";
	this.fadeTween = new Tween(this, 2.0, 'linear', { fadeness: 0.0 });
	this.fadeTween.start();
	this.choice = null;
	Threads.waitFor(Threads.createEntityThread(this));
	BGM.change(null);
	BGM.adjustVolume(1.0);
	return new Session();
};
