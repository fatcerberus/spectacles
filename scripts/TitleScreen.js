/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Core/Fader.js");
RequireScript("MenuStrip.js");

function TitleScreen(themeTrack)
{
	this.render = function() {
		this.image.blit(0, 0);
		ApplyColorMask(CreateColor(0, 0, 0, (1.0 - this.fader.value) * 255));
	};
	this.update = function() {
		switch (this.mode) {
			case "fade-in":
				if (this.fader.value >= 1.0) {
					this.mode = "idle";
				}
				break;
			case "fade-out":
				if (this.fader.value <= 0.0) {
					this.mode = "finish";
				}
				break;
			case "finish":
				return false;
		}
		return true;
	};
	
	this.image = LoadImage("TitleScreen.png");
	this.fader = new Fader();
	this.themeTrack = themeTrack;
}

TitleScreen.prototype.show = function()
{
	BGM.track = this.themeTrack;
	this.mode = "fade-in";
	this.fader.value = 0.0;
	this.fader.adjust(1.0, 2.0 * Engine.frameRate);
	var thread = Threads.createEntityThread(this);
	var choice = new MenuStrip("Tech Demo", false, [ "Start Demo", "Quit" ]).open();
	BGM.adjustVolume(0.0, 2.0 * Engine.frameRate);
	this.mode = "fade-out";
	this.fader.adjust(0.0, 2.0 * Engine.frameRate);
	Threads.waitFor(thread);
	this.fader.dispose();
	BGM.track = null;
	BGM.volume = 1.0;
	return choice;
};
