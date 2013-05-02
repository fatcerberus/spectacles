/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Fader.js");
RequireScript("Core/Threads.js");

// Console() constructor
// Creates an object representing a text-based console.
function Console(numLines)
{
	this.render = function() {
		var visibility = this.fader.value;
		if (visibility <= 0.0) {
			return;
		}
		var boxHeight = this.numLines * this.font.getHeight() + 10;
		var boxY = -boxHeight * (1.0 - visibility);
		Rectangle(0, boxY, GetScreenWidth(), boxHeight, CreateColor(0, 0, 0, visibility * 128));
		for (var i = 0; i < this.numLines; ++i) {
			var lineToDraw = (this.nextLine - this.numLines) + i;
			if (lineToDraw >= 0) {
				var lineInBuffer = lineToDraw % this.numLines;
				var y = boxY + 5 + i * this.font.getHeight();
				this.font.setColorMask(CreateColor(0, 0, 0, 128));
				this.font.drawText(6, y + 1, this.buffer[lineInBuffer]);
				this.font.setColorMask(CreateColor(255, 255, 255, visibility * 128));
				this.font.drawText(5, y, this.buffer[lineInBuffer]);
			}
		}
	};
	this.update = function() {
		return true;
	};
	
	this.numLines = numLines;
	this.buffer = [];
	this.nextLine = 0;
	this.font = GetSystemFont();
	this.fader = new Fader(0.0);
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
	this.fader.adjust(0.0, 0.25);
}

// .show() method
// Shows the console window.
Console.prototype.show = function()
{
	this.fader.adjust(1.0, 0.25);
}

// .writeLine() method
// Outputs a line of text to the console.
Console.prototype.writeLine = function(text)
{
	var lineInBuffer = this.nextLine % this.numLines;
	this.buffer[lineInBuffer] = ">" + text;
	++this.nextLine;
};
