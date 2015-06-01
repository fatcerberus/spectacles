/**
 * miniRT  (c) 2015 Fat Cerberus
 * A set of system scripts for minisphere providing advanced, high-level
 * functionality not available in the engine itself.
 *
 * [mini/miniConsole.js]
 * An easy-to-use output console which optionally logs output to disk.
**/

if (typeof mini === 'undefined') {
    Abort("miniRT component script; use miniRT.js instead", -2);
}

RequireSystemScript('mini/miniLink.js');
RequireSystemScript('mini/miniScenes.js');
RequireSystemScript('mini/miniThreads.js');

// mini.Console
// Encapsulates the console.
mini.Console = {};

// miniconsole initializer
// Initializes miniconsole when the user calls mini.initialize().
// Parameters:
//     consoleLines:  The number of lines to display at a time. If not provided, the line count
//                    will be determined dynamically based on the game resolution.
//     consoleBuffer: The maximum number of lines kept in the line buffer. (default: 1000)
//     logFile:       Path, relative to <game_dir>/logs, of the file to write console output
//                    to. Can be null, in which case no log file is created. (default: null)
mini.onStartUp.add(mini.Console, function(params)
{
	Print("miniRT: Initializing miniConsole");
	
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.isVisible = false;
	this.lineOffset = 0.0;
	this.log = null;
	this.nextLine = 0;
	this.numLines = 0;
	this.wasKeyDown = false;
	
	var numLines = 'consoleLines' in params ? params.consoleLines
		: Math.floor((GetScreenHeight() - 32) / this.font.getHeight());
	var bufferSize = 'consoleBuffer' in params ? params.consoleBuffer : 1000;
	var filename = 'logFile' in params ? params.logFile : null;
	var prompt = 'consolePrompt' in params ? params.consolePrompt : "Command:";
	
	if (typeof filename === 'string')
		this.log = OpenLog(params.logFile);
	else
		this.log = null;
	this.numLines = numLines;
	this.buffer = [];
	this.bufferSize = bufferSize;
	this.commands = [];
	this.prompt = prompt;
	this.entry = "";
	this.cursorColor = new Color(255, 255, 128, 255);
	new mini.Scene()
		.doWhile(function() { return true; })
			.tween(this.cursorColor, 0.25, 'easeInSine', { alpha: 255 })
			.tween(this.cursorColor, 0.25, 'easeOutSine', { alpha: 64 })
		.end()
		.run();
	mini.Threads.create(this, 101);
	
	var game = GetGameInformation();
	this.write(game.name + " Console");
	this.write("Sphere " + GetVersionString());
	this.write("");
	
	this.register('keymap', this, {
		'set': function(playerKey, keyName, playerID) {
			if (arguments.length < 2)
				return this.write("keymap set: 2+ arguments expected");
			playerID = playerID !== undefined ? playerID : 1;
			if (playerID < 1 || playerID > 4)
				return this.write("keymap set: Player ID out of range (" + playerID + ")");
			var keyConst, playerKeyConst;
			if ((keyConst = Sphere["KEY_" + keyName.toUpperCase()]) == undefined)
				return this.write("keymap set: Invalid key name `" + keyName.toUpperCase() + "`");
			if ((playerKeyConst = Sphere["PLAYER_KEY_" + playerKey.toUpperCase()]) == undefined)
				return this.write("keymap set: Unknown player key `" + keyName.toUpperCase() + "`");
			SetPlayerKey(playerID - 1, playerKeyConst, keyConst);
			this.write("PLAYER_KEY_" + playerKey.toUpperCase() + " mapped to KEY_" + keyName.toUpperCase());
		}
	});
});

// mini.Console.update()
// Updates the console thread per frame.
mini.Console.update = function() {
	if (this.fadeness <= 0.0) {
		this.lineOffset = 0.0;
	}
	return true;
};

// mini.Console.render()
// Performs rendering on the console thread per frame.
mini.Console.render = function() {
	if (this.fadeness <= 0.0)
		return;
	
	// draw command prompt
	var boxY = -22 * (1.0 - this.fadeness);
	Rectangle(0, boxY, GetScreenWidth(), 22, new Color(0, 0, 0, this.fadeness * 224));
	var promptWidth = this.font.getStringWidth(this.prompt + " ");
	this.font.setColorMask(new Color(0, 0, 0, this.fadeness * 192));
	this.font.drawText(6, 6 + boxY, this.prompt);
	this.font.setColorMask(new Color(128, 128, 128, this.fadeness * 192));
	this.font.drawText(5, 5 + boxY, this.prompt);
	this.font.setColorMask(new Color(0, 0, 0, this.fadeness * 192));
	this.font.drawText(6 + promptWidth, 6 + boxY, this.entry);
	this.font.setColorMask(new Color(255, 255, 128, this.fadeness * 192));
	this.font.drawText(5 + promptWidth, 5 + boxY, this.entry);
	this.font.setColorMask(this.cursorColor);
	this.font.drawText(5 + promptWidth + this.font.getStringWidth(this.entry), 5 + boxY, "_");
	
	var boxHeight = this.numLines * this.font.getHeight() + 10;
	var boxY = GetScreenHeight() - boxHeight * this.fadeness;
	Rectangle(0, boxY, GetScreenWidth(), boxHeight, new Color(0, 0, 0, this.fadeness * 192));
	var oldClip = GetClippingRectangle();
	SetClippingRectangle(5, boxY + 5, GetScreenWidth() - 10, boxHeight - 10);
	for (var i = -1; i < this.numLines + 1; ++i) {
		var lineToDraw = (this.nextLine - this.numLines) + i - Math.floor(this.lineOffset);
		var lineInBuffer = lineToDraw % this.bufferSize;
		if (lineToDraw >= 0 && this.buffer[lineInBuffer] != null) {
			var y = boxY + 5 + i * this.font.getHeight();
			y += (this.lineOffset - Math.floor(this.lineOffset)) * this.font.getHeight();
			this.font.setColorMask(new Color(0, 0, 0, this.fadeness * 192));
			this.font.drawText(6, y + 1, this.buffer[lineInBuffer]);
			this.font.setColorMask(new Color(255, 255, 255, this.fadeness * 192));
			this.font.drawText(5, y, this.buffer[lineInBuffer]);
		}
	}
	SetClippingRectangle(oldClip.x, oldClip.y, oldClip.width, oldClip.height);
};

// mini.Console.isOpen()
// Determines whether the console is currently displayed or not.
// Returns:
//     true if the console is open, false otherwise.
mini.Console.isOpen = function()
{
	return this.isVisible;
}

// mini.Console.append()
// Appends additional output text to the last line in the console.
// Arguments:
//     text: The text to append.
mini.Console.append = function(text)
{
	if (this.nextLine == 0) {
		mini.Console.write(text);
		return;
	}
	var lineInBuffer = (this.nextLine - 1) % this.bufferSize;
	this.buffer[lineInBuffer] += " >>" + text;
	this.lineOffset = 0.0;
};

// mini.Console.execute()
// Executes a given command string.
// Remarks:
//     * Command format is <entity_name> <instruction> <arg_1> ... <arg_n>
//       e.g.: cow eat kitties 100
//     * Quoted text (single or double quotes) is treated as a single token.
//     * Numeric arguments are converted to actual JS numbers before being passed to an
//       instruction method.
mini.Console.execute = function(command)
{
	// tokenize the command string
	var tokens = command.match(/'.*?'|".*?"|\S+/g);
	if (tokens == null) return;
	for (var i = 0; i < tokens.length; ++i) {
		tokens[i] = tokens[i].replace(/'(.*)'/, "$1");
		tokens[i] = tokens[i].replace(/"(.*)"/, "$1");
	}
	var entity = tokens[0];
	var instruction = tokens[1];
	
	// check that the instruction is valid
	if (!mini.Link(this.commands)
		.pluck('entity')
		.contains(entity))
	{
		this.write("Entity name '" + entity + "' not recognized");
		return;
	}
	if (tokens.length < 2) {
		this.write("No instruction provided for '" + entity + "'");
		return;
	}
	if (!mini.Link(this.commands)
		.filterBy('entity', entity)
		.pluck('instruction')
		.contains(instruction))
	{
		this.write("Instruction '" + instruction + "' not valid for '" + entity + "'");
		return;
	}
	
	// parse arguments
	for (var i = 2; i < tokens.length; ++i) {
		var maybeNumber = parseFloat(tokens[i]);
		tokens[i] = !isNaN(maybeNumber) ? maybeNumber : tokens[i];
	}
	
	// execute the command
	mini.Link(this.commands)
		.filterBy('instruction', instruction)
		.filterBy('entity', entity)
		.each(function(desc)
	{
		mini.Threads.createEx(desc, {
			update: function() {
				this.method.apply(this.that, tokens.slice(2));
			}
		});
	});
};

// mini.Console.getInput()
// Checks for input and updates accordingly.
mini.Console.getInput = function()
{
	var consoleKey = GetPlayerKey(PLAYER_1, PLAYER_KEY_MENU);
	if (!this.wasKeyDown && IsKeyPressed(consoleKey)) {
		if (!this.isOpen())
			this.show();
		else
			this.hide();
	}
	this.wasKeyDown = IsKeyPressed(consoleKey);
	if (this.isOpen()) {
		var wheelKey = GetNumMouseWheelEvents() > 0 ? GetMouseWheelEvent() : null;
		var speed = wheelKey != null ? 1.0 : 0.5;
		if (IsKeyPressed(KEY_PAGEUP) || wheelKey == MOUSE_WHEEL_UP) {
			this.lineOffset = Math.min(this.lineOffset + speed, this.buffer.length - this.numLines);
		} else if (IsKeyPressed(KEY_PAGEDOWN) || wheelKey == MOUSE_WHEEL_DOWN) {
			this.lineOffset = Math.max(this.lineOffset - speed, 0);
		}
		var keycode = AreKeysLeft() ? GetKey() : null;
		switch (keycode) {
			case KEY_ENTER:
				this.write("Command entered: '" + this.entry + "'");
				this.execute(this.entry);
				this.entry = "";
				break;
			case KEY_BACKSPACE:
				this.entry = this.entry.slice(0, -1);
				break;
			case KEY_TAB: break;
			case null: break;
			default:
				var ch = GetKeyString(keycode, IsKeyPressed(KEY_SHIFT));
				ch = GetToggleState(KEY_CAPSLOCK) ? ch.toUpperCase() : ch;
				this.entry += ch;
		}
	}
};

// mini.Console.hide()
// Hides the console.
mini.Console.hide = function()
{
	new mini.Scene()
		.tween(this, 0.25, 'easeInQuad', { fadeness: 0.0 })
		.call(function() { this.isVisible = false; this.entry = ""; }.bind(this))
		.run();
};

// mini.Console.register()
// Registers a named entity with the console.
// Arguments:
//     name:    The name of the entity. This should not contain spaces.
//     that:    The value which will be bound to `this` when one of the entity's methods is executed.
//     methods: An associative array of functions, keyed by name, defining the valid operations
//              for this entity. One-word names are recommended and as with the entity name,
//              should not contain spaces.
mini.Console.register = function(name, that, methods)
{
	for (var instruction in methods) {
		this.commands.push({
			entity: name,
			instruction: instruction,
			that: that,
			method: methods[instruction]
		});
	}
};

// mini.Console.unregister()
// Unregisters a previously-registered entity.
// Arguments:
//     name: The name of the entity as passed to mini.Console.register().
mini.Console.unregister = function(name)
{
	this.commands = mini.Link(this.commands)
		.where(function(command) { return command.entity != name; })
		.toArray();
};

// mini.Console.show()
// Shows the console window.
mini.Console.show = function()
{
	new mini.Scene()
		.tween(this, 0.25, 'easeOutQuad', { fadeness: 1.0 })
		.call(function() { this.isVisible = true; }.bind(this))
		.run();
}

// mini.Console.write()
// Writes a line of text to the console.
mini.Console.write = function(text)
{
	if (this.log !== null && this.nextLine > 0) {
		var lineInBuffer = (this.nextLine - 1) % this.bufferSize;
		this.log.write(this.buffer[lineInBuffer]);
	}
	var lineInBuffer = this.nextLine % this.bufferSize;
	this.buffer[lineInBuffer] = ">" + text;
	++this.nextLine;
	this.lineOffset = 0.0;
};
