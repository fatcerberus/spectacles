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
	this.drawers = [
		{ name: "Attack", topItem: 0 },
		{ name: "Item", topItem: 0 },
		{ name: "Defend", topItem: 0 }
	];
	
	this.animator = null;
	this.battle = battle;
	this.cursorColor = CreateColor(0, 0, 0, 0);
	this.drawer = null;
	this.dropFadeness = 0.0;
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.isDropped = false;
	this.moveCursor = 0;
	this.selection = null;
	this.subCursorColor = CreateColor(0, 0, 0, 0);
	this.topCursor = 0;
	this.unit = unit;
	
	this.chooseMoveAnimation = new Scenario()
		.fork()
			.tween(this.subCursorColor, 0.25, 'easeInOutSine', { red:80, green:20, blue:20, alpha:255 })
		.end()
		.fork()
			.tween(this, 0.25, 'easeInBack', { dropFadeness: 0.0 })
		.end()
		.tween(this, 0.25, 'easeInBack', { fadeness: 0.0 });
	this.hideMoveList = new Scenario()
		.fork()
			.tween(this.subCursorColor, 0.1, 'linear', { red:0, green:0, blue:0, alpha:0 })
		.end()
		.fork()
			.tween(this.cursorColor, 0.05, 'easeInOutSine', { red:160, green:40, blue:40, alpha:255 })
		.end()
		.tween(this, 0.25, 'easeInBack', { dropFadeness: 0.0 });
	this.showMenu = new Scenario()
		.fork()	
			.tween(this.cursorColor, 0.25, 'easeOutQuad', { red:255, green:0, blue:0, alpha:255 })
			.tween(this.cursorColor, 0.25, 'easeOutQuad', { red:0, green:128, blue:0, alpha:255 })
		.end()
		.tween(this, 0.5, 'easeOutBounce', { fadeness: 1.0 });
	this.showMoveList = new Scenario()
		.fork()
			.tween(this.cursorColor, 0.05, 'easeInOutSine', { red:80, green:20, blue:20, alpha:255 })
		.end()
		.fork()
			.tween(this.subCursorColor, 0.1, 'linear', { red:160, green:40, blue:40, alpha:255 })
		.end()
		.tween(this, 0.25, 'easeOutExpo', { dropFadeness: 1.0 });
	
	this.drawCursor = function(x, y, width, height, cursorColor, isLockedIn) {
		var color;
		var color2;
		color = cursorColor;
		color2 = BlendColorsWeighted(color, CreateColor(0, 0, 0, color.alpha), 0.5, 0.5);
		if (isLockedIn) {
			var mainColor = color;
			color = color2;
			color2 = mainColor;
		}
		var halfHeight = Math.round(height / 2);
		GradientRectangle(x, y, width, halfHeight, color2, color2, color, color);
		GradientRectangle(x, y + halfHeight, width, height - halfHeight, color, color, color2, color2);
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, color.alpha / 3));
	};
	this.drawItemBox = function(x, y, width, height, alpha, isSelected, isLockedIn, cursorColor) {
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, Math.min(alpha + 16, 255)));
		Rectangle(x + 1, y + 1, width - 2, height - 2, CreateColor(0, 0, 0, alpha));
		if (isSelected) {
			this.drawCursor(x, y, width, height, cursorColor, isLockedIn);
		}
	};
	this.drawSkillItem = function(x, y, skill, isSelected, isLockedIn) {
		var technique = skill.techniqueID
		var alpha = 255 * this.fadeness * this.dropFadeness;
		this.drawItemBox(x, y, 160, 18, alpha * 160 / 255, isSelected, isLockedIn, this.subCursorColor);
		Rectangle(x + 4, y + 2, 13, 13, CreateColor(128, 128, 128, alpha));
		OutlinedRectangle(x + 4, y + 2, 13, 13, CreateColor(0, 0, 0, alpha * 0.5));
		var titleColor = isSelected ? CreateColor(255, 192, 0, alpha) : CreateColor(160, 120, 0, alpha)
		var textColor = isSelected ? CreateColor(255, 255, 255, alpha) : CreateColor(160, 160, 160, alpha);
		this.drawText(this.font, x + 7, y + 2, 1, textColor, skill.technique.actions[0].rank);
		this.drawText(this.font, x + 20, y + 3, 1, textColor, skill.name);
		this.drawText(this.font, x + 142, y + 3, 1, titleColor, "R");
		this.drawText(this.font, x + 156, y + 1, 1, textColor, skill.technique.actions[0].rank, 'right');
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
	var key = AreKeysLeft() ? GetKey() : null;
	while (AreKeysLeft()) { GetKey(); }
	if (this.showMenu.isRunning()) {
		return;
	}
	if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_A)) {
		if (!this.isDropped) {
			this.isDropped = true;
			this.hideMoveList.stop();
			this.showMoveList.run();
		} else {
			this.selection = this.unit.skills[this.moveCursor];
			this.showMoveList.stop();
			this.chooseMoveAnimation.run();
		}
	} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_B)) {
		this.isDropped = false;
		this.showMoveList.stop();
		this.hideMoveList.run();
	} else if (!this.isDropped && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT)) {
		this.topCursor = this.topCursor - 1 < 0 ? this.drawers.length - 1 : this.topCursor - 1;
	} else if (!this.isDropped && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT)) {
		this.topCursor = (this.topCursor + 1) % this.drawers.length;
	} else if (this.isDropped && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_UP)) {
		this.moveCursor = this.moveCursor - 1 < 0 ? this.unit.skills.length - 1 : this.moveCursor - 1;
	} else if (this.isDropped && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN)) {
		this.moveCursor = (this.moveCursor + 1) % this.unit.skills.length;
	}
};

// .open() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.open = function()
{
	this.battle.suspend();
	this.battle.ui.hud.highlight(this.unit.name);
	this.isDropped = false;
	this.dropFadeness = 0.0;
	this.selection = null;
	this.showMenu.run();
	Threads.waitFor(Threads.createEntityThread(this, 10));
	this.battle.ui.hud.highlight(null);
	this.battle.resume();
	return this.selection;
};

// .render() method
// Renders the menu in its current state.
MoveMenu.prototype.render = function()
{
	var yOrigin = -(18 + 16) * (1.0 - this.fadeness) + 16;
	var itemWidth = 160 / this.drawers.length;
	var litTextColor = CreateColor(255, 255, 255, 255);
	var dimTextColor = CreateColor(192, 192, 192, 255);
	Rectangle(0, 16, 160, yOrigin - 16, CreateColor(0, 0, 0, 128));
	for (var i = 0; i < this.drawers.length; ++i) {
		var x = Math.floor(i * itemWidth);
		var width = Math.floor((i + 1) * itemWidth) - x;
		this.drawItemBox(x, yOrigin, width, 18, 184 * this.fadeness, i == this.topCursor, this.isDropped, this.cursorColor);
		var textColor = i == this.topCursor ? CreateColor(255, 255, 255, 255 * this.fadeness) : CreateColor(192, 192, 192, 255 * this.fadeness);
		this.drawText(this.font, x + itemWidth / 2, yOrigin + 3, 1, textColor, this.drawers[i].name, 'center');
	}
	if (this.dropFadeness > 0.0) {
		SetClippingRectangle(0, yOrigin + 18, 160, GetScreenHeight() - (yOrigin + 18));
		var height = this.unit.skills.length * 18;
		var y = yOrigin + 18 - height * (1.0 - this.dropFadeness);
		Rectangle(0, 34, 160, y - 34, CreateColor(0, 0, 0, 128 * this.fadeness)); 
		for (var i = 0; i < this.unit.skills.length; ++i) {
			var itemY = y + i * 18;
			this.drawSkillItem(0, itemY, this.unit.skills[i], i == this.moveCursor, this.chooseMoveAnimation.isRunning());
		}
		SetClippingRectangle(0, 0, GetScreenWidth(), GetScreenHeight())
	}
};

// .update() method
// Updates the entity's state for the next frame.
MoveMenu.prototype.update = function()
{
	return this.selection === null || this.chooseMoveAnimation.isRunning();
};
