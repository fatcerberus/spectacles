/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireSystemScript('link.js');

// Threads object
// Represents the thread manager.
Threads = new (function()
{
	this.isInitialized = false;
	this.hasUpdated = false;
	this.nextThreadID = 1;
	this.threads = [];
	this.useRenderMap = true;
	this.useUpdateMap = true;
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
	this.isInitialized = true;
}

// .create() method
// Creates an entity thread. This is the recommended method for
// creating persistent threads.
// Arguments:
//     entity:   The object for which to create the thread. This object's .update() method
//               will be called once per frame, along with .render() and .getInput() if they
//               exist, until .update() returns false.
//     priority: Optional. The render priority for the new thread. Higher-priority threads are rendered
//               later in a frame than lower-priority ones. Ignored if no renderer is provided. (default: 0)
Threads.create = function(entity, priority)
{
	priority = priority !== undefined ? priority : 0;
	
	var updater = entity.update;
	var renderer = (typeof entity.render === 'function') ? entity.render : null;
	var inputHandler = (typeof entity.getInput === 'function') ? entity.getInput : null;
	var threadDesc = {
		priority: priority,
		update: entity.update
	};
	if (typeof entity.render === 'function')
		threadDesc.render = entity.render;
	if (typeof entity.getInput === 'function')
		threadDesc.getInput = entity.getInput;
	return this.createEx(entity, threadDesc);
};

// .createEx() method
// Creates a thread and begins running it.
// Arguments:
//     o:          The object to pass as 'this' to the updater/renderer/input handler. May be null.
//     threadDesc: An object describing the thread. This should contain the following members:
//                     update:   The update function for the new thread.
//                     render:   Optional. The render function for the new thread.
//                     getInput: Optional. The input handler for the new thread.
//                     priority: Optional. The render priority for the new thread. Higher-priority threads
//                               are rendered later in a frame than lower-priority ones. Ignored if no
//                               renderer is provided. (default: 0)
// Remarks:
//     This is for advanced thread creation. For typical use, it is recommended to use
//     Threads.create() instead.
Threads.createEx = function(o, threadDesc)
{
	updater = threadDesc.update.bind(o);
	renderer = 'render' in threadDesc ? threadDesc.render.bind(o) : null;
	inputHandler = 'getInput' in threadDesc ? threadDesc.getInput.bind(o) : null;
	priority = 'priority' in threadDesc ? threadDesc.priority : 0;
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

// .isRunning() method
// Determines whether a thread is still running.
// Arguments:
//     threadID: The ID of the thread to check.
Threads.isRunning = function(threadID)
{
	if (threadID == 0) return false;
	for (var i = 0; i < this.threads.length; ++i) {
		if (this.threads[i].id == threadID) {
			return true;
		}
	}
	return false;
};

// .enableMapRender() method
// Sets whether the map should be rendered when blocking.
Threads.enableMapRender = function(isEnabled)
{
	this.useRenderMap = isEnabled;
};

// .enableMapUpdate() method
// Specifies whether map engine updates will happen when blocking.
Threads.enableMapUpdate = function(isEnabled)
{
	this.useUpdateMap = isEnabled;
};

// .join() method
// Blocks until one or more threads have terminated.
// Arguments:
//     threadID: Either a single thread ID or an array of them.
Threads.join = function(threadIDs)
{
	threadIDs = threadIDs instanceof Array ? threadIDs : [ threadIDs ];
	var isFinished = false;
	while (!isFinished) {
		this.doFrame();
		isFinished = true;
		for (var i = 0; i < threadIDs.length; ++i) {
			isFinished = isFinished && !this.isRunning(threadIDs[i]);
		}
	}
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
	var sortedThreads = [];
	for (var i = 0; i < this.threads.length; ++i) {
		sortedThreads.push(this.threads[i]);
	}
	sortedThreads.sort(this.threadSorter);
	for (var i = 0; i < sortedThreads.length; ++i) {
		var thread = sortedThreads[i];
		if (!thread.isValid || thread.renderer === null)
			continue;
		thread.renderer();
	}
};

// .updateAll() method
// Updates all active threads for the next frame.
Threads.updateAll = function()
{
	var threadsEnding = [];
	Link(Link(this.threads).sort(this.threadSorter))
		.where(function(thread) { return thread.isValid })
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
		if (this.useUpdateMap) {
			UpdateMapEngine();
		}
		if (!this.hasUpdated) {
			this.updateAll();
		}
	} else {
		this.updateAll();
	}
};
