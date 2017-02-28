/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2012 Power-Command
***/

// BattleActor() constructor
// Creates an object representing a battle screen actor.
// Arguments:
//     name:     The actor's name.
//     position: The position of the battler in the party order. The leader should be in position 1 (center)
//               while the left and right flanks are positions 0 and 2, respectively.
//     row:      The row (front, middle, rear) that the battler is in.
//     isEnemy:  If true, the actor plays an enemy and enters from the left. Otherwise, it enters from the
//               right.
function BattleActor(name, position, row, isEnemy)
{
	this.damages = [];
	this.fadeScene = null;
	this.hasEntered = false;
	this.healings = [];
	this.isEnemy = isEnemy;
	this.isVisible = true;
	this.messageFont = GetSystemFont();
	this.name = name;
	this.opacity = 1.0;
	this.position = isEnemy ? position : 2 - position;
	this.row = row;
	this.sprite = new SpriteImage('battlers/' + name + '.rss');
	this.sprite.direction = isEnemy ? 'east' : 'west';
	this.x = isEnemy ? -32 : 320;
	this.y = 168 - position * 32;
};

// .animate() method
// Instructs the actor to act out a battler action.
// Arguments:
//     animationID: The ID of the animation to perform.
BattleActor.prototype.animate = function(animationID)
{
	// TODO: implement me!
	switch (animationID) {
		case 'die':
			this.sprite.direction = 'north';
			new scenes.Scene()
				.tween(this, 60, 'easeInOutSine', { opacity: 0.1 })
				.run();
			break;
		case 'revive':
			new scenes.Scene()
				.tween(this, 60, 'easeInOutSine', { opacity: 1.0 })
				.call(function() { this.sprite.direction = this.isEnemy ? 'east' : 'west'; }.bind(this))
				.run();
			break;
		case 'sleep':
			new scenes.Scene()
				.talk("maggie", 2.0, this.name + " fell asleep! Hey, does that mean I get to eat him now?")
				.run(true);
			break;
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
	var newX = this.isEnemy ? 64 - this.row * 32 : 224 + this.row * 32;
	var threadID = null;
	if (!isImmediate) {
		var entrance = new scenes.Scene()
			.tween(this, 90, 'linear', { x: newX })
			.run(true);
	} else {
		this.x = newX;
	}
	this.sprite.stop();
	this.hasEntered = true;
	return threadID;
};

// .render() method
// Renders the BattleActor in its current state.
BattleActor.prototype.render = function()
{
	if (!this.isVisible && this.damages.length == 0 && this.healings.length == 0) {
		return;
	}
	this.sprite.blit(this.x, this.y, this.opacity * 255);
	for (var i = 0; i < this.damages.length; ++i) {
		var text = this.damages[i].text;
		var x = this.x + 16 - this.messageFont.getStringWidth(text) / 2;
		for (var i2 = 0; i2 < text.length; ++i2) {
			var yName = 'y' + i2.toString();
			var y = this.y + this.damages[i][yName];
			var color = this.damages[i].color !== null ? this.damages[i].color
				: CreateColor(255, 255, 255, 255);
			drawTextEx(this.messageFont, x, y, text[i2], color, 1);
			x += this.messageFont.getStringWidth(text[i2]);
		}
	}
	for (var i = 0; i < this.healings.length; ++i) {
		var y = this.y + this.healings[i].y;
		var color = this.healings[i].color !== null ? this.healings[i].color : CreateColor(64, 255, 128, 255);
		var textColor = BlendColors(color, color);
		textColor.alpha *= this.healings[i].alpha / 255;
		drawTextEx(this.messageFont, this.x + 16, y, this.healings[i].amount, textColor, 1, 'center');
	}
};

// .showDamage() method
// Displays damage taken.
// Arguments:
//     amount: The number of hit points lost.
//     color:  Optional. The color of the damage message. If this is not provided
//             or is null, the damage will be shown in the default color.
BattleActor.prototype.showDamage = function(amount, color)
{
	color = color !== void null ? color : null;
	
	var finalY = 20 - 11 * this.damages.length;
	var data = { text: amount.toString(), color: color, finalY: finalY };
	var tweenInfo = {};
	for (var i = 0; i < data.text.length; ++i) {
		var yName = 'y' + i.toString();
		data[yName] = finalY - (20 - i * 5);
		tweenInfo[yName] = finalY;
	}
	data.scene = new scenes.Scene()
		.tween(data, 30, 'easeOutBounce', tweenInfo)
		.pause(15);
	data.scene.run();
	this.damages.push(data);
};

// .showHealing() method
// Displays recovered HP.
// Arguments:
//     amount: The number of hit points recovered.
//     color:  Optional. The color of the healing indicator. If this is not provided
//             or is null, the indicator will be shown in the default color.
BattleActor.prototype.showHealing = function(amount, color)
{
	color = color !== void null ? color : null;
	
	var data = { amount: amount, color: color, y: 20, alpha: 255 };
	data.scene = new scenes.Scene()
		.tween(data, 60, 'easeOutExpo', { y: -11 * this.healings.length })
		.tween(data, 30, 'easeInOutSine', { alpha: 0 });
	data.scene.run();
	this.healings.push(data);
};

// .update() method
// Updates the entity's state for the next frame.
BattleActor.prototype.update = function()
{
	this.sprite.update();
	for (var i = 0; i < this.damages.length; ++i) {
		var data = this.damages[i];
		var finalY = 20 - 11 * i;
		if (data.finalY != finalY) {
			data.scene.stop();
			data.finalY = finalY;
			var tweenInfo = {};
			for (var i2 = 0; i2 < data.text.length; ++i2) {
				var yName = 'y' + i2.toString();
				tweenInfo[yName] = finalY;
			}
			data.scene = new scenes.Scene()
				.tween(data, 30, 'easeOutBounce', tweenInfo)
				.pause(15);
			data.scene.run();
		}
		if (!data.scene.isRunning()) {
			this.damages.splice(i, 1);
			--i;
		}
	}
	for (var i = 0; i < this.healings.length; ++i) {
		if (!this.healings[i].scene.isRunning()) {
			this.healings.splice(i, 1);
			--i;
		}
	}
	return true;
};
