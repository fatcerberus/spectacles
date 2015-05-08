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
		frameRate = frameRate !== void null ? frameRate : 60;
		
		SetFrameRate(frameRate);
		this.frameRate = frameRate;
	}
	
	// .showLogo() method
	// Momentarily displays a full-screen logo.
	// Arguments:
	//     imageName: The file name of the image to display.
	//     duration:  The amount of time, in seconds, to keep the image on-screen.
	this.showLogo = function(imageName, duration)
	{
		var image = LoadImage("Logos/" + imageName + ".png");
		var scene = new mini.Scene()
			.fadeTo(CreateColor(0, 0, 0, 255), 0.0)
			.fadeTo(CreateColor(0, 0, 0, 0), 1.0)
			.pause(duration)
			.fadeTo(CreateColor(0, 0, 0, 255), 1.0)
			.run();
		mini.Threads.join(mini.Threads.doWith(scene, {
			update: function() { return this.isRunning(); },
			render: function() { image.blit(0, 0); }
		}));
		new mini.Scene()
			.fadeTo(CreateColor(0, 0, 0, 0), 0.0)
			.run(true);
	};
})();
