/**
 * Scenario 3.6 for Sphere - (c) 2008-2013 Bruce Pascoe
 * An advanced scene manager that allows you to coordinate complex sequences using multiple
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

// .renderAll() function
// Renders all active scenarios.
Scenario.renderAll = function()
{
	for (var i = 0; i < Scenario.activeScenes.length; ++i) {
		this.activeScenes[i].render();
	}
	ApplyColorMask(Scenario.screenMask);
};

// .updateAll() function
// Updates all active scenarios for the next frame.
Scenario.updateAll = function()
{
	for (var i = 0; i < this.activeScenes.length; ++i) {
		var scene = this.activeScenes[i];
		scene.update();
		if (!scene.isRunning()) {
			if (scene.isLooping) {
				scene.run(false);
			}
			this.activeScenes.splice(i, 1);
			--i; continue;
		}
	}
	Scenario.hasUpdated = true;
};

Scenario.hasUpdated = false;
Scenario.screenMask = CreateColor(0, 0, 0, 0);

// Scenario() constructor
// Creates an object representing a scenario (cutscene definition)
// Arguments:
//     isLooping: If true, the scenario loops endlessly until .stop() is called. (default: false)
function Scenario(isLooping)
{
	isLooping = isLooping !== void null ? isLooping : false;
	
	this.currentForkThreadList = [];
	this.currentQueue = [];
	this.focusThreadStack = [];
	this.focusThread = 0;
	this.forkThreadLists = [];
	this.isLooping = isLooping;
	this.nextThreadID = 1;
	this.openBlocks = [];
	this.queues = [];
	this.threads = [];
	
	this.createDelegate = function(o, method) {
		if (method == null) {
			return null;
		}
		return function() { return method.apply(o, arguments); };
	};
	this.createThread = function(state, updater, renderer, priority, inputHandler) {
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
	};
	this.createCommandThread = function(command) {
		var updater = this.createDelegate(this, command.update);
		var renderer = this.createDelegate(this, command.render);
		var inputHandler = this.createDelegate(this, command.getInput);
		return this.createThread(command.state, updater, renderer, 0, inputHandler);
	};
	this.createForkThread = function(state) {
		return this.createThread(state, this.createDelegate(this, this.updateFork));
	};
	this.isThreadRunning = function(id) {
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
	this.killThread = function(id) {
		for (var i = 0; i < this.threads.length; ++i) {
			if (id == this.threads[i].id) {
				this.threads.splice(i, 1);
				--i; continue;
			}
		}
	};
	this.throwError = function(component, name, message) {
		Abort(component + " - error: " + name + "\n" + message);
	};
	this.updateFork = function(scene, state) {
		for (var i = 0; i < state.forkThreads.length; ++i) {
			if (!scene.isThreadRunning(state.forkThreads[i])) {
				state.forkThreads.splice(i, 1);
				--i; continue;
			}
		}
		if (scene.isThreadRunning(state.currentCommandThread)) {
			return true;
		}
		if (state.counter >= state.commandQueue.length && state.forkThreads.length == 0) {
			return false;
		}
		if (state.counter < state.commandQueue.length) {
			var command = state.commandQueue[state.counter];
			++state.counter;
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
			}
		}
		return true;
	};
	this.enqueue = function(command) {
		this.currentQueue.push(command);
	};
	this.render = function() {
		for (var i = 0; i < this.threads.length; ++i) {
			var renderer = this.threads[i].renderer;
			if (renderer != null) {
				renderer(this, this.threads[i].state);
			}
		}
	};
	this.update = function() {
		for (var i = 0; i < this.threads.length; ++i) {
			var id = this.threads[i].id;
			var updater = this.threads[i].updater;
			var inputHandler = this.threads[i].inputHandler;
			var state = this.threads[i].state;
			if (updater == null) continue;
			if (!updater(this, state)) {
				if (this.focusThread == id) {
					this.focusThread = this.focusThreadStack.pop();
				}
				this.threads.splice(i, 1);
				--i; continue;
			}
			if (this.focusThread == id) {
				inputHandler(this, state);
			}
		}
	};
}

// .fork() method
// Forks the timeline.
Scenario.prototype.fork = function()
{
	this.forkThreadLists.push(this.currentForkThreadList);
	this.currentForkThreadList = [];
	this.queues.push(this.currentQueue);
	this.currentQueue = [];
	this.openBlocks.push('fork');
	return this;
};

// .end() method
// Ends an block of commands.
Scenario.prototype.end = function()
{
	if (this.openBlocks.length == 0) {
		this.throwError("Scenario.end()", "Malformed scene", "There are no blocks currently open.");
	}
	var openBlockType = this.openBlocks.pop();
	if (openBlockType == 'fork') {
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
					forkThreads:          subthreads,
					counter:              0
				};
				var thread = scene.createForkThread(forkThreadState);
				threads.push(thread);
			}
		};
		this.currentQueue = this.queues.pop();
		this.enqueue(command);
	} else {
		this.throwError("Scenario.end()", "Internal error", "The type of the block is unknown.");
	}
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
// Arguments:
//     waitUntilDone: Optional. If true, prevents .run() from returning until the scenario has finished executing.
//                    Otherwise, .run() returns immediately. (default: false)
// Remarks:
//     waitUntilDone should be used with care. If .run() is called during a map engine update with waitUntilDone set to true,
//     the update script will be blocked from running until the scenario is finished. While Scenario itself won't deadlock,
//     anything else called by your update script won't run until the scenario has finished. For this reason, it is strongly
//     recommended to implement your own wait logic.
Scenario.prototype.run = function(waitUntilDone)
{
	waitUntilDone = waitUntilDone !== void null ? waitUntilDone : false;
	
	if (this.openBlocks.length > 0) {
		this.throwError("Scenario.run()", "Malformed scene", "Caller attempted to run a scene with unclosed blocks.");
	}
	if (this.isLooping && waitUntilDone) {
		this.throwError("Scenario.run()", "Invalid argument", "Caller attempted to wait for a looping scenario. This would have created an infinite loop and has been prevented.");
	}
	
	if (this.isRunning()) {
		return;
	}
	this.synchronize();
	var mainThreadState = {
		currentCommandThread: 0,
		commandQueue:         this.currentQueue,
		forkThreads:          this.currentForkThreadList,
		counter:              0
	};
	this.frameRate = IsMapEngineRunning() ? GetMapEngineFrameRate() : GetFrameRate();
	this.mainThread = this.createForkThread(mainThreadState);
	Scenario.activeScenes.push(this);
	if (waitUntilDone) {
		var currentFPS = GetFrameRate();
		if (IsMapEngineRunning()) {
			SetFrameRate(GetMapEngineFrameRate());
		}
		while (this.isRunning()) {
			if (IsMapEngineRunning()) {
				RenderMap();
				FlipScreen();
				Scenario.hasUpdated = false;
				UpdateMapEngine();
				if (!Scenario.hasUpdated) {
					Scenario.updateAll();
				}
			} else {
				Scenario.renderAll();
				FlipScreen();
				Scenario.updateAll();
			}
		}
		SetFrameRate(currentFPS);
	}
	return this;
};

// .stop() method
// Immediately stops executing the scenario.
Scenario.prototype.stop = function()
{
	this.killThread(this.mainThread);
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
		duration = duration !== void null ? duration : 0.25;
		
		var colorInfo = { red:color.red, green:color.green, blue:color.blue, alpha:color.alpha };
		state.fader = new Scenario()
			.tween(Scenario.screenMask, duration, 'linear', colorInfo)
			.run();
	},
	update: function(scene, state) {
		return state.fader.isRunning();
	}
});

Scenario.defineCommand('focusOnPerson',
{
	start: function(scene, state, person, duration) {
		duration = duration !== void null ? duration : 0.25;
		
		this.panner = new Scenario()
			.panTo(GetPersonX(person), GetPersonY(person), duration)
			.run();
	},
	update: function(scene, state) {
		return state.panner.isRunning();
	}
});

Scenario.defineCommand('followPerson',
{
	start: function(scene, state, person) {
		state.pan = new Scenario()
			.focusOnPerson(person)
			.run();
	},
	update: function(scene, state) {
		if (!state.pan.isRunning()) {
			AttachCamera(state.person);
			return false;
		} else {
			return true;
		}
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
	start: function(scene, state, text, backgroundColor, color) {
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
	render: function(scene, state) {
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
	update: function(scene, state) {
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
		duration = duration !== void null ? duration : 0.25;
		
		DetachCamera();
		var targetXY = {
			cameraX: x,
			cameraY: y
		};
		this.cameraX = GetCameraX();
		this.cameraY = GetCameraY();
		this.panner = new Scenario()
			.tween(this, duration, 'easeOutQuad', targetXY)
			.run();
	},
	update: function(scene, state) {
		SetCameraX(state.cameraX);
		SetCameraY(state.cameraY);
		return state.panner.isRunning();
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
		var isChanged = false;
		for (var p in endValues) {
			state.change[p] = endValues[p] - o[p];
			state.startValues[p] = o[p];
			isChanged = isChanged || state.change[p] != 0;
		}
		if (!isChanged) {
			state.elapsed = state.duration;
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
