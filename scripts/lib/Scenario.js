/**
 * Scenario 3.2 for Sphere - (c) 2008-2013 Bruce Pascoe
 * An advanced cutscene engine that allows you to coordinate complex cutscenes using multiple
 * timelines and cooperative threading.
**/

var Scenario = Scenario || {};

// .defineCommand() function
// Registers a new cutscene command with Scenario.
// Arguments:
//     name: The name of the command. This should be a valid JavaScript identifier (alphanumeric, no spaces)
//     code: An object defining the command's callback functions:
//           .start(scene, state, ...): Called when the command begins executing to initialize the state, or for
//                                      instantaneous commands, perform the necessary action.
//           .update(scene, state):     Optional. If provided, called once per frame to maintain state variables.
//                                      If not provided, Scenario immediately moves on to the next command after
//                                      calling start(). This function should return true to keep the operation running,
//                                      or false to terminate it.
//           .render(scene, state):     Optional. If provided, called once per frame to perform any rendering
//                                      related to the command (e.g. text boxes).
//           .getInput(scene, state):   Optional. If provided, called once per frame while the command has the input
//                                      focus to check for player input and update the state accordingly.
Scenario.defineCommand = function(name, code)
{
	if (Scenario.prototype[name] != null) {
		Abort("Scenario.defineCommand():\nThe instruction name '" + name + "' is already in use.");
	}
	Scenario.prototype[name] = function() {
		var command = {};
		command.state = {};
		command.arguments = arguments;
		command.start = code.start;
		command.update = code.update;
		command.render = code.render;
		command.getInput = code.getInput;
		this.enqueue(command);
		return this;
	};
};

// Scenario() constructor
// Creates an object representing a scenario (cutscene definition)
function Scenario()
{
	this.createDelegate = function(o, method)
	{
		if (method == null) {
			return null;
		}
		return function() { return method.apply(o, arguments); };
	};
	
	this.createThread = function(state, updater, renderer, priority, inputHandler)
	{
		if (renderer === undefined) { renderer = null; }
		if (priority === undefined) { priority = 0; }
		if (inputHandler === undefined) { inputHandler = null; }
		var threadObject = {
			id:           this.nextThreadID,
			state:        state,
			priority:     priority,
			updater:      updater,
			renderer:     renderer,
			inputHandler: inputHandler
		};
		this.threads.push(threadObject);
		this.threads.sort(function(a, b) { return a.priority - b.priority; });
		if (inputHandler != null) {
			this.focusThreadStack.push(this.focusThread);
			this.focusThread = threadObject.id;
		}
		++this.nextThreadID;
		return threadObject.id;
	}
	
	this.createCommandThread = function(command)
	{
		var updater = this.createDelegate(this, command.update);
		var renderer = this.createDelegate(this, command.render);
		var inputHandler = this.createDelegate(this, command.getInput);
		return this.createThread(command.state, updater, renderer, 0, inputHandler);
	};
	
	this.createForkThread = function(state)
	{
		return this.createThread(state, this.createDelegate(this, this.updateFork));
	};
	
	this.isThreadRunning = function(id)
	{
		if (id == 0) {
			return false;
		}
		for (var i = 0; i < this.threads.length; ++i) {
			if (id == this.threads[i].id) {
				return true;
			}
		}
		return false;
	};
	
	this.killThread = function(id)
	{
		for (var i = 0; i < this.threads.length; ++i) {
			if (id == this.threads[i].id) {
				this.threads.splice(i, 1);
				--i; continue;
			}
		}
	};
	
	this.updateFork = function(scene, state)
	{
		for (var iFork = 0; iFork < state.forkThreads.length; ++iFork) {
			if (!scene.isThreadRunning(state.forkThreads[iFork])) {
				state.forkThreads.splice(iFork, 1);
				--iFork; continue;
			}
		}
		if (scene.isThreadRunning(state.currentCommandThread)) return true;
		if (state.commandQueue.length == 0 && state.forkThreads.length == 0) return false;
		if (state.commandQueue.length > 0) {
			var command = state.commandQueue.shift();
			if (command.start != null) {
				var parameters = [];
				parameters.push(scene);
				parameters.push(command.state);
				for (i = 0; i < command.arguments.length; ++i) {
					parameters.push(command.arguments[i]);
				}
				command.start.apply(command, parameters);
			}
			if (command.update != null) {
				state.currentCommandThread = scene.createCommandThread(command);
			} else {
				return true;
			}
		}
		return true;
	};
	
	this.enqueue = function(command)
	{
		this.currentQueue.push(command);
	};
	
	this.renderScene = function()
	{
		for (var iThread = 0; iThread < this.threads.length; ++iThread) {
			var renderer = this.threads[iThread].renderer;
			if (renderer != null) {
				renderer(this, this.threads[iThread].state);
			}
		}
	};
	
	this.updateScene = function()
	{
		for (var iThread = 0; iThread < this.threads.length; ++iThread) {
			var id = this.threads[iThread].id;
			var updater = this.threads[iThread].updater;
			var inputHandler = this.threads[iThread].inputHandler;
			var state = this.threads[iThread].state;
			if (updater == null) continue;
			if (!updater(this, state)) {
				if (this.focusThread == id) {
					this.focusThread = this.focusThreadStack.pop();
				}
				this.threads.splice(iThread, 1);
				--iThread; continue;
			}
			if (this.focusThread == id) {
				inputHandler(this, state);
			}
		}
	};
	
	this.currentQueue = [];
	this.queues = [];
	this.threads = [];
	this.nextThreadID = 1;
	this.focusThreadStack = [];
	this.focusThread = 0;
	this.forkThreadLists = [];
	this.currentForkThreadList = [];
	this.fadeMask = CreateColor(0, 0, 0, 0);
	this.isRunning = false;
}

// .beginFork() method
// Forks the timeline.
Scenario.prototype.beginFork = function()
{
	this.forkThreadLists.push(this.currentForkThreadList);
	this.currentForkThreadList = [];
	this.queues.push(this.currentQueue);
	this.currentQueue = [];
	return this;
};

// .endFork() method
// Marks the end of a forked timeline.
Scenario.prototype.endFork = function()
{
	var threadList = this.currentForkThreadList;
	this.currentForkThreadList = this.forkThreadLists.pop();
	var parentThreadList = this.currentForkThreadList;
	var command = {
		state: {},
		arguments: [ parentThreadList, threadList, this.currentQueue ],
		start: function(scene, state, threads, subthreads, queue) {
			var forkThreadState = {
				scene:                scene,
				commandQueue:         queue,
				currentCommandThread: 0,
				forkThreads:          subthreads
			};
			var thread = scene.createForkThread(forkThreadState);
			threads.push(thread);
		}
	};
	this.currentQueue = this.queues.pop();
	this.enqueue(command);
	return this;
};

// .synchronize() method
// Suspends the current timeline until all its forks have finished executing.
Scenario.prototype.synchronize = function()
{
	var command = {};
	command.state = {};
	command.arguments = [ this.currentForkThreadList ];
	command.start = function(scene, state, subthreads) {
		state.subthreads = subthreads;
	};
	command.update = function(scene, state) {
		return state.subthreads.length != 0;
	};
	this.enqueue(command);
	return this;
};

// .run() method
// Runs the scenario.
Scenario.prototype.run = function()
{
	if (!IsMapEngineRunning()) {
		Abort("Scenario.execute():\nCannot execute a scenario without an active map engine.");
	}
	if (this.isRunning) {
		return;
	}
	this.synchronize();
	if (!IsCameraAttached()) {
		var oldCameraX = GetCameraX();
		var oldCameraY = GetCameraY();
		this.beginFork();
			this.panTo(oldCameraX, oldCameraY);
		this.endFork();
	} else {
		var oldCameraTarget = GetCameraPerson();
		this.beginFork();
			this.followPerson(oldCameraTarget);
		this.endFork();
	}
	this.beginFork();
		this.fadeTo(CreateColor(0, 0, 0, 0));
	this.endFork();
	this.frameRate = GetMapEngineFrameRate();
	var oldPC = IsInputAttached() ? GetInputPerson() : null;
	DetachInput();
	var oldFrameRate = GetFrameRate();
	SetFrameRate(this.frameRate);
	this.isRunning = true;
	var fadeRenderer = function(scene, state) {
		ApplyColorMask(scene.fadeMask);
	}
	var fadeThread = this.createThread(null, null, fadeRenderer, -1);
	var state = {
		currentCommandThread: 0,
		commandQueue:         this.currentQueue,
		forkThreads:          this.currentForkThreadList
	};
	var mainThread = this.createForkThread(state);
	while (this.isThreadRunning(mainThread)) {
		RenderMap();
		this.renderScene();
		FlipScreen();
		UpdateMapEngine();
		this.updateScene();
	}
	SetFrameRate(oldFrameRate);
	if (oldPC != null) AttachInput(oldPC);
	this.killThread(fadeThread);
	this.isRunning = false;
};

// Register predefined commands
Scenario.defineCommand("call", {
	start: function(scene, state, method /*...*/) {
		method.apply(null, [].slice.call(arguments, 3));
	}
});

Scenario.defineCommand("facePerson", {
	start: function(scene, state, person, direction) {
		var faceCommand;
		switch (direction.toLowerCase()) {
			case "n": case "north":
				faceCommand = COMMAND_FACE_NORTH;
				break;
			case "ne": case "northeast":
				faceCommand = COMMAND_FACE_NORTHEAST;
				break;
			case "e": case "east":
				faceCommand = COMMAND_FACE_EAST;
				break;
			case "se": case "southeast":
				faceCommand = COMMAND_FACE_SOUTHEAST;
				break;
			case "s": case "south":
				faceCommand = COMMAND_FACE_SOUTH;
				break;
			case "sw": case "southwest":
				faceCommand = COMMAND_FACE_SOUTHWEST;
				break;
			case "w": case "west":
				faceCommand = COMMAND_FACE_WEST;
				break;
			case "nw": case "northwest":
				faceCommand = COMMAND_FACE_NORTHWEST;
				break;
			default:
				faceCommand = COMMAND_WAIT;
		}
		QueuePersonCommand(person, faceCommand, false);
	}
});

Scenario.defineCommand("fadeTo", {
	start: function(scene, state, color, duration) {
		if (duration === undefined) { duration = 0.25; }
		state.color = color;
		state.duration = duration;
		if (state.duration <= 0) scene.fadeMask = color;
		var multiplier = state.duration > 0 ? 1.0 / state.duration : 0;
		var fadeFromRGBA = [ scene.fadeMask.red, scene.fadeMask.green, scene.fadeMask.blue, scene.fadeMask.alpha ];
		var fadeToRGBA = [ state.color.red, state.color.green, state.color.blue, state.color.alpha ];
		state.interval = [];
		for (var i = 0; i < fadeToRGBA.length; ++i) {
			state.interval[i] = multiplier * (fadeToRGBA[i] - fadeFromRGBA[i]) / scene.frameRate;
		}
	},
	update: function(scene, state) {
		var currentRGBA = [ scene.fadeMask.red, scene.fadeMask.green, scene.fadeMask.blue, scene.fadeMask.alpha ];
		var fadeToRGBA = [ state.color.red, state.color.green, state.color.blue, state.color.alpha ];
		var newMaskRGBA = [];
		for (var i = 0; i < fadeToRGBA.length; ++i) {
			var newValue = currentRGBA[i] + state.interval[i];
			if (newValue > fadeToRGBA[i] && state.interval[i] > 0.0) {
				newValue = fadeToRGBA[i];
			} else if (newValue < fadeToRGBA[i] && state.interval[i] < 0.0) {
				newValue = fadeToRGBA[i];
			}
			newMaskRGBA[i] = newValue;
		}
		scene.fadeMask = CreateColor(newMaskRGBA[0], newMaskRGBA[1], newMaskRGBA[2], newMaskRGBA[3]);
		return state.color.red != scene.fadeMask.red
			|| state.color.green != scene.fadeMask.green
			|| state.color.blue != scene.fadeMask.blue
			|| state.color.alpha != scene.fadeMask.alpha;
	}
});

Scenario.defineCommand("focusOnPerson", {
	start: function(scene, state, person, duration) {
		if (duration === undefined) { duration = 0.25; }
		DetachCamera();
		state.targetXY = [ GetPersonX(person), GetPersonY(person) ];
		state.currentXY = duration > 0 ? [ GetCameraX(), GetCameraY() ] : state.targetXY;
		var multiplier = duration > 0 ? 1.0 / duration : 0.0;
		for (var i = 0; i < state.targetXY.length; ++i) {
			state.intervalXY[i] = multiplier * (state.targetXY[i] - state.currentXY[i]) / scene.frameRate;
		}
	},
	update: function(scene, state) {
		for (var i = 0; i < state.targetXY.length; ++i) {
			state.currentXY[i] += state.intervalXY[i];
			if (state.currentXY[i] > state.targetXY[i] && state.intervalXY[i] > 0.0) {
				state.currentXY[i] = state.targetXY[i];
			} else if (state.currentXY[i] < state.targetXY[i] && state.intervalXY[i] < 0.0) {
				state.currentXY[i] = state.targetXY[i];
			}
		}
		SetCameraX(state.currentXY[0]);
		SetCameraY(state.currentXY[1]);
		return state.currentXY[0] != state.targetXY[0] || state.currentXY[1] != state.targetXY[1];
	}
});

Scenario.defineCommand("followPerson", {
	start: function(scene, state, person) {
		state.person = person;
		state.targetXY = [ GetPersonX(state.person), GetPersonY(state.person) ];
		state.currentXY = [ GetCameraX(), GetCameraY() ];
		var panDuration = 0.25;
		var multiplier = 1.0 / panDuration;
		for (var i = 0; i < state.targetXY.length; ++i) {
			state.intervalXY[i] =  multiplier * (state.targetXY[i] - state.currentXY[i]) / scene.frameRate;
		}
	},
	update: function(scene, state) {
		for (var i = 0; i < state.targetXY.length; ++i) {
			state.currentXY[i] += state.intervalXY[i];
			if (state.currentXY[i] > state.targetXY[i] && state.intervalXY[i] > 0.0) {
				state.currentXY[i] = state.targetXY[i];
			} else if (state.currentXY[i] < state.targetXY[i] && state.intervalXY[i] < 0.0) {
				state.currentXY[i] = state.targetXY[i];
			}
		}
		SetCameraX(state.currentXY[0]);
		SetCameraY(state.currentXY[1]);
		if (state.currentXY[0] == state.targetXY[0] && state.currentXY[1] == state.targetXY[1]) {
			AttachCamera(state.person);
			return false;
		}
		return true;
	}
});

Scenario.defineCommand("hidePerson", {
	start: function(scene, state, person) {
		SetPersonVisible(person, false);
		IgnorePersonObstructions(person, true);
	}
});

Scenario.defineCommand("killPerson", {
	start: function(scene, state, person) {
		DestroyPerson(person);
	}
});

Scenario.defineCommand("marquee", {
	start: function(sceneState, state, text, color) {
		if (color === void null) { color = CreateColor(255, 255, 255, 255); }
		
		state.text = text;
		state.color = color;
		state.font = GetSystemFont();
		state.windowSize = GetScreenWidth() + state.font.getStringWidth(state.text);
		state.height = state.font.getHeight() + 10;
		state.textHeight = state.font.getHeight();
		state.fadeness = 0.0;
		state.scroll = 0.0;
		state.tweens = [
			new Tween(state, 0.25, 'linear', { fadeness: 1.0 }),
			new Tween(state, 1.0, 'easeOutExpo', { scroll: 0.5 }),
			new Tween(state, 1.0, 'easeInExpo', { scroll: 1.0 }),
			new Tween(state, 0.25, 'linear', { fadeness: 0.0 })
		];
		state.nextTweenID = 0;
		state.currentTween = null;
	},
	render: function(sceneState, state) {
		var boxHeight = state.height * state.fadeness;
		var boxY = GetScreenHeight() / 2 - boxHeight / 2;
		var textX = GetScreenWidth() - state.scroll * state.windowSize;
		var textY = boxY + boxHeight / 2 - state.textHeight / 2;
		OutlinedRectangle(-1, boxY - 1, GetScreenWidth() + 2, boxHeight + 2, CreateColor(0, 0, 0, 224 * state.fadeness));
		Rectangle(0, boxY, GetScreenWidth(), boxHeight, CreateColor(0, 0, 0, 192 * state.fadeness));
		state.font.setColorMask(CreateColor(0, 0, 0, state.color.alpha));
		state.font.drawText(textX + 1, textY + 1, state.text);
		state.font.setColorMask(state.color);
		state.font.drawText(textX, textY, state.text);
	},
	update: function(sceneState, state) {
		if (state.currentTween == null || state.currentTween.isFinished()) {
			if (state.nextTweenID < state.tweens.length) {
				state.currentTween = state.tweens[state.nextTweenID];
				state.currentTween.start();
				++state.nextTweenID;
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	}
});

Scenario.defineCommand("movePerson", {
	start: function(scene, state, person, direction, distance, speed, faceFirst) {
		if (faceFirst === undefined) { faceFirst = true };
		if (!isNaN(speed)) {
			speedVector = [ speed, speed ];
		} else {
			speedVector = speed;
		}
		state.person = person;
		state.oldSpeedVector = [ GetPersonSpeedX(person), GetPersonSpeedY(person) ];
		if (speedVector != null) {
			SetPersonSpeedXY(state.person, speedVector[0], speedVector[1]);
		} else {
			speedVector = state.oldSpeedVector;
		}
		var xMovement;
		var yMovement;
		var faceCommand;
		var stepCount;
		switch (direction) {
			case "n": case "north":
				faceCommand = COMMAND_FACE_NORTH;
				xMovement = COMMAND_WAIT;
				yMovement = COMMAND_MOVE_NORTH;
				stepCount = distance / speedVector[1];
				break;
			case "e": case "east":
				faceCommand = COMMAND_FACE_EAST;
				xMovement = COMMAND_MOVE_EAST;
				yMovement = COMMAND_WAIT;
				stepCount = distance / speedVector[0];
				break;
			case "s": case "south":
				faceCommand = COMMAND_FACE_SOUTH;
				xMovement = COMMAND_WAIT;
				yMovement = COMMAND_MOVE_SOUTH;
				stepCount = distance / speedVector[1];
				break;
			case "w": case "west":
				faceCommand = COMMAND_FACE_WEST;
				xMovement = COMMAND_MOVE_WEST;
				yMovement = COMMAND_WAIT;
				stepCount = distance / speedVector[0];
				break;
			default:
				faceCommand = COMMAND_WAIT;
				xMovement = COMMAND_WAIT;
				yMovement = COMMAND_WAIT;
				stepCount = 0;
		}
		if (faceFirst) {
			QueuePersonCommand(state.person, faceCommand, true);
		}
		for (iStep = 0; iStep < stepCount; ++iStep) {
			QueuePersonCommand(state.person, xMovement, true);
			QueuePersonCommand(state.person, yMovement, true);
			QueuePersonCommand(state.person, COMMAND_WAIT, false);
		}
		return true;
	},
	update: function(scene,state) {
		if (IsCommandQueueEmpty(state.person)) {
			SetPersonSpeedXY(state.person, state.oldSpeedVector[0], state.oldSpeedVector[1]);
			return false;
		}
		return true;
	}
});

Scenario.defineCommand("panTo", {
	start: function(scene, state, x, y, duration) {
		if (duration === undefined) { duration = 0.25; }
		state.targetXY = [ x, y ];
		DetachCamera();
		state.currentXY = duration != 0 ? [ GetCameraX(), GetCameraY() ] : state.targetXY;
		var multiplier = 1.0 / duration;
		state.intervalXY = [];
		for (var i = 0; i < state.targetXY.length; ++i) {
			state.intervalXY[i] = multiplier * (state.targetXY[i] - state.currentXY[i]) / scene.frameRate;
		}
		return true;
	},
	update: function(scene, state) {
		for (var i = 0; i < state.targetXY.length; ++i) {
			state.currentXY[i] += state.intervalXY[i];
			if (state.currentXY[i] > state.targetXY[i] && state.intervalXY[i] > 0.0) {
				state.currentXY[i] = state.targetXY[i];
			} else if (state.currentXY[i] < state.targetXY[i] && state.intervalXY[i] < 0.0) {
				state.currentXY[i] = state.targetXY[i];
			}
		}
		SetCameraX(state.currentXY[0]);
		SetCameraY(state.currentXY[1]);
		return state.currentXY[0] != state.targetXY[0] || state.currentXY[1] != state.targetXY[1];
	}
});

Scenario.defineCommand("pause", {
	start: function(scene, state, duration) {
		state.endTime = GetTime() + duration * 1000;
	},
	update: function(scene, state) {
		return GetTime() < state.endTime;
	}
});

Scenario.defineCommand("playSound", {
	start: function(scene, state, file) {
		state.sound = LoadSound(file);
		state.sound.play(false);
		return true;
	},
	update: function(scene, state) {
		return state.sound.isPlaying();
	}
});

Scenario.defineCommand("showPerson", {
	start: function(scene, state, person) {
		SetPersonVisible(person, true);
		IgnorePersonObstructions(person, false);
	}
});
