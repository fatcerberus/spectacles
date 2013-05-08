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
//     name:         The name of the battler this sprite represents.
//     position:     The position of the unit in the party order.
//     row:          The row (front, middle, rear) that the battler is in.
//     isMirrored:   If true, the sprite enters from the right. Otherwise, it enters from the left.
function BattleSprite(name, position, row, isMirrored)
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
		this.idFont.drawText(this.x + 5, this.y + 17, this.name[0]);
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
	
	this.name = name;
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
	this.hasEntered = false;
};

// .dispose() method
// Frees all outstanding resources associated with the BattleSprite.
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
	
	if (this.hasEntered) {
		return;
	}
	var newX = this.isMirrored ? 256 + this.row * 16 : 48 - this.row * 16;
	if (!isImmediate) {
		this.enterTween = new Tween(this, 1.0, 'linear', { x: newX });
		Threads.doWith(this.enterTween, function() {
			return !this.isFinished();
		});
	} else {
		this.x = newX;
	}
	this.hasEntered = true;
};

// .showMessage() method
// Displays a message over the sprite.
// Arguments:
//     text:          The text to display.
//     styleName:     The name of the message style to use. Can be one of the following:
//                        'afflict': Used to display a newly acquired status effect.
//                        'damage': Used to display HP lost as damage.
//                        'dispel': Used to display a newly lost status effect.
//                        'heal': Used to display HP regained.
//                        'evade': Used to display evasion messages (miss, immune, etc.).
BattleSprite.prototype.showMessage = function(text, styleName)
{
	style = this.messageStyles[styleName];
	var message = {
		text: text,
		color: style.color,
		height: style.yStart,
		endTime: (style.duration + style.delay) * 1000 + GetTime()
	};
	this.messages.push(message);
	new Tween(message, style.duration, style.easing, { height: style.yEnd });
};
