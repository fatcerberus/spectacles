/**
 * Scenario 3.7 for Sphere - (c) 2008-2013 Bruce Pascoe
 * An advanced scene manager that allows you to coordinate complex sequences using multiple
 * timelines and cooperative threading.
**/

var Scenario = Scenario || {};

// .defineCommand() function
// Registers a new Scenario command.
// Arguments:
//     name: The name of the command. This should be a valid JavaScript identifier (alphanumeric, no spaces).
//     code: An object defining the command's callback functions:
//           .start(scene, ...): Called when the command begins executing to initialize the state, or for
//                               instantaneous commands, perform the necessary action.
//           .update(scene):     Optional. If provided, called once per frame to maintain state variables.
//                               If not provided, Scenario immediately moves on to the next command after
//                               calling start(). This function should return true to keep the operation running,
//                               or false to terminate it.
//           .render(scene):     Optional. If provided, called once per frame to perform any rendering
//                               related to the command (e.g. text boxes).
//           .getInput(scene):   Optional. If provided, called once per frame while the command has the input
//                               focus to check for player input and update the state accordingly.
Scenario.defineCommand = function(name, code)
{
	if (Scenario.prototype[name] != null) {
		Abort("Scenario.defineCommand(): The instruction name '" + name + "' is already in use!");
	}
	Scenario.prototype[name] = function() {
		var command = {};
		command.context = {};
		command.arguments = arguments;
		command.finish = code.finish;
		command.render = code.render;
		command.start = code.start;
		command.update = code.update;
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
	if (Scenario.screenMask.alpha > 0) {
		ApplyColorMask(Scenario.screenMask);
	}
	for (var i = 0; i < Scenario.activeScenes.length; ++i) {
		this.activeScenes[i].render();
	}
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
// Creates an object representing a scenario (scene definition)
// Arguments:
//     isLooping: If true, the scenario loops endlessly until .stop() is called. (default: false)
function Scenario(isLooping)
{
	isLooping = isLooping !== void null ? isLooping : false;
	
	this.activeThread = null;
	this.currentForkThreadList = [];
	this.currentQueue = [];
	this.focusThreadStack = [];
	this.focusThread = 0;
	this.forkThreadLists = [];
	this.isLooping = isLooping;
	this.jumpsToFix = [];
	this.nextThreadID = 1;
	this.openBlocks = [];
	this.queues = [];
	this.threads = [];
	this.variables = {};
	
	this.createThread = function(context, updater, renderer, priority, inputHandler)
	{
		renderer = renderer !== void null ? renderer : null;
		priority = priority !== void null ? priority : 0;
		inputHandler = inputHandler !== void null ? inputHandler : null;
		
		var threadObject = {
			id:           this.nextThreadID,
			context:      context,
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
	
	this.enqueue = function(command)
	{
		this.currentQueue.push(command);
	};
	
	this.forkUpdater = function(scene)
	{
		for (var i = 0; i < this.forkThreads.length; ++i) {
			if (!scene.isThreadRunning(this.forkThreads[i])) {
				this.forkThreads.splice(i, 1);
				--i; continue;
			}
		}
		if (scene.isThreadRunning(this.currentCommandThread)) {
			return true;
		}
		if (this.counter >= this.commandQueue.length && this.forkThreads.length == 0) {
			return false;
		}
		if (this.counter < this.commandQueue.length) {
			var command = this.commandQueue[this.counter];
			++this.counter;
			if (command.start != null) {
				var parameters = [];
				parameters.push(scene);
				for (i = 0; i < command.arguments.length; ++i) {
					parameters.push(command.arguments[i]);
				}
				command.start.apply(command.context, parameters);
			}
			if (command.update != null) {
				var updateShim = function(scene) {
					var isActive = command.update.call(this, scene);
					if (!isActive && command.finish != null) {
						command.finish.call(this, scene);
					}
					return isActive;
				};
				this.currentCommandThread = scene.createThread(command.context, updateShim, command.render, 0, command.getInput);
			} else if (command.finish != null) {
				command.finish.call(command.context, scene);
			}
		}
		return true;
	};
	
	this.goTo = function(commandID)
	{
		this.activeThread.context.counter = commandID;
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
	
	this.testIf = function(op, variableName, value)
	{
		var operators = {
			'equal': function(a, b) { return a == b; },
			'notEqual': function(a, b) { return a != b; },
			'greaterThan': function(a, b) { return a > b; },
			'greaterThanOrEqual': function(a, b) { return a >= b; },
			'lessThan': function(a, b) { return a < b; },
			'lessThanOrEqual': function(a, b) { return a <= b; }
		};
		return operators[op](this.variables[variableName], value);
	};
	
	this.throwError = function(component, name, message)
	{
		Abort(component + " - error: " + name + "\n" + message);
	};
	
	this.render = function()
	{
		for (var i = 0; i < this.threads.length; ++i) {
			var renderer = this.threads[i].renderer;
			var context = this.threads[i].context;
			if (renderer != null) {
				renderer.call(context, this);
			}
		}
	};
	
	this.update = function()
	{
		for (var i = 0; i < this.threads.length; ++i) {
			this.activeThread = this.threads[i];
			var id = this.threads[i].id;
			var updater = this.threads[i].updater;
			var inputHandler = this.threads[i].inputHandler;
			var context = this.threads[i].context;
			if (updater == null) continue;
			if (!updater.call(context, this)) {
				if (this.focusThread == id) {
					this.focusThread = this.focusThreadStack.pop();
				}
				this.threads.splice(i, 1);
				--i; continue;
			}
			if (this.focusThread == id) {
				inputHandler.call(context, this);
			}
		}
		this.activeThread = null;
	};
}

// .fork() method
// During scene execution, forks the timeline.
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
// Marks the end of a block of commands.
Scenario.prototype.end = function()
{
	if (this.openBlocks.length == 0) {
		this.throwError("Scenario.end()", "Malformed scene", "Mismatched end() - there are no blocks currently open.");
	}
	var openBlockType = this.openBlocks.pop();
	if (openBlockType == 'fork') {
		var threadList = this.currentForkThreadList;
		this.currentForkThreadList = this.forkThreadLists.pop();
		var parentThreadList = this.currentForkThreadList;
		var command = {
			context: {},
			arguments: [ parentThreadList, threadList, this.currentQueue ],
			start: function(scene, threads, subthreads, queue) {
				var forkContext = {
					scene:                scene,
					commandQueue:         queue,
					currentCommandThread: 0,
					forkThreads:          subthreads,
					counter:              0
				};
				var thread = scene.createThread(forkContext, this.forkUpdater);
				threads.push(thread);
			}
		};
		this.currentQueue = this.queues.pop();
		this.enqueue(command);
	} else if (openBlockType == 'branch') {
		var jump = this.jumpsToFix.pop();
		jump.ifFalse = this.currentQueue.length;
	} else if (openBlockType == 'loop') {
		var jump = this.jumpsToFix.pop();
		jump.ifDone = this.currentQueue.length + 1;
		var command = {
			context: {},
			arguments: [],
			start: function(scene) {
				scene.goTo(jump.loopStart);
			}
		};
		this.enqueue(command);
	} else {
		this.throwError("Scenario.end()", "Internal error", "The type of the open block is unknown.");
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

// .doIf() method
// During scene execution, executes a block of commands only if a specified condition is met.
// Arguments:
//     op:           A string naming the conditional operator. Can be one of the following:
//                   = (equal), != (not equal), > (greater), >= (greater or equal), < (less),
//                   <= (less or equal)
//     variableName: The name of the variable to be tested.
//     value:        The value to test against.
Scenario.prototype.doIf = function(op, variableName, value)
{
	var jump = { ifFalse: 0 };
	this.jumpsToFix.push(jump);
	var command = {
		context: {},
		arguments: [ jump ],
		start: function(scene, jump) {
			if (!scene.testIf(variableName, op, value)) {
				scene.goTo(jump.ifFalse);
			}
		}
	};
	this.enqueue(command);
	this.openBlocks.push('branch');
	return this;
};

// .doUntil() method
// During scene execution, repeats a block of commands until a specified condition is met.
// Arguments:
//     op:           A string naming the conditional operator. Can be one of the following:
//                   = (equal), != (not equal), > (greater), >= (greater or equal), < (less),
//                   <= (less or equal)
//     variableName: The name of the variable to be tested.
//     value:        The value to test against.
Scenario.prototype.doUntil = function(op, variableName, value)
{
	var jump = { loopStart: this.currentQueue.length, ifDone: 0 };
	this.jumpsToFix.push(jump);
	var command = {
		context: {},
		arguments: [ jump ],
		start: function(scene, jump) {
			if (scene.testIf(variableName, op, value)) {
				scene.goTo(jump.ifDone);
			}
		}
	};
	this.enqueue(command);
	this.openBlocks.push('loop');
	return this;
};

// .doWhile() method
// During scene execution, repeats a block of commands until a specified condition is met.
// Arguments:
//     op:           A string naming the conditional operator. Can be one of the following:
//                   = (equal), != (not equal), > (greater), >= (greater or equal), < (less),
//                   <= (less or equal)
//     variableName: The name of the variable to be tested.
//     value:        The value to test against.
Scenario.prototype.doWhile = function(op, variableName, value)
{
	var jump = { loopStart: this.currentQueue.length, ifDone: 0 };
	this.jumpsToFix.push(jump);
	var command = {
		context: {},
		arguments: [ jump ],
		start: function(scene, jump) {
			if (!scene.testIf(op, variableName, value)) {
				scene.goTo(jump.ifDone);
			}
		}
	};
	this.enqueue(command);
	this.openBlocks.push('loop');
	return this;
};

// .run() method
// Runs the scenario.
// Arguments:
//     waitUntilDone: Optional. If true, prevents .run() from returning until the scenario has finished executing.
//                    Otherwise, .run() returns immediately. (default: false)
// Remarks:
//     waitUntilDone should be used with care. If .run() is called during a map engine update with waitUntilDone set to true,
//     your game's update script will be blocked from running until the scene is finished. While Scenario itself won't deadlock,
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
	var mainForkContext = {
		currentCommandThread: 0,
		commandQueue:         this.currentQueue,
		forkThreads:          this.currentForkThreadList,
		counter:              0
	};
	this.frameRate = IsMapEngineRunning() ? GetMapEngineFrameRate() : GetFrameRate();
	this.mainThread = this.createThread(mainForkContext, this.forkUpdater);
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
// Immediately halts execution of the scene. Has no effect if the scene isn't running.
// Remarks:
//     After calling this method, calling run() afterwards will start the scene over from the
//     beginning.
Scenario.prototype.stop = function()
{
	this.killThread(this.mainThread);
};

// .synchronize() method
// During a scene, suspends the current timeline until all its forks have finished executing.
Scenario.prototype.synchronize = function()
{
	var command = {};
	command.context = {};
	command.arguments = [ this.currentForkThreadList ];
	command.start = function(scene, subthreads) {
		this.subthreads = subthreads;
	};
	command.update = function(scene) {
		return this.subthreads.length != 0;
	};
	this.enqueue(command);
	return this;
};

// Predefined scene commands
Scenario.defineCommand('set',
{
	start: function(scene, variableName, value) {
		scene.variables[variableName] = value;
	}
});

Scenario.defineCommand('increment',
{
	start: function(scene, variableName) {
		++scene.variables[variableName];
	}
});

Scenario.defineCommand('decrement',
{
	start: function(scene, variableName) {
		--scene.variables[variableName];
	}
});

Scenario.defineCommand('call', {
	start: function(scene, method /*...*/) {
		method.apply(null, [].slice.call(arguments, 3));
	}
});

Scenario.defineCommand('facePerson',
{
	start: function(scene, person, direction) {
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
	start: function(scene, color, duration) {
		duration = duration !== void null ? duration : 0.25;
		
		this.fader = new Scenario()
			.tween(Scenario.screenMask, duration, 'linear', color)
			.run();
	},
	update: function(scene) {
		return this.fader.isRunning();
	}
});

Scenario.defineCommand('focusOnPerson',
{
	start: function(scene, person, duration) {
		duration = duration !== void null ? duration : 0.25;
		
		this.pan = new Scenario()
			.panTo(GetPersonX(person), GetPersonY(person), duration)
			.run();
	},
	update: function(scene) {
		return this.pan.isRunning();
	}
});

Scenario.defineCommand('followPerson',
{
	start: function(scene, person) {
		this.person = person;
		this.pan = new Scenario()
			.focusOnPerson(person)
			.run();
	},
	update: function(scene) {
		return this.pan.isRunning();
	},
	finish: function(scene) {
		AttachCamera(this.person);
	}
});

Scenario.defineCommand('hidePerson',
{
	start: function(scene, person) {
		SetPersonVisible(person, false);
		IgnorePersonObstructions(person, true);
	}
});

Scenario.defineCommand('killPerson',
{
	start: function(scene, person) {
		DestroyPerson(person);
	}
});

Scenario.defineCommand('marquee',
{
	start: function(scene, text, backgroundColor, color) {
		if (backgroundColor === void null) { backgroundColor = CreateColor(0, 0, 0, 255); }
		if (color === void null) { color = CreateColor(255, 255, 255, 255); }
		
		this.text = text;
		this.color = color;
		this.background = backgroundColor;
		this.font = GetSystemFont();
		this.windowSize = GetScreenWidth() + this.font.getStringWidth(this.text);
		this.height = this.font.getHeight() + 10;
		this.textHeight = this.font.getHeight();
		this.fadeness = 0.0;
		this.scroll = 0.0;
		this.animation = new Scenario()
			.tween(this, 0.25, 'linear', { fadeness: 1.0 })
			.tween(this, 1.0, 'easeOutExpo', { scroll: 0.5 })
			.tween(this, 1.0, 'easeInExpo', { scroll: 1.0 })
			.tween(this, 0.25, 'linear', { fadeness: 0.0 })
			.run();
	},
	render: function(scene) {
		var boxHeight = this.height * this.fadeness;
		var boxY = GetScreenHeight() / 2 - boxHeight / 2;
		var textX = GetScreenWidth() - this.scroll * this.windowSize;
		var textY = boxY + boxHeight / 2 - this.textHeight / 2;
		Rectangle(0, boxY, GetScreenWidth(), boxHeight, this.background);
		this.font.setColorMask(CreateColor(0, 0, 0, this.color.alpha));
		this.font.drawText(textX + 1, textY + 1, this.text);
		this.font.setColorMask(this.color);
		this.font.drawText(textX, textY, this.text);
	},
	update: function(scene) {
		return this.animation.isRunning();
	}
});

Scenario.defineCommand('movePerson',
{
	start: function(scene, person, direction, distance, speed, faceFirst) {
		faceFirst = faceFirst !== void null ? faceFirst : true;
		
		if (!isNaN(speed)) {
			speedVector = [ speed, speed ];
		} else {
			speedVector = speed;
		}
		this.person = person;
		this.oldSpeedVector = [ GetPersonSpeedX(person), GetPersonSpeedY(person) ];
		if (speedVector != null) {
			SetPersonSpeedXY(this.person, speedVector[0], speedVector[1]);
		} else {
			speedVector = this.oldSpeedVector;
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
			QueuePersonCommand(this.person, faceCommand, true);
		}
		for (iStep = 0; iStep < stepCount; ++iStep) {
			QueuePersonCommand(this.person, xMovement, true);
			QueuePersonCommand(this.person, yMovement, true);
			QueuePersonCommand(this.person, COMMAND_WAIT, false);
		}
		return true;
	},
	update: function(scene) {
		return !IsCommandQueueEmpty(this.person);
	},
	finish: function(scene) {
		SetPersonSpeedXY(this.person, this.oldSpeedVector[0], this.oldSpeedVector[1]);
	}
});

Scenario.defineCommand('panTo',
{
	start: function(scene, x, y, duration) {
		duration = duration !== void null ? duration : 0.25;
		
		DetachCamera();
		var targetXY = {
			cameraX: x,
			cameraY: y
		};
		this.cameraX = GetCameraX();
		this.cameraY = GetCameraY();
		this.pan = new Scenario()
			.tween(this, duration, 'easeOutQuad', targetXY)
			.run();
	},
	update: function(scene) {
		SetCameraX(this.cameraX);
		SetCameraY(this.cameraY);
		return this.pan.isRunning();
	}
});

Scenario.defineCommand('pause',
{
	start: function(scene, duration) {
		this.duration = duration;
		this.elapsed = 0;
	},
	update: function(scene) {
		this.elapsed += 1.0 / scene.frameRate;
		return this.elapsed < this.duration;
	}
});

Scenario.defineCommand('playSound',
{
	start: function(scene, file) {
		this.sound = LoadSound(file);
		this.sound.play(false);
		return true;
	},
	update: function(scene) {
		return this.sound.isPlaying();
	}
});

Scenario.defineCommand('showPerson',
{
	start: function(scene, person) {
		SetPersonVisible(person, true);
		IgnorePersonObstructions(person, false);
	}
});

Scenario.defineCommand('tween',
{
	start: function(scene, o, duration, easingType, endValues) {
		this.easers = {
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
		this.change = {};
		this.duration = duration;
		this.elapsed = 0.0;
		this.object = o;
		this.startValues = {};
		this.type = easingType in this.easers ? easingType : 'linear';
		var isChanged = false;
		for (var p in endValues) {
			this.change[p] = endValues[p] - o[p];
			this.startValues[p] = o[p];
			isChanged = isChanged || this.change[p] != 0;
		}
		var specialPropertyNames = [
			'red', 'green', 'blue', 'alpha'
		];
		for (var i = 0; i < specialPropertyNames.length; ++i) {
			var p = specialPropertyNames[i];
			if (!(p in this.change) && p in endValues) {
				this.change[p] = endValues[p] - o[p];
				this.startValues[p] = o[p];
				isChanged = isChanged || this.change[p] != 0;
			}
		}
		if (!isChanged) {
			this.elapsed = this.duration;
		}
	},
	update: function(scene) {
		this.elapsed += 1.0 / scene.frameRate;
		if (this.elapsed < this.duration) {
			for (var p in this.change) {
				this.object[p] = this.easers[this.type](this.elapsed, this.startValues[p], this.change[p], this.duration);
			}
			return true;
		} else {
			return false;
		}
	},
	finish: function(scene) {
		for (var p in this.change) {
			this.object[p] = this.startValues[p] + this.change[p];
		}
	}
});
