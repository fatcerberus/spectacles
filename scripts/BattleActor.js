/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// BattleActor() constructor
// Creates an object representing a battle screen actor.
// Arguments:
//     name:         The actor's name.
//     position:     The position of the battler in the party order.
//     row:          The row (front, middle, rear) that the battler is in.
//     isMirrored:   If true, the actor enters from the right. Otherwise, it enters from the left.
function BattleActor(name, position, row, isMirrored)
{
	this.messageStyles = {
		afflict: { color: CreateColor(255, 255, 0, 255), yStart: 4, yEnd: 16, easing: 'easeOutBack', duration: 1.0, delay: 0.5 },
		damage: { color: CreateColor(255, 255, 255, 255), yStart: 32, yEnd: 0, easing: 'easeOutBounce', duration: 0.5, delay: 0.25 },
		dispel: { color: CreateColor(192, 192, 0, 255), yStart: 16, yEnd: 0, easing: 'easeInBack', duration: 0.5, delay: 0.5 },
		evade: { color: CreateColor(192, 192, 160, 255), yStart: 48, yEnd: 0, easing: 'easeOutElastic', duration: 0.5, delay: 0.25 },
		heal: { color: CreateColor(64, 255, 128, 255), yStart: 4, yEnd: 24, easing: 'easeOutQuad', duration: 1.0, delay: 0.25 }
	};
	
	this.hasEntered = false;
	this.idFont = GetSystemFont(); /*ALPHA*/
	this.isMirrored = isMirrored;
	this.isVisible = true;
	this.messages = [];
	this.name = name;
	this.position = position;
	this.row = row;
	this.x = this.isMirrored ? 320 : -16;
	this.y = -32;
	switch (this.position) {
		case 0: this.y = 160; break;
		case 1: this.y = 128; break;
		case 2: this.y = 192; break;
	}
};

// .animate() method
// Instructs the actor to act out a battler action.
// Arguments:
//     animationID: The ID of the animation to perform.
BattleActor.prototype.animate = function(animationID)
{
	if (animationID == 'die') {
		this.isVisible = false;
	}
};

// .enter() method
// Instructs the actor to enter the battlefield from off-screen.
// Arguments:
//     isImmediate: If true, the sprite jumps to its final position immediately.
// Returns:
//     The thread ID for the entrance animation, or null of no thread was created.
BattleActor.prototype.enter = function(isImmediate)
{
	if (isImmediate === void null) { isImmediate = false; }
	
	if (this.hasEntered) {
		return;
	}
	var newX = this.isMirrored ? 256 + this.row * 16 : 48 - this.row * 16;
	var threadID = null;
	if (!isImmediate) {
		var entrance = new Scenario()
			.tween(this, 1.0, 'linear', { x: newX })
			.run();
		threadID = Threads.doWith(entrance, function() {
			return this.isRunning();
		});
	} else {
		this.x = newX;
	}
	this.hasEntered = true;
	return threadID;
};

// .render() method
// Renders the BattleActor in its current state.
BattleActor.prototype.render = function()
{
	if (!this.isVisible) {
		return;
	}
	OutlinedRectangle(this.x, this.y, 16, 32, CreateColor(0, 0, 0, 255));
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
BattleActor.prototype.showMessage = function(text, styleName)
{
	style = this.messageStyles[styleName];
	var message = {
		text: text,
		color: style.color,
		height: style.yStart,
		framesLeft: (style.duration + style.delay) * Engine.frameRate
	};
	this.messages.push(message);
	new Scenario()
		.tween(message, style.duration, style.easing, { height: style.yEnd })
		.run();
};

// .update() method
// Updates the entity's state for the next frame.
BattleActor.prototype.update = function()
{
	for (var i = 0; i < this.messages.length; ++i) {
		--this.messages[i].framesLeft;
		if (this.messages[i].framesLeft <= 0) {
			this.messages.splice(i, 1);
		}
	}
	return true;
};
