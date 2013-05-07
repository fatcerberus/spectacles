/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("Core/Tween.js");

RequireScript("lib/SpriteImage.js");

// BattleSprite() constructor
// Creates an object representing a battler sprite.
// Arguments:
//     unit:           The BattleUnit this sprite represents.
//     position:       The position of the unit in the party order.
//     row:            The row (front, middle, rear) that the battler is in.
//     isMirrored:     If true, the sprite enters from the right. Otherwise, it enters from the left.
//     isAlreadyThere: If true, the sprite is immediately displayed on the battlefield. If this is false,
//                     .enter() must be called to bring the sprite out.
function BattleSprite(unit, position, row, isMirrored, isAlreadyThere)
{
	this.messageStyles = {
		afflict: { color: CreateColor(255, 255, 0, 255), yStart: 4, yEnd: 16, easing: 'easeOutBack', duration: 1.0, delay: 0.5 },
		damage: { color: CreateColor(255, 255, 255, 255), yStart: 32, yEnd: 0, easing: 'easeOutBounce', duration: 0.5, delay: 0.25 },
		dispel: { color: CreateColor(192, 192, 0, 255), yStart: 16, yEnd: 0, easing: 'easeInBack', duration: 0.5, delay: 0.5 },
		evade: { color: CreateColor(192, 192, 160, 255), yStart: 48, yEnd: 0, easing: 'easeOutElastic', duration: 0.5, delay: 0.25 },
		heal: { color: CreateColor(64, 255, 128, 255), yStart: 4, yEnd: 24, easing: 'easeOutQuad', duration: 1.0, delay: 0.25 }
	};
	
	this.render = function() {
		var direction;
		Rectangle(this.x + 1, this.y + 1, 14, 30, CreateColor(32, 32, 32, 255));
		this.idFont.setColorMask(CreateColor(128, 128, 128, 255));
		this.idFont.drawText(this.x + 5, this.y + 17, this.unit.name[0]);
		for (var i = 0; i < this.messages.length; ++i) {
			var message = this.messages[i];
			var x = this.x + 8 - this.idFont.getStringWidth(message.text) / 2;
			var y = this.y + 20 - message.height;
			this.idFont.setColorMask(CreateColor(0, 0, 0, 255));
			this.idFont.drawText(x + 1, y + 1, message.text);
			this.idFont.setColorMask(message.color);
			this.idFont.drawText(x, y, message.text);
		}
	};
	this.update = function() {
		for (var i = 0; i < this.messages.length; ++i) {
			if (GetTime() >= this.messages[i].endTime) {
				this.messages.splice(i, 1);
			}
		}
		return true;
	};
	
	this.unit = unit;
	this.position = position;
	this.isMirrored = isMirrored;
	this.idFont = GetSystemFont(); /*ALPHA*/
	this.rowValue = row;
	this.x = isMirrored ? 320 : -16;
	this.y = -32;
	this.messages = [];
	switch (this.position) {
		case 0: this.y = 160; break;
		case 1: this.y = 128; break;
		case 2: this.y = 192; break;
	}
	this.state = "idle";
	if (isAlreadyThere) {
		this.enter(true);
	}
	this.thread = Threads.createEntityThread(this, 1);
};

// .dispose() method
// Frees any resources used by the BattleSprite.
BattleSprite.prototype.dispose = function()
{
	Threads.kill(this.thread);
};

// .row property
// Gets or sets the sprite's current row.
// Returns:
//     A member of the BattleRow object specifying the sprite's current row.
BattleSprite.prototype.row getter = function()
{
	return this.rowValue;
};
BattleSprite.prototype.row setter = function(value)
{
	this.rowValue = value;
};

// .enter() method
// Causes the battle sprite to enter the battlefield from offscreen.
// Arguments:
//     isImmediate: If true, the sprite is displayed in its final location immediately instead of walking in.
BattleSprite.prototype.enter = function(isImmediate)
{
	if (isImmediate === void null) { isImmediate = false; }
	
	var newX = this.isMirrored ? 256 + this.row * 16 : 48 - this.row * 16;
	if (!isImmediate) {
		this.enterTween = new Tween(this, 1.0, 'linear', { x: newX });
		Threads.doWith(this.enterTween, function() {
			return !this.isFinished();
		});
	} else {
		this.x = newX;
	}
};

// .showMessage() method
// Displays a message over the sprite.
// Arguments:
//     text:          The text to display.
//     styleName:     The name of the message style to use. The message style can be one of the following:
//                        'afflict': Used to display a newly acquired status effect.
//                        'damage': Used to display HP lost as damage.
//                        'dispel': Used to display a newly lost status effect.
//                        'heal': Used to display HP regained.
//                        'evade': Used to display evasion messages (miss, immune, etc.).
//     waitUntilDone: Optional. If true, .showMessage() won't return until the message times out. The
//                    default is false.
BattleSprite.prototype.showMessage = function(text, styleName, waitUntilDone)
{
	if (waitUntilDone === void null) { waitUntilDone = false; }
	
	style = this.messageStyles[styleName];
	var message = {
		text: text,
		color: style.color,
		height: style.yStart,
		endTime: (style.duration + style.delay) * 1000 + GetTime()
	};
	this.messages.push(message);
	new Tween(message, style.duration, style.easing, { height: style.yEnd });
	if (waitUntilDone) {
		Threads.doWith(message, function() {
			return GetTime() < this.endTime;
		});
	}
};
