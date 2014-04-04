/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// TargetMenu() constructor
// Creates an object representing a move targeting menu.
// Arguments:
//     unit:   The battler whose move's target will be selected.
//     battle: The battle session during which the menu will be shown.
//     usable: The move (skill or item) whose target is being determined.
function TargetMenu(unit, battle, usable)
{
	this.battle = battle;
	this.doChangeInfo = null;
	this.isChoiceMade = false;
	this.infoBoxFadeness = 1.0;
	this.infoFadeness = 1.0;
	this.multiTarget = false;
	this.statusInfo = null;
	this.cursorFont = GetSystemFont();
	this.infoFont = GetSystemFont();
	this.targets = [];
	this.unit = unit;
	this.unitToShowInfo = null;
	this.usable = usable;
	
	this.drawCursor = function(unit)
	{
		var width = this.cursorFont.getStringWidth(this.usable.name) + 10;
		var x = unit.actor.x < GetScreenWidth() / 2 ? unit.actor.x + 21 : unit.actor.x - 5 - width;
		var y = unit.actor.y + 6;
		Rectangle(x, y, width, 20, CreateColor(0, 0, 0, 128));
		OutlinedRectangle(x, y, width, 20, CreateColor(0, 0, 0, 64));
		DrawTextEx(this.cursorFont, x + width / 2, y + 4, this.usable.name, CreateColor(255, 255, 255, 255), 1, 'center');
	};
	
	this.drawInfoBox = function(x, y, width, height, alpha)
	{
		Rectangle(x, y, width, height, CreateColor(0, 0, 0, alpha * (1.0 - this.infoBoxFadeness)));
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 32 * (1.0 - this.infoBoxFadeness)));
	};
	
	this.moveCursor = function(direction)
	{
		if (this.targets.length > 1) {
			return;
		}
		var position = this.targets[0].actor.position;
		var candidates = this.battle.alliesOf(this.targets[0]);
		var unitToSelect = null;
		while (unitToSelect === null) {
			position += direction;
			position = position > 2 ? 0 :
				position < 0 ? 2 :
				position;
			for (var i = 0; i < candidates.length; ++i) {
				if (position == candidates[i].actor.position) {
					unitToSelect = candidates[i];
					break;
				}
			}
		}
		if (unitToSelect !== this.targets[0]) {
			this.targets = [ unitToSelect ];
			this.updateInfo();
		}
	};
	
	this.updateInfo = function()
	{
		var unit = this.targets.length == 1 ? this.targets[0] : null;
		if (this.doChangeInfo != null) {
			this.doChangeInfo.stop();
		}
		this.doChangeInfo = new Scenario()
			.fork()
				.tween(this, 0.25, 'easeInBack', { infoBoxFadeness: 1.0 })
			.end()
			.tween(this, 0.25, 'easeInOutSine', { infoFadeness: 1.0 })
			.synchronize()
			.call(function() { this.unitToShowInfo = unit; }.bind(this))
			.fork()
				.tween(this, 0.25, 'easeOutBack', { infoBoxFadeness: 0.0 })
			.end()	
			.tween(this, 0.25, 'easeInOutSine', { infoFadeness: 0.0 })
			.run();
	};
}

// .getInput() method
// Checks for player input and updates the state of the menu accordingly.
TargetMenu.prototype.getInput = function()
{
	switch (AreKeysLeft() ? GetKey() : null) {
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_A):
			new Scenario()
				.fork()
					.tween(this, 0.25, 'easeInBack', { infoBoxFadeness: 1.0 })
				.end()
				.tween(this, 0.25, 'easeInOutSine', { infoFadeness: 1.0 })
				.synchronize()
				.call(function() { this.isChoiceMade = true; }.bind(this))
				.run();
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_B):
			this.targets = null;
			new Scenario()
				.fork()
					.tween(this, 0.25, 'easeInBack', { infoBoxFadeness: 1.0 })
				.end()
				.tween(this, 0.25, 'easeInOutSine', { infoFadeness: 1.0 })
				.synchronize()
				.call(function() { this.isChoiceMade = true; }.bind(this))
				.run();
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_UP):
			this.moveCursor(-1);
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN):
			this.moveCursor(1);
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT):
			if (!this.multiTarget) {
				this.targets = [ this.battle.enemiesOf(this.unit)[0] ];
			} else {
				this.targets = this.battle.enemiesOf(this.unit);
			}
			this.updateInfo();
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT):
			if (!this.multiTarget) {
				this.targets = [ this.unit ];
			} else {
				this.targets = this.battle.alliesOf(this.unit);
			}
			this.updateInfo();
			break;
	}
};

// .open() method
// Opens the targeting menu and waits for the player to select a target.
// Returns:
//     A list of all units chosen by the player.
TargetMenu.prototype.open = function()
{
	this.isChoiceMade = false;
	this.targets = this.usable.defaultTargets(this.unit);
	this.multiTarget = this.targets.length > 1;
	this.updateInfo();
	while (AreKeysLeft()) {
		GetKey();
	}
	Threads.waitFor(Threads.createEntityThread(this, 10));
	return this.targets;
};

// .render() method
// Renders the menu in its current state.
TargetMenu.prototype.render = function()
{
	if (this.targets !== null) {
		for (var i = 0; i < this.targets.length; ++i) {
			this.drawCursor(this.targets[i]);
		}
	}
	if (this.unitToShowInfo != null) {
		SetClippingRectangle(0, 16, 160, GetScreenHeight() - 16);
		var textAlpha = 255 * (1.0 - this.infoBoxFadeness) * (1.0 - this.infoFadeness);
		if (true || this.unitToShowInfo.isPartyMember()) {
			var statuses = this.unitToShowInfo.statuses;
			var nameBoxHeight = 20 + 12 * statuses.length;
			var y = 16 - (nameBoxHeight + 20) * this.infoBoxFadeness;
			Rectangle(0, 16, 160, y - 16, CreateColor(0, 0, 0, 128 * (1.0 - this.infoBoxFadeness)));
			this.drawInfoBox(0, y, 160, nameBoxHeight, 160);
			DrawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, CreateColor(192, 192, 192, textAlpha), 1, 'center');
			var statusColor = this.unitToShowInfo.statuses.length == 0 ?
				CreateColor(96, 192, 96, textAlpha) :
				CreateColor(192, 192, 96, textAlpha);
			for (var i = 0; i < statuses.length; ++i) {
				DrawTextEx(this.infoFont, 80, y + 16 + 12 * i, statuses[i].name, CreateColor(192, 192, 96, textAlpha), 1, 'center');
			}
			this.drawInfoBox(0, y + nameBoxHeight, 80, 20, 128);
			DrawTextEx(this.infoFont, 40, y + nameBoxHeight + 4, "HP: " + this.unitToShowInfo.hp, CreateColor(192, 192, 144, textAlpha), 1, 'center');
			this.drawInfoBox(80, y + nameBoxHeight, 80, 20, 128);
			DrawTextEx(this.infoFont, 120, y + nameBoxHeight + 4, "MP: " + this.unitToShowInfo.mpPool.availableMP, CreateColor(192, 192, 144, textAlpha), 1, 'center');
		} else {
			var y = 16 - 20 * this.infoBoxFadeness;
			Rectangle(0, 16, 160, y - 16, CreateColor(0, 0, 0, 128 * (1.0 - this.infoBoxFadeness)));
			this.drawInfoBox(0, y, 160, 20, 160);
			DrawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, CreateColor(192, 192, 192, textAlpha), 1, 'center');
		}
		SetClippingRectangle(0, 0, GetScreenWidth(), GetScreenHeight());
	}
}

// .update() method
// Updates the menu for the next frame.
TargetMenu.prototype.update = function()
{
	return !this.isChoiceMade;
}
