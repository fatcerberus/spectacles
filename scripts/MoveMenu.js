/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("TargetMenu.js");

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
	this.lockedCursorColor = CreateColor(80, 20, 20, 255);
	this.normalCursorColor = CreateColor(160, 40, 40, 255);
	
	this.animator = null;
	this.battle = battle;
	this.topCursorColor = CreateColor(0, 0, 0, 0);
	this.drawer = null;
	this.dropFadeness = 0.0;
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.healthyColor
	this.isDropped = false;
	this.moveCursor = 0;
	this.moveCursorColor = CreateColor(0, 0, 0, 0);
	this.selection = null;
	this.moveCursorColor = CreateColor(0, 0, 0, 0);
	this.topCursor = 0;
	this.unit = unit;
	
	this.chooseMoveAnimation = new Scenario()
		.fork()
			.tween(this.moveCursorColor, 0.25, 'easeInOutSine', this.lockedCursorColor)
		.end()
		.fork()
			.tween(this, 0.25, 'easeInBack', { dropFadeness: 0.0 })
		.end()
		.tween(this, 0.25, 'easeInBack', { fadeness: 0.0 });
	this.hideMoveList = new Scenario()
		.fork()
			.tween(this.moveCursorColor, 0.1, 'linear', CreateColor(0, 0, 0, 0))
		.end()
		.fork()
			.tween(this.topCursorColor, 0.05, 'easeInOutSine', this.normalCursorColor)
		.end()
		.tween(this, 0.25, 'easeInBack', { dropFadeness: 0.0 });
	this.showMenu = new Scenario()
		.fork()	
			.tween(this.topCursorColor, 0.25, 'easeOutQuad', CreateColor(255, 0, 0, 255))
			.tween(this.topCursorColor, 0.25, 'easeOutQuad', this.normalCursorColor)
		.end()
		.tween(this, 0.5, 'easeOutBounce', { fadeness: 1.0 });
	this.showMoveList = new Scenario()
		.fork()
			.tween(this.topCursorColor, 0.05, 'easeInOutSine', this.lockedCursorColor)
		.end()
		.fork()
			.tween(this.moveCursorColor, 0.1, 'linear', this.normalCursorColor)
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
		var borderColor = CreateColor(0, 0, 0, cursorColor.alpha);
		var halfHeight = Math.round((height - 2) / 2);
		GradientRectangle(x + 1, y + 1, width - 2, halfHeight, color2, color2, color, color);
		GradientRectangle(x + 1, y + 1 + halfHeight, width - 2, height - 2 - halfHeight, color, color, color2, color2);
		OutlinedRectangle(x, y, width, height, borderColor);
	};
	this.drawItemBox = function(x, y, width, height, alpha, isSelected, isLockedIn, cursorColor) {
		Rectangle(x, y, width, height, CreateColor(0, 0, 0, alpha));
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 32));
		if (isSelected) {
			this.drawCursor(x, y, width, height, cursorColor, isLockedIn);
		}
	};
	this.drawSkillItem = function(x, y, skill, isSelected, isLockedIn) {
		var technique = skill.techniqueID
		var alpha = 255 * this.fadeness * this.dropFadeness;
		var titleColor = isSelected ?
			BlendColorsWeighted(CreateColor(255, 192, 0, alpha), CreateColor(192, 144, 0, alpha), this.moveCursorColor.alpha, 255 - this.moveCursorColor.alpha) :
			CreateColor(192, 144, 0, alpha);
		var textColor = isSelected ?
			BlendColorsWeighted(CreateColor(255, 255, 255, alpha), CreateColor(192, 192, 192, alpha), this.moveCursorColor.alpha, 255 - this.moveCursorColor.alpha) :
			CreateColor(192, 192, 192, alpha);
		this.drawItemBox(x, y, 160, 18, alpha * 128 / 255, isSelected, isLockedIn, this.moveCursorColor);
		Rectangle(x + 4, y + 2, 13, 13, CreateColor(128, 128, 128, alpha));
		OutlinedRectangle(x + 4, y + 2, 13, 13, CreateColor(0, 0, 0, alpha * 0.5));
		this.drawText(this.font, x + 7, y + 2, 1, textColor, skill.technique.actions[0].rank);
		this.drawText(this.font, x + 22, y + 3, 1, textColor, skill.name);
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
	var yOrigin = -18 * (1.0 - this.fadeness) + 16;
	var itemWidth = 160 / this.drawers.length;
	var litTextColor = CreateColor(255, 255, 255, 255);
	var dimTextColor = CreateColor(192, 192, 192, 255);
	Rectangle(0, 16, 160, yOrigin - 16, CreateColor(0, 0, 0, 128 * this.fadeness));
	SetClippingRectangle(0, 16, 160, GetScreenHeight() - 16);
	for (var i = 0; i < this.drawers.length; ++i) {
		var x = Math.floor(i * itemWidth);
		var width = Math.floor((i + 1) * itemWidth) - x;
		this.drawItemBox(x, yOrigin, width, 18, 160 * this.fadeness, i == this.topCursor, this.isDropped, this.topCursorColor);
		var textColor = i == this.topCursor ? CreateColor(255, 255, 255, 255 * this.fadeness) : CreateColor(192, 192, 192, 255 * this.fadeness);
		this.drawText(this.font, x + itemWidth / 2, yOrigin + 3, 1, textColor, this.drawers[i].name, 'center');
	}
	SetClippingRectangle(0, 0, GetScreenWidth(), GetScreenHeight())
	if (this.dropFadeness > 0.0) {
		SetClippingRectangle(0, yOrigin + 18, 160, GetScreenHeight() - (yOrigin + 18));
		var height = this.unit.skills.length * 18;
		var y = yOrigin + 18 - height * (1.0 - this.dropFadeness);
		Rectangle(0, 34, 160, y - 34, CreateColor(0, 0, 0, 96 * this.dropFadeness * this.fadeness)); 
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
