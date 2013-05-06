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
		damage: { color: CreateColor(255, 255, 255, 255), yStart: 32, yEnd: 0, easing: 'easeOutBounce', duration: 1.5 },
		heal: { color: CreateColor(64, 255, 128, 255), yStart: 4, yEnd: 24, easing: 'easeOutBack', duration: 2.0 }
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
		this.enterTween = new Tween(this, 0.5, 'linear', { x: newX });
		Threads.doWith(this, function() {
			return !this.enterTween.isFinished();
		});
	} else {
		this.x = newX;
	}
};

// .showMessage() method
// Displays status text over the sprite.
// Arguments:
//     amount: The amount of damage taken.
BattleSprite.prototype.showMessage = function(text, style)
{
	styleInfo = this.messageStyles[style];
	var message = {
		text: text,
		color: styleInfo.color,
		height: styleInfo.yStart,
		endTime: styleInfo.duration * 1000 + GetTime()
	};
	var tween = new Tween(message, styleInfo.duration - 1.0, styleInfo.easing, { height: styleInfo.yEnd });
	message.tween = tween;
	this.messages.push(message);
};
