/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");

// Console object
// Represents the Specs Engine text console.
Console = new (function()
{
	this.buffer = [];
	this.commands = [];
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.log = null;
	this.nextLine = 0;
	this.numLines = 0;
	this.thread = null;
})();

// .initialize() method
// Initializes the console.
Console.initialize = function(numLines)
{
	if (DBG_LOG_CONSOLE_OUTPUT) {
		this.log = OpenLog('consoleLog.txt');
	}
	this.numLines = numLines;
	this.thread = Threads.createEntityThread(this, 101);
	this.writeLine("Specs Engine v6.0");
	this.append("(c)2013-2014 Power-Command");
	this.writeLine("");
	this.writeLine("Initialized console");
};

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
	var lineInBuffer = (this.nextLine - 1) % this.numLines;
	this.buffer[lineInBuffer] += " >>" + text;
};

// .hide() method
// Hides the console window.
Console.hide = function()
{
	new Scenario()
		.tween(this, 1.0, 'easeInBack', { fadeness: 0.0 })
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
	if (this.fadeness <= 0.0) {
		return;
	}
	var boxHeight = this.numLines * this.font.getHeight() + 10;
	var boxY = -boxHeight * (1.0 - this.fadeness);
	Rectangle(0, boxY, GetScreenWidth(), boxHeight, CreateColor(0, 0, 0, this.fadeness * 128));
	for (var i = 0; i < this.numLines; ++i) {
		var lineToDraw = (this.nextLine - this.numLines) + i;
		if (lineToDraw >= 0) {
			var lineInBuffer = lineToDraw % this.numLines;
			var y = boxY + 5 + i * this.font.getHeight();
			this.font.setColorMask(CreateColor(0, 0, 0, this.fadeness * 128));
			this.font.drawText(6, y + 1, this.buffer[lineInBuffer]);
			this.font.setColorMask(CreateColor(255, 255, 255, this.fadeness * 128));
			this.font.drawText(5, y, this.buffer[lineInBuffer]);
		}
	}
};

// .show() method
// Shows the console window.
Console.show = function()
{
	new Scenario()
		.tween(this, 1.0, 'easeOutBack', { fadeness: 1.0 })
		.run();
}

// .update() method
// Updates the console's internal state for the next frame.
Console.update = function() {
	return true;
};

// .writeLine() method
// Writes a line of text to the console.
Console.writeLine = function(text)
{
	if (DBG_LOG_CONSOLE_OUTPUT && this.nextLine > 0) {
		var lineInBuffer = (this.nextLine - 1) % this.numLines;
		this.log.write(this.buffer[lineInBuffer]);
	}
	var lineInBuffer = this.nextLine % this.numLines;
	this.buffer[lineInBuffer] = ">" + text;
	++this.nextLine;
};
