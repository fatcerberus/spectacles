/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

// TargetMenu() constructor
// Creates an object representing a move targeting menu.
// Arguments:
//     unit:      The battler whose move's target will be selected.
//     battle:    The battle session during which the menu will be shown.
//     usable:    Optional. If specified and not null, the Usable move whose target is being determined.
//     moveName:  Optional. The move name displayed while selecting a target. If not specified or null,
//                the move name will be taken from the Usable.
function TargetMenu(unit, battle, usable, moveName)
{
	usable = usable !== void null ? usable : null;
	moveName = moveName !== void null ? moveName : null;
	
	this.battle = battle;
	this.doChangeInfo = null;
	this.isChoiceMade = false;
	this.infoBoxFadeness = 1.0;
	this.infoFadeness = 1.0;
	this.isTargetScanOn = from(battle.alliesOf(unit))
		.where(unit => unit.isAlive())
		.any(unit => unit.allowTargetScan);
	this.isTargetLocked = false;
	this.isGroupCast = false;
	this.name = moveName !== null ? moveName
		: usable !== null ? usable.name
		: unit.name;
	this.statusNames = null;
	this.cursorFont = GetSystemFont();
	this.infoFont = GetSystemFont();
	this.targets = [];
	this.unit = unit;
	this.unitToShowInfo = null;
	this.usable = usable;
	this.allowDeadUnits = usable !== null ? usable.allowDeadTarget : false;
	
	this.drawCursor = function(unit)
	{
		var width = this.cursorFont.getStringWidth(this.name) + 10;
		var x = unit.actor.x < GetScreenWidth() / 2 ? unit.actor.x + 37 : unit.actor.x - 5 - width;
		var y = unit.actor.y + 6;
		Rectangle(x, y, width, 20, CreateColor(0, 0, 0, 128));
		OutlinedRectangle(x, y, width, 20, CreateColor(0, 0, 0, 64));
		drawTextEx(this.cursorFont, x + width / 2, y + 4, this.name, CreateColor(255, 255, 255, 255), 1, 'center');
	};
	
	this.drawInfoBox = function(x, y, width, height, alpha)
	{
		Rectangle(x, y, width, height, CreateColor(0, 0, 0, alpha * (1.0 - this.infoBoxFadeness)));
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 32 * (1.0 - this.infoBoxFadeness)));
	};
	
	this.moveCursor = function(direction)
	{
		if (this.isGroupCast || this.targets == null)
			return;
		var position = this.targets[0].actor.position;
		var candidates = this.battle.alliesOf(this.targets[0]);
		var unitToSelect = null;
		while (unitToSelect === null) {
			position += direction;
			position = position > 2 ? 0 :
				position < 0 ? 2 :
				position;
			for (var i = 0; i < candidates.length; ++i) {
				if (position == candidates[i].actor.position
					&& (candidates[i].isAlive() || this.allowDeadUnits))
				{
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
		this.doChangeInfo = new scenes.Scene()
			.fork()
				.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
			.end()
			.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
			.resync()
			.call(function() {
				this.unitToShowInfo = unit;
				if (this.unitToShowInfo !== null) {
					this.statusNames = !this.unitToShowInfo.isAlive() ? [ "Knocked Out" ] : [];
					for (var i = 0; i < this.unitToShowInfo.statuses.length; ++i) {
						this.statusNames.push(this.unitToShowInfo.statuses[i].name);
					}
				}
			}.bind(this))
			.fork()
				.tween(this, 15, 'easeOutBack', { infoBoxFadeness: 0.0 })
			.end()	
			.tween(this, 15, 'easeInOutSine', { infoFadeness: 0.0 })
			.run();
	};
}

// .getInput() method
// Checks for player input and updates the state of the menu accordingly.
TargetMenu.prototype.getInput = function()
{
	switch (AreKeysLeft() ? GetKey() : null) {
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_A):
			new scenes.Scene()
				.fork()
					.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
				.end()
				.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
				.resync()
				.call(function() { this.isChoiceMade = true; }.bind(this))
				.run();
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_B):
			this.targets = null;
			new scenes.Scene()
				.fork()
					.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
				.end()
				.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
				.resync()
				.call(function() { this.isChoiceMade = true; }.bind(this))
				.run();
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_UP):
			if (!this.isTargetLocked) {
				this.moveCursor(-1);
			}
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN):
			if (!this.isTargetLocked) {
				this.moveCursor(1);
			}
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT):
			if (!this.isTargetLocked && this.targets != null) {
				if (!this.isGroupCast) {
					this.targets = [ this.battle.enemiesOf(this.unit)[0] ];
				} else {
					this.targets = this.battle.enemiesOf(this.unit);
				}
				this.updateInfo();
			}
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT):
			if (!this.isTargetLocked && this.targets != null) {
				if (!this.isGroupCast) {
					this.targets = [ this.unit ];
				} else {
					this.targets = this.battle.alliesOf(this.unit);
				}
				this.updateInfo();
			}
			break;
	}
};

TargetMenu.prototype.lockTargets = function(targetUnits)
{
	this.targets = targetUnits;
	this.isTargetLocked = true;
};


// .open() method
// Opens the targeting menu and waits for the player to select a target.
// Returns:
//     A list of all units chosen by the player.
TargetMenu.prototype.open = function()
{
	this.isChoiceMade = false;
	if (!this.isTargetLocked) {
		this.targets = this.usable !== null
			? this.usable.defaultTargets(this.unit)
			: [ this.battle.enemiesOf(this.unit)[0] ];
	}
	this.isGroupCast = this.usable !== null ? this.usable.isGroupCast : false;
	this.updateInfo();
	while (AreKeysLeft()) {
		GetKey();
	}
	threads.join(threads.create(this, 10));
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
		if (this.isTargetScanOn || this.unitToShowInfo.isPartyMember()) {
			var nameBoxHeight = 20 + 12 * this.statusNames.length;
			var y = 16 - (nameBoxHeight + 20) * this.infoBoxFadeness;
			Rectangle(0, 16, 160, y - 16, CreateColor(0, 0, 0, 128 * (1.0 - this.infoBoxFadeness)));
			this.drawInfoBox(0, y, 160, nameBoxHeight, 160);
			drawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, CreateColor(192, 192, 192, textAlpha), 1, 'center');
			var statusColor = this.statusNames.length == 0 ?
				CreateColor(96, 192, 96, textAlpha) :
				CreateColor(192, 192, 96, textAlpha);
			for (var i = 0; i < this.statusNames.length; ++i) {
				drawTextEx(this.infoFont, 80, y + 16 + 12 * i, this.statusNames[i], CreateColor(192, 192, 96, textAlpha), 1, 'center');
			}
			this.drawInfoBox(0, y + nameBoxHeight, 80, 20, 128);
			drawTextEx(this.infoFont, 40, y + nameBoxHeight + 4, "HP: " + this.unitToShowInfo.hp, CreateColor(192, 192, 144, textAlpha), 1, 'center');
			this.drawInfoBox(80, y + nameBoxHeight, 80, 20, 128);
			drawTextEx(this.infoFont, 120, y + nameBoxHeight + 4, "MP: " + this.unitToShowInfo.mpPool.availableMP, CreateColor(192, 192, 144, textAlpha), 1, 'center');
		} else {
			var y = 16 - 20 * this.infoBoxFadeness;
			Rectangle(0, 16, 160, y - 16, CreateColor(0, 0, 0, 128 * (1.0 - this.infoBoxFadeness)));
			this.drawInfoBox(0, y, 160, 20, 160);
			drawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, CreateColor(192, 192, 192, textAlpha), 1, 'center');
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
