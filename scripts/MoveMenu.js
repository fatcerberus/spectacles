/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// MoveMenu() constructor
// Creates an object representing a move-choosing menu.
// Arguments:
//     battle: The Battle during which the menu will be shown.
//     unit:   The BattleUnit this menu belongs to.
function MoveMenu(battle, unit)
{
	this.defaultCursorColor = { red: 128, green: 128, blue: 128, alpha: 255 };
	this.drawers = [
		{ name: "Attack", topItem: 0 },
		{ name: "Item", topItem: 0 },
		{ name: "Defend", topItem: 0 }
	];
	this.lockedCursorColor = { red: 64, green: 64, blue: 64, alpha: 255 };
	
	this.animator = null;
	this.battle = battle;
	this.cursorColor = CreateColor(0, 0, 0, 0);
	this.drawer = null;
	this.drawerID = 0;
	this.dropFadeness = 0.0;
	this.fadeness = 0.0;
	this.font = null;
	this.isDropped = false;
	this.skillID = null;
	this.subCursorColor = CreateColor(0, 0, 0, 0);
	this.unit = unit;
	
	this.drawCursor = function(x, y, width, height, cursorColor, isLockedIn) {
		var color;
		var color2;
		if (isLockedIn) {
			color2 = cursorColor;
			color = BlendColors(color2, CreateColor(0, 0, 0, color2.alpha));
		} else {
			color = cursorColor;
			color2 = BlendColors(color, CreateColor(0, 0, 0, color.alpha));
		}
		var halfHeight = Math.round(height / 2);
		GradientRectangle(x, y, width, halfHeight, color2, color2, color, color);
		GradientRectangle(x, y + halfHeight, width, height - halfHeight, color, color, color2, color2);
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, color.alpha));
	};
	this.drawInfoText = function(x, y, width, alpha, text, title) {
		if (title === void null) { title = ""; }
		
		var titleWidth = this.font.getStringWidth(title);
		var textX = x + titleWidth + width - titleWidth;
		this.drawText(this.font, x, y - 2, 1, CreateColor(255, 192, 0, alpha), title);
		this.drawText(this.font, textX, y, 1, CreateColor(192, 192, 192, alpha), text, 'right');
	};
	this.drawItemBox = function(x, y, width, height, alpha, lockedIn, isSelected, cursorColor) {
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, Math.min(alpha + 16, 255)));
		Rectangle(x + 1, y + 1, width - 2, height - 2, CreateColor(0, 0, 0, alpha));
		if (isSelected) {
			this.drawCursor(x, y, width, height, cursorColor, lockedIn);
		}
	};
	this.drawText = function(font, x, y, shadowDistance, color, text, alignment) {
		var aligners = {
			left: function(font, x, text) { return x; },
			center: function(font, x, text) { return x - font.getStringWidth(text) / 2; },
			right: function(font, x, text) { return x - font.getStringWidth(text); }
		};
		
		alignment = alignment !== void null ? alignment : 'left';
		
		if (!(alignment in aligners)) {
			Abort("MoveMenu.drawText(): Invalid text alignment '" + alignment + "'.");
		}
		x = aligners[alignment](font, x, text);
		font.setColorMask(CreateColor(0, 0, 0, color.alpha));
		font.drawText(x + shadowDistance, y + shadowDistance, text);
		font.setColorMask(color);
		font.drawText(x, y, text);
	};
}

// .getInput() method
// Checks for player input and updates the state accordingly.
MoveMenu.prototype.getInput = function()
{
	if (this.animator !== null && this.animator.isRunning()) {
		while (AreKeysLeft()) { GetKey(); }
		return;
	}
	var key = AreKeysLeft() ? GetKey() : null;
	if (!this.isDropped) {
		if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_A)) {
			this.isDropped = true;
			this.animator = new Scenario()
				.beginFork()
					.tween(this.cursorColor, 0.25, 'linear', this.lockedCursorColor)
				.endFork()
				.beginFork()
					.tween(this.subCursorColor, 0.25, 'linear', this.defaultCursorColor)
				.endFork()
				.tween(this, 0.1, 'easeOutBack', { dropFadeness: 1.0 })
				.run();
		} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT)) {
			this.drawerID = (this.drawerID - 1) < 0 ? this.drawers.length - 1 : this.drawerID - 1;
		} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT)) {
			this.drawerID = (this.drawerID + 1) % this.drawers.length;
		}
	} else {
		if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_B)) {
			this.isDropped = false;
			this.animator = new Scenario()
				.beginFork()
					.tween(this.subCursorColor, 0.25, 'linear', { red: 0, green: 0, blue: 0, alpha: 0 })
				.endFork()
				.beginFork()
					.tween(this.cursorColor, 0.25, 'linear', this.defaultCursorColor)
				.endFork()
				.tween(this, 0.1, 'easeInBack', { dropFadeness: 0.0 })
				.run();
		}
	}
};

// .open() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.open = function()
{
	this.battle.suspend();
	this.battle.ui.hud.highlight(this.unit.name);
	this.font = GetSystemFont();
	this.animator = new Scenario()
		.beginFork()	
			.tween(this.cursorColor, 0.25, 'easeOutQuad', { red: 255, green: 255, blue: 255, alpha: 255 })
			.tween(this.cursorColor, 0.25, 'easeOutQuad', this.defaultCursorColor)
		.endFork()
		.tween(this, 1.0, 'easeOutBounce', { fadeness: 1.0 })
		.run();
	Threads.waitFor(Threads.createEntityThread(this, 10));
	this.battle.ui.hud.highlight(null);
	this.battle.resume();
	return null;
};

// .render() method
// Renders the menu in its current state.
MoveMenu.prototype.render = function()
{
	var itemWidth = 160 / this.drawers.length;
	var litTextColor = CreateColor(255, 255, 255, 255);
	var dimTextColor = CreateColor(128, 128, 128, 255);
	if (this.dropFadeness > 0.0) {
		var menuHeight = 4 * 18;
		var y = -(menuHeight + 34) * (1.0 - this.dropFadeness) + 34;
		Rectangle(0, y - (y - 34), 160, y - 34, CreateColor(0, 0, 0, 128));
		for (var i = 0; i < 4; ++i) {
			var itemY = y + i * 18;
			this.drawItemBox(0, itemY, 160, 18, 128, false, i == 0, this.subCursorColor);
			Rectangle(4, itemY + 2, 13, 13, CreateColor(128, 128, 128, 255));
			OutlinedRectangle(4, itemY + 2, 13, 13, CreateColor(0, 0, 0, 128));
			var textColor = i != 0 ? dimTextColor : BlendColorsWeighted(litTextColor, dimTextColor, this.subCursorColor.alpha, 1.0 - this.subCursorColor.alpha);
			this.drawText(this.font, 7, itemY + 2, 1, textColor, "2");
			this.drawText(this.font, 20, itemY + 3, 1, textColor, "Charge Slash");
			this.drawInfoText(119, itemY + 3, 37, textColor.alpha, "100%", "G");
		}
	}
	var y = -(18 + 16) * (1.0 - this.fadeness) + 16;
	for (var i = 0; i < this.drawers.length; ++i) {
		var x = Math.floor(i * itemWidth);
		var width = Math.floor((i + 1) * itemWidth) - x;
		this.drawItemBox(x, y, width, 18, 160, this.isDropped, i == this.drawerID, this.cursorColor);
		var textColor = i != this.drawerID ? dimTextColor : BlendColorsWeighted(litTextColor, dimTextColor, this.cursorColor.alpha, 1.0 - this.cursorColor.alpha);
		this.drawText(this.font, x + itemWidth / 2, y + 3, 1, textColor, this.drawers[i].name, 'center');
	}
};

// .update() method
// Updates the entity's state for the next frame.
MoveMenu.prototype.update = function()
{
	return this.skillID === null;
};
