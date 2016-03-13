/**
 *  miniRT/scenes 2.0 CommonJS module
 *  (c) 2015-2016 Fat Cerberus
 *  an advanced scene manager that allows you to coordinate complex sequences
 *  using multiple timelines and cooperative threading.  based on Scenario.
**/

if (typeof exports === 'undefined') {
    throw new TypeError("scenes.js must be loaded using require()");
}

var link    = require('link');
var threads = require('./threads');

var screenMask = new Color(0, 0, 0, 0);

var scenes =
module.exports = new (function()
{
	renderScenes = function()
	{
		if (screenMask.alpha > 0) {
			ApplyColorMask(screenMask);
		}
	};

	var updateScenes = function()
	{
		return true;
	};

	var manifest = GetGameManifest();
	var priority = 99;
	var threadID = threads.create({
		update: updateScenes,
		render: renderScenes,
	}, priority);

	// scenes.scenelet()
	// register a new scenelet.
	// arguments:
	//     name: the name of the command.  this should be a valid JavaScript identifier (alphanumeric, no spaces).
	//     code: an object defining the command's callback functions:
	//           .start(scene, ...): called when the command begins executing to initialize the state, or for
	//                               instantaneous commands, perform the necessary action.
	//           .update(scene):     optional.  a function to be called once per frame to update state data.  if not
	//                               provided, scenes immediately moves on to the next command after calling start().
	//                               this function should return true to keep the operation running, or false to
	//                               terminate it.
	//           .getInput(scene):   optional.  a function to be called once per frame to check for player input and
	//                               update state data accordingly.
	//           .render(scene):     optional.  a function to be called once per frame to perform any rendering
	//                               related to the command (e.g. text boxes).
	//           .finish(scene):     optional.  called after command execution ends, just before Scenes executes
	//                               the next instruction in the queue.
	// remarks:
	//    it is safe to call this prior to initialization.
	var scenelet = function(name, code)
	{
		if (name in Scene.prototype)
			Abort("scenes.scenelet(): scenelet ID `" + name + "` already in use", -1);
		Scene.prototype[name] = function() {
			this.enqueue({
				arguments: arguments,
				start: code.start,
				getInput: code.getInput,
				update: code.update,
				render: code.render,
				finish: code.finish
			});
			return this;
		};
	};
	
	// scenes.Scene()
	// construct a scene definition.
	function Scene()
	{
		var activation = null;
		var forkedQueues = [];
		var jumpsToFix = [];
		var mainThread = 0;
		var openBlockTypes = [];
		var queueToFill = [];
		var tasks = [];

		var goTo = function(address)
		{
			activation.pc = address;
		};

		function runTimeline(ctx)
		{
			this.frameRate = IsMapEngineRunning()
				? GetMapEngineFrameRate()
				: GetFrameRate();
			if ('opThread' in ctx) {
				if (threads.isRunning(ctx.opThread))
					return true;
				else {
					link(tasks)
						.where(function(thread) { return ctx.opThread == thread })
						.remove();
					delete ctx.opThread;
					activation = ctx;
					if (typeof ctx.op.finish === 'function')
						ctx.op.finish.call(ctx.opctx, this);
					activation = null;
				}
			}
			if (ctx.pc < ctx.instructions.length) {
				ctx.op = ctx.instructions[ctx.pc++];
				ctx.opctx = {};
				if (typeof ctx.op.start === 'function') {
					var arglist = [ this ];
					for (i = 0; i < ctx.op.arguments.length; ++i)
						arglist.push(ctx.op.arguments[i]);
					activation = ctx;
					ctx.op.start.apply(ctx.opctx, arglist);
					activation = null;
				}
				if (ctx.op.update != null) {
					ctx.opThread = threads.createEx(ctx.opctx, {
						update: ctx.op.update.bind(ctx.opctx, this),
						render: typeof ctx.op.render === 'function' ? ctx.op.render.bind(ctx.opctx, this) : undefined,
						getInput: typeof ctx.op.getInput  === 'function' ? ctx.op.getInput.bind(ctx.opctx, this) : undefined,
						priority: priority,
					});
					tasks.push(ctx.opThread);
				} else {
					ctx.opThread = 0;
				}
				return true;
			} else {
				if (link(ctx.forks)
					.where(function(thread) { return threads.isRunning(thread); })
					.length() == 0)
				{
					var self = threads.self();
					link(tasks)
						.where(function(thread) { return self == thread })
						.remove();
					return false;
				} else {
					return true;
				}
			}
		};

		// scenes.Scene:isPlaying()
		// Determines whether a scene is currently playing.
		// Returns:
		//     true if the scenario is still executing commands; false otherwise.
		function isRunning()
		{
			return threads.isRunning(mainThread);
		};

		// scenes.Scene:doIf()
		// during scene execution, execute a block of commands only if a specified condition is met.
		// arguments:
		//     conditional: a function to be called during scene execution to determine whether to run the following
		//                  block.  the function should return true to execute the block, or false to skip it.  it
		//                  will be called with 'this' set to the invoking scene.
		function doIf(conditional)
		{
			var jump = { ifFalse: null };
			jumpsToFix.push(jump);
			var command = {
				arguments: [],
				start: function(scene) {
					if (!conditional.call(scene)) {
						goTo(jump.ifFalse);
					}
				}
			};
			enqueue(command);
			openBlockTypes.push('branch');
			return this;
		};

		// scenes.Scene:doWhile()
		// During scene execution, repeats a block of commands for as long as a specified condition is met.
		// Arguments:
		//     conditional: A function to be called at each iteration to determine whether to continue the
		//                  loop. The function should return true to continue the loop, or false to
		//                  stop it. It will be called with 'this' set to the invoking Scene object.
		function doWhile(conditional)
		{
			var jump = { loopStart: queueToFill.length, ifDone: null };
			jumpsToFix.push(jump);
			var command = {
				arguments: [],
				start: function(scene) {
					if (!conditional.call(scene)) {
						goTo(jump.ifDone);
					}
				}
			};
			enqueue(command);
			openBlockTypes.push('loop');
			return this;
		};

		// scenes.Scene:end()
		// marks the end of a block of commands.
		function end()
		{
			if (openBlockTypes.length == 0)
				Abort("Mismatched end() in scene definition", -1);
			var blockType = openBlockTypes.pop();
			switch (blockType) {
				case 'fork':
					var command = {
						arguments: [ queueToFill ],
						start: function(scene, instructions) {
							var ctx = {
								instructions: instructions,
								pc: 0,
								forks: [],
							};
							var tid = threads.createEx(scene, {
								update: runTimeline.bind(scene, ctx)
							});
							tasks.push(tid);
							activation.forks.push(tid);
						}
					};
					queueToFill = forkedQueues.pop();
					enqueue(command);
					break;
				case 'branch':
					var jump = jumpsToFix.pop();
					jump.ifFalse = queueToFill.length;
					break;
				case 'loop':
					var command = {
						arguments: [],
						start: function(scene) {
							goTo(jump.loopStart);
						}
					};
					enqueue(command);
					var jump = jumpsToFix.pop();
					jump.ifDone = queueToFill.length;
					break;
				default:
					Abort("miniscenes internal error (unknown block type)", -1);
					break;
			}
			return this;
		};

		// scenes.Scene:enqueue()
		// enqueues a custom scenelet.  not recommended for outside use.
		function enqueue(command)
		{
			if (isRunning())
				Abort("attempt to modify scene definition during playback", -2);
			queueToFill.push(command);
		};

		// scenes.Scene:fork()
		// during scene execution, fork the timeline, allowing a block to run simultaneously with
		// the instructions after it.
		function fork()
		{
			forkedQueues.push(queueToFill);
			queueToFill = [];
			openBlockTypes.push('fork');
			return this;
		};

		// scenes.Scene:restart()
		// restart the scene from the beginning.  this has the same effect as calling
		// .stop() and .play() back-to-back.
		function restart()
		{
			stop();
			run();
		};

		// scenes.Scene:resync()
		// during a scene, suspend the current timeline until all of its forks have run to
		// completion.
		// remarks:
		//     there is an implicit resync at the end of a timeline.
		function resync()
		{
			var command = {
				arguments: [],
				start: function(scene) {
					forks = activation.forks;
				},
				update: function(scene) {
					return link(forks)
						.where(function(tid) { return threads.isRunning(tid); })
						.length() > 0;
				}
			};
			enqueue(command);
			return this;
		}

		// scenes.Scene:play()
		// play back the scene.
		// arguments:
		//     waitUntilDone: if true, block until playback has finished.
		function run(waitUntilDone)
		{
			if (openBlockTypes.length > 0)
				Abort("unclosed block in scene definition", -1);
			if (isRunning()) return;
			var ctx = {
				instructions: queueToFill,
				pc: 0,
				forks: [],
			};
			mainThread = threads.createEx(this, {
				update: runTimeline.bind(this, ctx)
			});
			tasks.push(mainThread);
			if (waitUntilDone)
				threads.join(mainThread);
			return this;
		};

		// scenes.Scene:stop()
		// immediately halt scene playback.  no effect if the scene isn't playing.
		// remarks:
		//     after calling this method, calling .play() afterwards will start from the
		//     beginning.
		function stop()
		{
			link(tasks)
				.each(function(tid)
			{
				threads.kill(tid);
			});
		};

		var retobj = {
			isRunning: isRunning,
			doIf:      doIf,
			doWhile:   doWhile,
			end:       end,
			enqueue:   enqueue,
			fork:      fork,
			restart:   restart,
			resync:    resync,
			run:       run,
			stop:      stop,
		};
		Object.setPrototypeOf(retobj, Scene.prototype);
		return retobj;
	}

	return {
		scenelet: scenelet,
		Scene:    Scene,
	};
})();

// .call() scenelet
// Calls a function during scene execution.
// Arguments:
//     method: The function to be called.
// Remarks:
//     Any additional arguments provided beyond the 'method' argument will be passed
//     to the specified function when it is called.
scenes.scenelet('call',
{
	start: function(scene, method /*...*/) {
		method.apply(null, [].slice.call(arguments, 2));
	}
});

// .facePerson() scenelet
// Changes the facing direction of a map entity.
// Arguments:
//     person:    The name of the entity whose direction to change.
//     direction: The name of the new direction.
scenes.scenelet('facePerson',
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

// .fadeTo() scenelet
// Fades the screen mask to a specified color.
// Arguments:
//     color:    The new screen mask color.
//     duration: The length of the fading operation, in seconds.
scenes.scenelet('fadeTo',
{
	start: function(scene, color, duration) {
		duration = duration !== undefined ? duration : 0.25;
		
		this.fader = new scenes.Scene()
			.tween(screenMask, duration, 'linear', color)
			.run();
	},
	update: function(scene) {
		return this.fader.isRunning();
	}
});

// .focusOnPerson() scenelet
// Pans the camera to a point centered over a specified map entity.
// Arguments:
//     person:   The name of the entity to focus on.
//     duration: Optional. The length of the panning operation, in seconds.
//               (default: 0.25)
scenes.scenelet('focusOnPerson',
{
	start: function(scene, person, duration) {
		duration = duration !== undefined ? duration : 0.25;
		
		this.pan = new scenes.Scene()
			.panTo(GetPersonX(person), GetPersonY(person), duration)
			.run();
	},
	update: function(scene) {
		return this.pan.isRunning();
	}
});

// .followPerson() scenelet
// Pans to and attaches the camera to a specified map entity.
// Arguments:
//     person: The name of the entity to follow.
scenes.scenelet('followPerson',
{
	start: function(scene, person) {
		this.person = person;
		this.pan = new scenes.Scene()
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

// .hidePerson() scenelet
// Hides a map entity and prevents it from obstructing other entities.
// Arguments:
//     person: The name of the entity to hide.
scenes.scenelet('hidePerson',
{
	start: function(scene, person) {
		SetPersonVisible(person, false);
		IgnorePersonObstructions(person, true);
	}
});

// .killPerson() scenelet
// Destroys a map entity.
// Arguments:
//     person: The name of the entity to destroy.
scenes.scenelet('killPerson',
{
	start: function(scene, person) {
		DestroyPerson(person);
	}
});

// .marquee() scenelet
// Shows a scrolling marquee with the specified text. Useful for announcing boss battles.
// Arguments:
//     text:            The text to display.
//     backgroundColor: The background color of the marquee.
//     color:           The text color.
scenes.scenelet('marquee',
{
	start: function(scene, text, backgroundColor, color) {
		if (backgroundColor === undefined) { backgroundColor = new Color(0, 0, 0, 255); }
		if (color === undefined) { color = new Color(255, 255, 255, 255); }
		
		this.text = text;
		this.color = color;
		this.background = backgroundColor;
		this.font = GetSystemFont();
		this.windowSize = GetScreenWidth() + this.font.getStringWidth(this.text);
		this.height = this.font.getHeight() + 10;
		this.textHeight = this.font.getHeight();
		this.fadeness = 0.0;
		this.scroll = 0.0;
		this.animation = new scenes.Scene()
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
		this.font.setColorMask(new Color(0, 0, 0, this.color.alpha));
		this.font.drawText(textX + 1, textY + 1, this.text);
		this.font.setColorMask(this.color);
		this.font.drawText(textX, textY, this.text);
	},
	update: function(scene) {
		return this.animation.isRunning();
	}
});

// .maskPerson() scenelet
scenes.scenelet('maskPerson',
{
	start: function(scene, name, newMask, duration) {
		duration = duration !== undefined ? duration : 0.25;
		
		this.name = name;
		this.mask = GetPersonMask(this.name);
		this.fade = new scenes.Scene()
			.tween(this.mask, duration, 'easeInOutSine', newMask)
			.run();
	},
	update: function(scene) {
		SetPersonMask(this.name, this.mask);
		return this.fade.isRunning();
	}
});

// .movePerson() scenelet
// Instructs a map entity to move a specified distance.
// Arguments:
//     person:    The person to move.
//     direction: The direction in which to move the entity.
//     distance:  The distance the entity should move.
//     speed:     The number of pixels per frame the entity should move.
//     faceFirst: Optional. If this is false, the entity will move without changing its facing
//                direction. (default: true)
scenes.scenelet('movePerson',
{
	start: function(scene, person, direction, distance, speed, faceFirst) {
		faceFirst = faceFirst !== undefined ? faceFirst : true;
		
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

// .panTo() scenelet
// Pans the map camera to center on a specified location on the map.
// Arguments:
//     x:        The X coordinate of the location to pan to.
//     y:        The Y coordinate of the location to pan to.
//     duration: Optional. The length of the panning operation, in seconds. (default: 0.25)
scenes.scenelet('panTo',
{
	start: function(scene, x, y, duration) {
		duration = duration !== undefined ? duration : 0.25;
		
		DetachCamera();
		var targetXY = {
			cameraX: x,
			cameraY: y
		};
		this.cameraX = GetCameraX();
		this.cameraY = GetCameraY();
		this.pan = new scenes.Scene()
			.tween(this, duration, 'easeOutQuad', targetXY)
			.run();
	},
	update: function(scene) {
		SetCameraX(this.cameraX);
		SetCameraY(this.cameraY);
		return this.pan.isRunning();
	}
});

// .pause() scenelet
// Delays execution of the current timeline for a specified amount of time.
// Arguments:
//     duration: The length of the delay, in seconds.
scenes.scenelet('pause',
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

// .playSound() scenelet
// Plays a sound from a file.
//     fileName: The name of the file to play.
scenes.scenelet('playSound',
{
	start: function(scene, fileName) {
		this.sound = new Sound(fileName);
		this.sound.play(false);
		return true;
	},
	update: function(scene) {
		return this.sound.isPlaying();
	}
});

// .showPerson() scenelet
// Makes a map entity visible and enables obstruction.
// Arguments:
//     person: The name of the entity to show.
scenes.scenelet('showPerson',
{
	start: function(scene, person) {
		SetPersonVisible(person, true);
		IgnorePersonObstructions(person, false);
	}
});

// .spriteset() scenelet
scenes.scenelet('setSprite',
{
	start: function(scene, name, spriteFile) {
		var spriteset = new Spriteset(spriteFile);
		SetPersonSpriteset(name, spriteset);
	}
});

// .tween() scenelet
// Smoothly adjusts numeric properties of an object over a period of time.
// Arguments:
//    object:     The object containing the properties to be tweened.
//    duration:   The length of the tweening operation, in seconds.
//    easingType: The name of the easing function to use, e.g. 'linear' or 'easeOutQuad'.
//    endValues:  An object specifying the properties to tween and their final values.
scenes.scenelet('tween',
{
	start: function(scene, object, duration, easingType, endValues) {
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
		this.object = object;
		this.startValues = {};
		this.type = easingType in this.easers ? easingType : 'linear';
		var isChanged = false;
		for (var p in endValues) {
			this.change[p] = endValues[p] - object[p];
			this.startValues[p] = object[p];
			isChanged = isChanged || this.change[p] != 0;
		}
		var specialPropertyNames = [
			'red', 'green', 'blue', 'alpha'
		];
		for (var i = 0; i < specialPropertyNames.length; ++i) {
			var p = specialPropertyNames[i];
			if (!(p in this.change) && p in endValues) {
				this.change[p] = endValues[p] - object[p];
				this.startValues[p] = object[p];
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
