/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// BGM object
// Represents the background music manager.
BGM = new (function()
{
	this.adjuster = null;
	this.currentTrack = null;
	this.defaultTrack = null;
	this.isOverridden = false;
	this.oldStream = null;
	this.stream = null;
	this.volume = 1.0;
	
	// .initialize() method
	// Starts up the BGM manager.
	this.initialize = function()
	{
		mini.Threads.create(this);
	};
	
	// .adjustVolume() method
	// Smoothly adjusts the volume of the BGM.
	// Arguments:
	//     newVolume: The new volume level, between 0.0 and 1.0 inclusive.
	//     duration:  Optional. The length of time, in seconds, over which to perform the adjustment.
	//                (default: 0.0).
	this.adjustVolume = function(newVolume, duration)
	{
		duration = duration !== void null ? duration : 0.0;
		
		if (DBG_DISABLE_BGM) return;
		newVolume = Math.min(Math.max(newVolume, 0.0), 1.0);
		if (this.adjuster != null && this.adjuster.isRunning()) {
			this.adjuster.stop();
		}
		if (duration > 0.0) {
			this.adjuster = new mini.Scene()
				.tween(this, duration, 'linear', { volume: newVolume })
				.run();
		} else {
			this.volume = newVolume;
			if (this.stream != null) {
				this.stream.setVolume(this.volume * 255);
			}
		}
	};
	
	// .change() method
	// Changes the current default BGM.
	// Arguments:
	//     trackName: The file name of the BGM track to play, minus extension.
	// Remarks:
	//     This has no immediate effect if an override is active; however, the change is still acknowledged
	//     and the specified track will be played when .reset() is called.
	this.change = function(trackName)
	{
		if (!this.isOverridden) {
			if (trackName != this.currentTrack) {
				this.defaultTrack = trackName;
				this.currentTrack = this.defaultTrack;
				this.playTrack(this.currentTrack);
			}
		} else {
			this.defaultTrack = trackName;
			if (this.oldStream != null) {
				this.oldStream.stop();
				this.oldStream = null;
			}
		}
	}
	
	// .isAdjusting() method
	// Determines whether or not the BGM volume level is being adjusted.
	// Returns:
	//     true if the volume level is actively being adjusted; false otherwise.
	this.isAdjusting = function()
	{
		return this.adjuster != null && this.adjuster.isRunning();
	};
	
	// .override() method
	// Overrides the BGM with the specified track. The default BGM can be restored by
	// calling .reset().
	// Arguments:
	//     trackName: The file name of the BGM track to play, minus extension.
	this.override = function(trackName)
	{
		if (!this.isOverridden) {
			this.isOverridden = true;
			this.oldStream = this.stream;
			if (this.oldStream !== null) {
				this.oldStream.pause();
			}
			this.currentTrack = trackName;
			this.playTrack(this.currentTrack);
		} else {
			if (this.currentTrack !== trackName) {
				this.currentTrack = trackName;
				this.playTrack(this.currentTrack);
			}
		}
	};
	
	// .playTrack() method
	// Loads and plays a specified BGM track.
	// Arguments:
	//     trackName: The file name, minus extension, of the BGM to play.
	// Remarks:
	//     The track to play must be in Ogg Vorbis format and stored in the
	//     sounds/BGM subdirectory.
	this.playTrack = function(trackName)
	{
		if (this.stream !== null) {
			this.stream.stop();
		}
		if (trackName !== null) {
			Console.writeLine("Playing BGM " + trackName);
			Console.append("vol: ~" + Math.floor(this.volume * 100) + "%");
			this.stream = LoadSound("BGM/" + trackName + ".ogg", true);
			this.stream.setVolume(this.volume * 255);
			if (!DBG_DISABLE_BGM) this.stream.play(true);
		} else {
			Console.writeLine("BGM has been stopped");
			this.stream = null;
		}
	};
	
	// .reset() method
	// Restarts the default BGM after an override.
	this.reset = function()
	{
		if (!this.isOverridden) {
			return;
		}
		this.isOverridden = false;
		this.currentTrack = this.defaultTrack;
		if (this.oldStream === null) {
			this.playTrack(this.currentTrack);
		} else {
			this.stream.stop();
			this.oldStream.play();
			this.stream = this.oldStream;
		}
	};
	
	// .update() method
	// Updates the BGM manager for the next frame.
	this.update = function()
	{
		if (this.stream != null) {
			this.stream.setVolume(this.volume * 255);
		}
		if (this.oldStream != null) {
			this.oldStream.setVolume(this.volume * 255);
		}
		return true;
	};
})();
