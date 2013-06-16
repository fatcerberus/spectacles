/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
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
	this.hasEntered = false;
	this.healings = [];
	this.isEnemy = isEnemy;
	this.isVisible = true;
	this.messageFont = GetSystemFont();
	this.name = name;
	this.position = isEnemy ? position : 2 - position;
	this.row = row;
	this.x = isEnemy ? -16 : 320;
	this.y = 192 - position * 32;
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
	var newX = this.isEnemy ? 48 - this.row * 16 : 256 + this.row * 16;
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
	if (!this.isVisible && this.damages.length == 0 && this.healings.length == 0) {
		return;
	}
	OutlinedRectangle(this.x, this.y, 16, 32, CreateColor(0, 0, 0, 255));
	Rectangle(this.x + 1, this.y + 1, 14, 30, CreateColor(32, 32, 32, 255));
	DrawTextEx(this.messageFont, this.x + 5, this.y + 17, this.name[0], CreateColor(128, 128, 128, 255));
	for (var i = 0; i < this.damages.length; ++i) {
		var y = this.y + this.damages[i].y;
		DrawTextEx(this.messageFont, this.x + 8, y, this.damages[i].amount, CreateColor(255, 255, 255, 255), 1, 'center');
	}
	for (var i = 0; i < this.healings.length; ++i) {
		var y = this.y + this.healings[i].y;
		DrawTextEx(this.messageFont, this.x + 8, y, this.healings[i].amount, CreateColor(64, 255, 128, this.healings[i].alpha), 1, 'center');
	}
};

// .showDamage() method
// Displays damage taken.
// Arguments:
//     amount: The number of hit points lost.
BattleActor.prototype.showDamage = function(amount)
{
	var finalY = 20 - 11 * this.damages.length;
	var data = { amount: amount, finalY: finalY, y: finalY - 20 };
	data.scene = new Scenario()
		.tween(data, 0.5, 'easeOutBounce', { y: finalY })
		.pause(0.25);
	data.scene.run();
	this.damages.push(data);
};

// .showHealing() method
// Displays recovered HP.
// Arguments:
//     amount: The number of hit points recovered.
BattleActor.prototype.showHealing = function(amount)
{
	var data = { amount: amount, y: 20, alpha: 255 };
	data.scene = new Scenario()
		.tween(data, 1.0, 'easeOutExpo', { y: 0 })
		.tween(data, 0.5, 'easeInOutSine', { alpha: 0 });
	data.scene.run();
	this.healings.push(data);
};

// .update() method
// Updates the entity's state for the next frame.
BattleActor.prototype.update = function()
{
	for (var i = 0; i < this.damages.length; ++i) {
		var data = this.damages[i];
		var finalY = 20 - 11 * i;
		if (data.finalY != finalY) {
			data.scene.stop();
			data.finalY = finalY;
			data.scene = new Scenario()
				.tween(data, 0.5, 'easeOutBounce', { y: finalY })
				.pause(0.25);
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
