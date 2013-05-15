/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("Core/Tween.js");

// Console() constructor
// Creates an object representing an output-only text console.
function Console(numLines)
{
	this.showStyle = { easing: 'easeOutBack', duration: 1.0 };
	this.hideStyle = { easing: 'easeInBack', duration: 1.0 };
	
	this.buffer = [];
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.nextLine = 0;
	this.numLines = numLines;
	this.thread = Threads.createEntityThread(this, 100);
	
	this.writeLine("Specs Engine v6.0");
	this.append("(c)2013 Power-Command");
	this.writeLine("");
	this.writeLine("Initialized console");
}

// .dispose() method
// Destroys the console, freeing any resources associated with it.
Console.prototype.dispose = function()
{
	Threads.kill(this.thread);
};

// .append() method
// Appends additional output text to the last line in the console.
// Arguments:
//     text: The text to append.
Console.prototype.append = function(text)
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
Console.prototype.hide = function()
{
	new Tween(this, this.hideStyle.duration, this.hideStyle.easing, { fadeness: 0.0 }).start();
}

// .render() method
// Renders the console in its current state.
Console.prototype.render = function() {
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
			this.font.setColorMask(CreateColor(0, 0, 0, 128));
			this.font.drawText(6, y + 1, this.buffer[lineInBuffer]);
			this.font.setColorMask(CreateColor(255, 255, 255, this.fadeness * 255));
			this.font.drawText(5, y, this.buffer[lineInBuffer]);
		}
	}
};

// .show() method
// Shows the console window.
Console.prototype.show = function()
{
	new Tween(this, this.showStyle.duration, this.showStyle.easing, { fadeness: 1.0 }).start();
}

// .update() method
// Updates the console's internal state for the next frame.
Console.prototype.update = function() {
	return true;
};

// .writeLine() method
// Writes a line of text to the console.
Console.prototype.writeLine = function(text)
{
	var lineInBuffer = this.nextLine % this.numLines;
	this.buffer[lineInBuffer] = ">" + text;
	++this.nextLine;
};
