/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Fader.js");
RequireScript("Core/Threads.js");

// BGM object
// Represents the background music (BGM) manager.
BGM = new (function()
{
	this.currentTrack = null;
	this.defaultTrack = null;
	this.isOverridden = false;
	this.oldStream = null;
	this.stream = null;
	
	// .initialize() method
	// Initializes the BGM manager.
	this.initialize = function()
	{
		this.volumeFader = new Fader();
		Threads.createEntityThread(this);
		this.volume = 1.0;
	};
	
	// .adjustVolume() method
	// Smoothly adjusts the volume of the BGM.
	// Arguments:
	//     newVolume:    The new volume level, between 0.0 and 1.0 inclusive.
	//     fadeDuration: Optional. The number of frames over which to perform the adjustment.
	//                   Defaults to 60 (1 second).
	this.adjustVolume = function(newVolume, fadeDuration)
	{
		if (fadeDuration === undefined) { fadeDuration = 60; }
		
		newVolume = newVolume < 0.0 ? 0.0 : newVolume;
		newVolume = newVolume > 1.0 ? 1.0 : newVolume;
		if (fadeDuration > 0) {
			this.volumeFader.adjust(newVolume, fadeDuration);
		} else {
			if (this.stream != null) {
				this.stream.setVolume(newVolume * 255);
			}
			this.volumeFader.value = newVolume;
		}
	};
	
	// .override() method
	// Overrides the BGM with the specified track. The previous BGM can be restored by
	// calling .reset().
	// Arguments:
	//     trackName: Required. The name of the track to play.
	this.override = function(trackName)
	{
		this.isOverridden = true;
		this.oldStream = this.stream;
		if (this.oldStream != null) {
			this.oldStream.pause();
		}
		this.currentTrack = trackName;
		this.playTrack(this.currentTrack);
	};
	
	// .playTrack() method
	// Loads and plays a BGM track.
	// Arguments:
	//     filename: The name of the track to play, or null for silence.
	this.playTrack = function(trackName)
	{
		if (this.stream !== null) {
			this.stream.stop();
		}
		if (trackName !== null) {
			this.stream = LoadSound("BGM/" + trackName + ".ogg", true);
			this.stream.setVolume(this.volumeFader.value * 255);
			if (!DBG_DISABLE_BGM) this.stream.play(true);
		} else {
			this.stream = null;
		}
	};
	
	// .reset() method
	// Restores normal BGM manager behavior after an override.
	this.reset = function()
	{
		if (!this.isOverridden) {
			return;
		}
		this.isOverridden = false;
		this.currentTrack = this.defaultTrack;
		if (this.oldStream == null) {
			this.playTrack(this.currentTrack);
		} else {
			this.stream.stop();
			this.oldStream.play();
			this.stream = this.oldStream;
		}
	};
	
	// .update() method
	// Manages volume adjustment operations. This method should be called once per frame.
	this.update = function()
	{
		if (this.stream != null) {
			this.stream.setVolume(this.volumeFader.value * 255);
		}
		if (this.oldStream != null) {
			this.oldStream.setVolume(this.volumeFader.value * 255);
		}
		return true;
	};
	
	// .track property
	// Sets or returns the current BGM track.
	this.track getter = function()
	{
		return this.defaultTrack;
	};
	
	this.track setter = function(value)
	{
		if (!this.isOverridden) {
			if (value != this.currentTrack) {
				this.defaultTrack = value;
				this.currentTrack = this.defaultTrack;
				this.playTrack(this.currentTrack);
			}
		} else {
			this.defaultTrack = value;
			if (this.oldStream != null)
			{
				this.oldStream.stop();
				this.oldStream = null;
			}
		}
	};
	
	// .volume property
	// Gets or sets the current BGM volume level.
	this.volume getter = function()
	{
		return this.volumeFader.value;
	};
	
	this.volume setter = function(value)
	{
		this.volumeFader.value = value;
		if (this.stream != null) {
			this.stream.setVolume(value * 255);
		}
		if (this.oldStream != null) {
			this.oldStream.setVolume(value * 255);
		}
	};
})();
