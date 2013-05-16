/**
 * Scenario 3.5.5 for Sphere - (c) 2008-2013 Bruce Pascoe
 * An advanced cutscene engine that allows you to coordinate complex cutscenes using multiple
 * timelines and cooperative threading.
**/

var Scenario = Scenario || {};

// .defineCommand() function
// Registers a new Scenario command.
// Arguments:
//     name: The name of the command. This should be a valid JavaScript identifier (alphanumeric, no spaces).
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
		Abort("Scenario.defineCommand(): The instruction name '" + name + "' is already in use!");
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

// .initialize() function
// Initializes the Scenario cutscene engine.
Scenario.initialize = function()
{
	this.activeScenes = [];
};

// .render() function
// Renders all active scenarios.
Scenario.render = function()
{
	for (var i = 0; i < Scenario.activeScenes.length; ++i) {
		this.activeScenes[i].renderScene();
	}
};

// .update() function
// Advances all active scenarios by one frame.
Scenario.update = function()
{
	for (var i = 0; i < this.activeScenes.length; ++i) {
		var scene = this.activeScenes[i];
		scene.updateScene();
		if (!scene.isRunning()) {
			scene.cleanUp();
			this.activeScenes.splice(i, 1);
			--i; continue;
		}
	}
};

// Scenario() constructor
// Creates an object representing a scenario (cutscene definition)
function Scenario()
{
	this.cleanUp = function()
	{
		this.killThread(this.fadeThread);
		this.finalizer
			.beginFork()
				.fadeTo(this.fadeMask, 0.0)
				.fadeTo(CreateColor(0, 0, 0, 0))
			.endFork()
			.run();
		this.finalizer.run();
	};
	
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

// .isRunning() method
// Determines whether a scenario is still running.
// Returns:
//     true if the scenario is still executing commands; false otherwise.
Scenario.prototype.isRunning = function()
{
	return this.isThreadRunning(this.mainThread);
};

// .run() method
// Runs the scenario.
Scenario.prototype.run = function()
{
	if (this.isRunning()) {
		return;
	}
	this.synchronize();
	this.finalizer = new Scenario();
	if (IsMapEngineRunning()) {
		if (!IsCameraAttached()) {
			var oldCameraX = GetCameraX();
			var oldCameraY = GetCameraY();
			this.finalizer
				.beginFork()
					.panTo(oldCameraX, oldCameraY)
				.endFork()
		} else {
			var oldCameraTarget = GetCameraPerson();
			this.finalizer
				.beginFork()
					.followPerson(oldCameraTarget)
				.endFork();
		}
	}
	this.synchronize();
	var fadeRenderer = function(scene, state) {
		ApplyColorMask(scene.fadeMask);
	}
	var fadeThread = this.createThread(null, null, fadeRenderer, -1);
	var state = {
		currentCommandThread: 0,
		commandQueue:         this.currentQueue,
		forkThreads:          this.currentForkThreadList
	};
	this.frameRate = IsMapEngineRunning() ? GetMapEngineFrameRate() : GetFrameRate();
	this.mainThread = this.createForkThread(state);
	Scenario.activeScenes.push(this);
	return this;
};

// .stop() method
// Immediately stops executing the scenario.
Scenario.prototype.stop = function()
{
	this.cleanUp();
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

// Register predefined commands
Scenario.defineCommand('call', {
	start: function(scene, state, method /*...*/) {
		method.apply(null, [].slice.call(arguments, 3));
	}
});

Scenario.defineCommand('facePerson',
{
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

Scenario.defineCommand('fadeTo',
{
	start: function(scene, state, color, duration) {
		if (duration === undefined) { duration = 0.25; }
		state.color = color;
		state.duration = duration;
		if (state.duration <= 0) {
			scene.fadeMask = color;
		}
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

Scenario.defineCommand('focusOnPerson',
{
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

Scenario.defineCommand('followPerson',
{
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

Scenario.defineCommand('hidePerson',
{
	start: function(scene, state, person) {
		SetPersonVisible(person, false);
		IgnorePersonObstructions(person, true);
	}
});

Scenario.defineCommand('killPerson',
{
	start: function(scene, state, person) {
		DestroyPerson(person);
	}
});

Scenario.defineCommand('marquee',
{
	start: function(sceneState, state, text, backgroundColor, color) {
		if (backgroundColor === void null) { backgroundColor = CreateColor(0, 0, 0, 255); }
		if (color === void null) { color = CreateColor(255, 255, 255, 255); }
		
		state.text = text;
		state.color = color;
		state.background = backgroundColor;
		state.font = GetSystemFont();
		state.windowSize = GetScreenWidth() + state.font.getStringWidth(state.text);
		state.height = state.font.getHeight() + 10;
		state.textHeight = state.font.getHeight();
		state.fadeness = 0.0;
		state.scroll = 0.0;
		state.animator = new Scenario()
			.tween(state, 0.25, 'linear', { fadeness: 1.0 })
			.tween(state, 1.0, 'easeOutExpo', { scroll: 0.5 })
			.tween(state, 1.0, 'easeInExpo', { scroll: 1.0 })
			.tween(state, 0.25, 'linear', { fadeness: 0.0 })
			.run();
	},
	render: function(sceneState, state) {
		var boxHeight = state.height * state.fadeness;
		var boxY = GetScreenHeight() / 2 - boxHeight / 2;
		var textX = GetScreenWidth() - state.scroll * state.windowSize;
		var textY = boxY + boxHeight / 2 - state.textHeight / 2;
		Rectangle(0, boxY, GetScreenWidth(), boxHeight, state.background);
		state.font.setColorMask(CreateColor(0, 0, 0, state.color.alpha));
		state.font.drawText(textX + 1, textY + 1, state.text);
		state.font.setColorMask(state.color);
		state.font.drawText(textX, textY, state.text);
	},
	update: function(sceneState, state) {
		return state.animator.isRunning();
	}
});

Scenario.defineCommand('movePerson',
{
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

Scenario.defineCommand('panTo',
{
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

Scenario.defineCommand('pause',
{
	start: function(scene, state, duration) {
		state.endTime = GetTime() + duration * 1000;
	},
	update: function(scene, state) {
		return GetTime() < state.endTime;
	}
});

Scenario.defineCommand('playSound',
{
	start: function(scene, state, file) {
		state.sound = LoadSound(file);
		state.sound.play(false);
		return true;
	},
	update: function(scene, state) {
		return state.sound.isPlaying();
	}
});

Scenario.defineCommand('showPerson',
{
	start: function(scene, state, person) {
		SetPersonVisible(person, true);
		IgnorePersonObstructions(person, false);
	}
});

Scenario.defineCommand('tween',
{
	start: function(scene, state, o, duration, easingType, endValues) {
		state.easers = {
			linear: function(t, b, c, d) {
				return c * t / d + b;
			},
			easeInQuad: function(t, b, c, d) {
				return c*(t/=d)*t + b;
			},
			easeOutQuad: function(t, b, c, d) {
				return -c *(t/=d)*(t-2) + b;
			},
			easeInOutQuad: function(t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t + b;
				return -c/2 * ((--t)*(t-2) - 1) + b;
			},
			easeInCubic: function(t, b, c, d) {
				return c*(t/=d)*t*t + b;
			},
			easeOutCubic: function(t, b, c, d) {
				return c*((t=t/d-1)*t*t + 1) + b;
			},
			easeInOutCubic: function(t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t*t + b;
				return c/2*((t-=2)*t*t + 2) + b;
			},
			easeInQuart: function(t, b, c, d) {
				return c*(t/=d)*t*t*t + b;
			},
			easeOutQuart: function(t, b, c, d) {
				return -c * ((t=t/d-1)*t*t*t - 1) + b;
			},
			easeInOutQuart: function(t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
				return -c/2 * ((t-=2)*t*t*t - 2) + b;
			},
			easeInQuint: function(t, b, c, d) {
				return c*(t/=d)*t*t*t*t + b;
			},
			easeOutQuint: function(t, b, c, d) {
				return c*((t=t/d-1)*t*t*t*t + 1) + b;
			},
			easeInOutQuint: function(t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
				return c/2*((t-=2)*t*t*t*t + 2) + b;
			},
			easeInSine: function(t, b, c, d) {
				return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
			},
			easeOutSine: function(t, b, c, d) {
				return c * Math.sin(t/d * (Math.PI/2)) + b;
			},
			easeInOutSine: function(t, b, c, d) {
				return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
			},
			easeInExpo: function(t, b, c, d) {
				return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
			},
			easeOutExpo: function(t, b, c, d) {
				return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
			},
			easeInOutExpo: function(t, b, c, d) {
				if (t==0) return b;
				if (t==d) return b+c;
				if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
				return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
			},
			easeInCirc: function(t, b, c, d) {
				return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
			},
			easeOutCirc: function(t, b, c, d) {
				return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
			},
			easeInOutCirc: function(t, b, c, d) {
				if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
				return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
			},
			easeInElastic: function(t, b, c, d) {
				var s=1.70158;var p=0;var a=c;
				if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
				if (a < Math.abs(c)) { a=c; var s=p/4; }
				else var s = p/(2*Math.PI) * Math.asin (c/a);
				return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
			},
			easeOutElastic: function(t, b, c, d) {
				var s=1.70158;var p=0;var a=c;
				if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
				if (a < Math.abs(c)) { a=c; var s=p/4; }
				else var s = p/(2*Math.PI) * Math.asin (c/a);
				return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
			},
			easeInOutElastic: function(t, b, c, d) {
				var s=1.70158;var p=0;var a=c;
				if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
				if (a < Math.abs(c)) { a=c; var s=p/4; }
				else var s = p/(2*Math.PI) * Math.asin (c/a);
				if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
				return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
			},
			easeInBack: function(t, b, c, d, s) {
				if (s == undefined) s = 1.70158;
				return c*(t/=d)*t*((s+1)*t - s) + b;
			},
			easeOutBack: function(t, b, c, d, s) {
				if (s == undefined) s = 1.70158;
				return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
			},
			easeInOutBack: function(t, b, c, d, s) {
				if (s == undefined) s = 1.70158; 
				if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
				return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
			},
			easeInBounce: function(t, b, c, d) {
				return c - this.easeOutBounce(d-t, 0, c, d) + b;
			},
			easeOutBounce: function(t, b, c, d) {
				if ((t/=d) < (1/2.75)) {
					return c*(7.5625*t*t) + b;
				} else if (t < (2/2.75)) {
					return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
				} else if (t < (2.5/2.75)) {
					return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
				} else {
					return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
				}
			},
			easeInOutBounce: function(t, b, c, d) {
				if (t < d/2) return this.easeInBounce(t*2, 0, c, d) * .5 + b;
				return this.easeOutBounce(t*2-d, 0, c, d) * .5 + c*.5 + b;
			}
		};
		state.change = {};
		state.duration = duration;
		state.elapsed = 0.0;
		state.object = o;
		state.startValues = {};
		state.type = easingType in state.easers ? easingType : 'linear';
		for (var p in endValues) {
			state.change[p] = endValues[p] - o[p];
			state.startValues[p] = o[p];
		}
	},
	update: function(scene, state) {
		state.elapsed += 1.0 / scene.frameRate;
		for (var p in state.change) {
			if (state.elapsed < state.duration) {
				state.object[p] = state.easers[state.type](state.elapsed, state.startValues[p], state.change[p], state.duration);
			} else {
				state.object[p] = state.startValues[p] + state.change[p];
			}
		}
		return state.elapsed < state.duration;
	},
});
