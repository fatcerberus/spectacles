/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

if (typeof IsSkippedFrame === 'undefined') {
	IsSkippedFrame = function() { return false; }
}

// Threads object
// Represents the Specs Engine thread manager.
Threads = new (function()
{
	this.hasUpdated = false;
	this.nextThreadID = 1;
	this.threads = [];
	this.useRenderMap = true;
})();

// .initialize() method
// Initializes the thread manager.
Threads.initialize = function()
{
	this.threadSorter = function(a, b) {
		return a.priority != b.priority ?
			a.priority - b.priority :
			a.id - b.id;
	};
	SetUpdateScript('Threads.updateAll();');
	SetRenderScript('Threads.renderAll();');
}

// .create() method
// Creates a thread and begins running it.
// Arguments:
//     o:            The object to pass as 'this' to the updater/renderer/input handler. May be null.
//     updater:      The update function for the new thread.
//     renderer:     Optional. The render function for the new thread.
//     priority:     Optional. The render priority for the new thread. Higher-priority threads are rendered
//                   later in a frame than lower-priority ones. Ignored if no renderer is provided. (default: 0)
//     inputHandler: Optional. The input handler for the new thread.
Threads.create = function(o, updater, renderer, priority, inputHandler)
{
	renderer = renderer !== void null ? renderer : null;
	inputHandler = inputHandler !== void null ? inputHandler : null;
	priority = priority !== void null ? priority : 0;
	
	updater = updater.bind(o);
	renderer = renderer !== null ? renderer.bind(o) : null;
	inputHandler = inputHandler !== null ? inputHandler.bind(o) : null;
	var newThread = {
		id: this.nextThreadID,
		isValid: true,
		inputHandler: inputHandler,
		isUpdating: false,
		priority: priority,
		renderer: renderer,
		updater: updater
	};
	this.threads.push(newThread);
	++this.nextThreadID;
	return newThread.id;
};

// .createEntityThread() method
// Creates a thread for a specified entity.
// Arguments:
//     entity:   The entity for which to create the thread. This should be an object having .update() and
//               optionally, .render() and .getInput() methods. Each of these will be called once
//               per frame until the thread either finishes (entity.update() returns false) or is terminated.
//     priority: Optional. The render priority for the new thread. Higher-priority threads are rendered
//               later in a frame than lower-priority ones. Ignored if no renderer is provided. (default: 0)
Threads.createEntityThread = function(entity, priority)
{
	priority = priority !== void null ? priority : 0;
	
	var updater = entity.update;
	var renderer = (typeof entity.render === 'function') ? entity.render : null;
	var inputHandler = (typeof entity.getInput === 'function') ? entity.getInput : null;
	return this.create(entity, updater, renderer, priority, inputHandler);
};

// .doFrame() method
// Performs update and render processing for a single frame.
Threads.doFrame = function()
{
	if (this.useRenderMap && IsMapEngineRunning())
		RenderMap();
	else
		this.renderAll();
	FlipScreen();
	if (IsMapEngineRunning()) {
		this.hasUpdated = false;
		UpdateMapEngine();
		if (!this.hasUpdated) {
			this.updateAll();
		}
	} else {
		this.updateAll();
	}
};

// .doWith() method
// Creates an improvised thread running in the context of a specified object.
// Arguments:
//     o:            The object to pass as 'this' to the updater/renderer.
//     updater:      The update function for the new thread.
//     renderer:     Optional. The render function for the new thread.
//     priority:     Optional. The render priority for the new thread. Higher-priority threads are rendered
//                   later in a frame (closer to the player) than lower-priority ones. (default: 0)
//     inputHandler: Optional. The input handler for the new thread.
Threads.doWith = function(o, updater, renderer, priority, inputHandler)
{
	return this.create(o, updater, renderer, priority, inputHandler);
};

// .enableRenderMap() method
// Enables or disables map rendering while waiting on a thread.
Threads.enableRenderMap = function(isEnabled)
{
	this.useRenderMap = isEnabled;
};

// .isRunning() method
// Determines whether a thread is still running.
// Arguments:
//     threadID: The ID of the thread to check.
Threads.isRunning = function(threadID)
{
	if (threadID === 0) {
		return false;
	}
	for (var i = 0; i < this.threads.length; ++i) {
		if (this.threads[i].id == threadID) {
			return true;
		}
	}
	return false;
};

// .kill() method
// Prematurely terminates a thread.
// Arguments:
//     threadID: The ID of the thread to terminate.
Threads.kill = function(threadID)
{
	for (var i = 0; i < this.threads.length; ++i) {
		if (threadID == this.threads[i].id) {
			this.threads[i].isValid = false;
			this.threads.splice(i, 1);
			--i;
		}
	}
};

// .renderAll() method
// Renders the current frame by calling all active threads' renderers.
Threads.renderAll = function()
{
	if (IsSkippedFrame()) return;
	Link(Link(this.threads).sort(this.threadSorter))
		.where(function(thread) { return thread.isValid; })
		.where(function(thread) { return thread.renderer !== null })
		.each(function(thread)
	{
		thread.renderer();
	});
};

// .synchronize() method
// Waits for multiple threads to finish.
// Arguments:
//     threadIDs: An array of thread IDs specifying the threads to wait for.
Threads.synchronize = function(threadIDs)
{
	var isFinished;
	do {
		this.doFrame();
		isFinished = true;
		for (var i = 0; i < threadIDs.length; ++i) {
			isFinished = isFinished && !this.isRunning(threadIDs[i]);
		}
	} while (!isFinished);
};

// .updateAll() method
// Updates all active threads for the next frame.
Threads.updateAll = function()
{
	var threadsEnding = [];
	Link(Link(this.threads).sort(this.threadSorter))
		.where(function(thread) { return thread.isValid; })
		.each(function(thread)
	{
		var stillRunning = true;
		if (!thread.isUpdating) {
			thread.isUpdating = true;
			stillRunning = thread.updater();
			if (thread.inputHandler !== null && stillRunning) {
				thread.inputHandler();
			}
			thread.isUpdating = false;
		}
		if (!stillRunning) {
			threadsEnding.push(thread.id);
		}
	});
	for (var i = 0; i < threadsEnding.length; ++i) {
		this.kill(threadsEnding[i]);
	}
	this.hasUpdated = true;
};

// .waitFor() method
// Waits for a thread to terminate.
// Arguments:
//     threadID: The ID of the thread to wait for.
Threads.waitFor = function(threadID)
{
	var i = 0;
	while (this.isRunning(threadID)) {
		this.doFrame();
	}
};
