/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");

// Console object
// Represents the Specs Engine text console.
Console = new (function()
{
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.isVisible = false;
	this.lineOffset = 0.0;
	this.log = null;
	this.nextLine = 0;
	this.numLines = 0;
	this.thread = null;
})();

// .initialize() method
// Initializes the console.
Console.initialize = function(numLines, bufferSize)
{
	numLines = numLines !== undefined ? numLines : Math.floor((GetScreenHeight() - 10) * 0.66 / this.font.getHeight());
	bufferSize = bufferSize !== undefined ? bufferSize : 1000;
	
	if (DBG_IN_GAME_CONSOLE) {
		BindKey(KEY_TAB, 'if (!Console.isOpen()) Console.show(); else Console.hide();', null);
	}
	if (DBG_LOG_CONSOLE_OUTPUT) {
		this.log = OpenLog('consoleLog.txt');
	}
	this.numLines = numLines;
	this.buffer = [];
	this.bufferSize = bufferSize;
	this.commands = [];
	this.thread = Threads.create(this, 101);
	this.writeLine("Specs Engine v6.0");
	this.append("(c)2015 Fat Cerberus");
	this.writeLine("Sphere " + GetVersionString());
	this.writeLine("");
	this.writeLine("Initialized console");
};

// .isOpen() method
// Determines whether the console is currently displayed or not.
// Returns:
//     true if the console is open, false otherwise.
Console.isOpen = function()
{
	return this.isVisible;
}

// .append() method
// Appends additional output text to the last line in the console.
// Arguments:
//     text: The text to append.
Console.append = function(text)
{
	if (this.nextLine == 0) {
		Console.writeLine(text);
		return;
	}
	var lineInBuffer = (this.nextLine - 1) % this.bufferSize;
	this.buffer[lineInBuffer] += " >>" + text;
	this.lineOffset = 0.0;
};

// .checkInput() method
// Checks for input and updates the console accordingly.
Console.getInput = function()
{
	if (!this.isOpen()) return;
	var wheelKey = GetNumMouseWheelEvents() > 0 ? GetMouseWheelEvent() : null;
	var speed = wheelKey != null ? 1.0 : 0.5;
	if (IsKeyPressed(KEY_PAGEUP) || wheelKey == MOUSE_WHEEL_UP) {
		this.lineOffset = Math.min(this.lineOffset + speed, this.buffer.length - this.numLines);
	} else if (IsKeyPressed(KEY_PAGEDOWN) || wheelKey == MOUSE_WHEEL_DOWN) {
		this.lineOffset = Math.max(this.lineOffset - speed, 0);
	}
};

// .hide() method
// Hides the console window.
Console.hide = function()
{
	this.isVisible = false;
	new Scenario()
		.tween(this, 0.5, 'easeInBack', { fadeness: 0.0 })
		.run();
};

// .registerEntity() method
// Registers a named entity with the console.
// Arguments:
//     handle:  The name of the entity. Ideally, this should not contain spaces.
//     methods: An associative array of functions, keyed by name, defining the valid operations
//              for this entity.
Console.registerEntity = function(handle, methods)
{
	this.commands[handle] = clone(methods);
};

// .render() method
// Renders the console in its current state.
Console.render = function() {
	if (this.fadeness <= 0.0)
		return;
	var boxHeight = this.numLines * this.font.getHeight() + 10;
	var boxY = GetScreenHeight() - boxHeight * this.fadeness //-boxHeight * (1.0 - this.fadeness);
	Rectangle(0, boxY, GetScreenWidth(), boxHeight, CreateColor(0, 0, 0, this.fadeness * 192));
	var oldClip = GetClippingRectangle();
	SetClippingRectangle(5, boxY + 5, GetScreenWidth() - 10, boxHeight - 10);
	for (var i = -1; i < this.numLines + 1; ++i) {
		var lineToDraw = (this.nextLine - this.numLines) + i - Math.floor(this.lineOffset);
		var lineInBuffer = lineToDraw % this.bufferSize;
		if (lineToDraw >= 0 && this.buffer[lineInBuffer] != null) {
			var y = boxY + 5 + i * this.font.getHeight();
			y += (this.lineOffset - Math.floor(this.lineOffset)) * this.font.getHeight();
			this.font.setColorMask(CreateColor(0, 0, 0, this.fadeness * 192));
			this.font.drawText(6, y + 1, this.buffer[lineInBuffer]);
			this.font.setColorMask(CreateColor(255, 255, 255, this.fadeness * 192));
			this.font.drawText(5, y, this.buffer[lineInBuffer]);
		}
	}
	SetClippingRectangle(oldClip.x, oldClip.y, oldClip.width, oldClip.height);
};

// .show() method
// Shows the console window.
Console.show = function()
{
	this.isVisible = true;
	new Scenario()
		.tween(this, 0.5, 'easeOutBack', { fadeness: 1.0 })
		.run();
}

// .update() method
// Updates the console's internal state for the next frame.
Console.update = function() {
	if (this.fadeness <= 0.0) {
		this.lineOffset = 0.0;
	}
	return true;
};

// .writeLine() method
// Writes a line of text to the console.
Console.writeLine = function(text)
{
	if (DBG_LOG_CONSOLE_OUTPUT && this.nextLine > 0) {
		var lineInBuffer = (this.nextLine - 1) % this.bufferSize;
		this.log.write(this.buffer[lineInBuffer]);
	}
	var lineInBuffer = this.nextLine % this.bufferSize;
	this.buffer[lineInBuffer] = ">" + text;
	++this.nextLine;
	this.lineOffset = 0.0;
};
