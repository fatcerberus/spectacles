/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// Engine object
// Represents the Spectacles game engine.
Engine = new (function()
{
	// .initialize() method
	// Initializes the Specs Engine.
	this.initialize = function(frameRate)
	{
		if (frameRate === undefined) { frameRate = 60; }
		SetFrameRate(frameRate);
		this.frameRate = frameRate;
	}
	
	// .showLogo() method
	// Momentarily displays a full-screen logo.
	// Arguments:
	//     imageName: The name of the image to display.
	//     duration:  The number of frames to keep the logo on-screen.
	this.showLogo = function(imageName, duration)
	{
		var titleCard = LoadImage("Logos/" + imageName + ".png");
		var fadeLevel = 1.0;
		while (fadeLevel > 0.0) {
			Threads.renderAll();
			titleCard.blit(0, 0);
			Rectangle(0, 0, 320, 240, CreateColor(0, 0, 0, fadeLevel * 255));
			FlipScreen();
			Threads.updateAll();
			fadeLevel = Math.max(fadeLevel - 1.0 / this.frameRate, 0.0);
		}
		for (var i = 0; i < duration; ++i) {
			Threads.renderAll();
			titleCard.blit(0, 0);
			FlipScreen();
			Threads.updateAll();
		}
		while (fadeLevel < 1.0) {
			Threads.renderAll();
			titleCard.blit(0, 0);
			Rectangle(0, 0, 320, 240, CreateColor(0, 0, 0, fadeLevel * 255));
			FlipScreen();
			Threads.updateAll();
			fadeLevel = Math.min(fadeLevel + 1.0 / this.frameRate, 1.0);
		}
	};
})();
