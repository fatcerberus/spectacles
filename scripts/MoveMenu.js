/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript("TargetMenu.js");

// MoveMenu() constructor
// Creates an object representing a move-choosing menu.
// Arguments:
//     unit:   The BattleUnit the menu belongs to.
//     battle: The battle session during which the menu will be shown.
function MoveMenu(unit, battle)
{
	this.lockedCursorColor = CreateColor(0, 36, 72, 255);
	this.moveRankColor = CreateColor(255, 255, 255, 255);
	this.normalCursorColor = CreateColor(0, 72, 144, 255);
	this.textColor = CreateColor(255, 255, 255, 255);
	this.usageTextColor = CreateColor(255, 192, 0, 255);
	
	this.battle = battle;
	this.drawers = null;
	this.expansion = 0.0;
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.healthyColor
	this.isExpanded = false;
	this.moveCursor = 0;
	this.moveCursorColor = CreateColor(0, 0, 0, 0);
	this.moveMenu = null;
	this.selection = null;
	this.topCursor = 0;
	this.topCursorColor = CreateColor(0, 0, 0, 0);
	this.unit = unit;
	
	this.chooseMove = new Scenario()
		.fork()
			.tween(this.moveCursorColor, 0.125, 'easeInOutSine', this.lockedCursorColor)
		.end()
		.fork()
			.tween(this, 0.25, 'easeInBack', { expansion: 0.0 })
		.end()
		.tween(this, 0.25, 'easeInBack', { fadeness: 0.0 });
	
	this.hideMoveList = new Scenario()
		.fork()
			.tween(this.moveCursorColor, 0.25, 'linear', CreateColor(0, 0, 0, 0))
		.end()
		.fork()
			.tween(this.topCursorColor, 0.25, 'easeInOutSine', this.normalCursorColor)
		.end()
		.tween(this, 0.25, 'easeInBack', { expansion: 0.0 });
	
	this.showMenu = new Scenario()
		.fork()	
			.tween(this.topCursorColor, 0.25, 'easeOutQuad', CreateColor(192, 192, 192, 255))
			.tween(this.topCursorColor, 0.25, 'easeOutQuad', this.normalCursorColor)
		.end()
		.tween(this, 0.5, 'easeOutBounce', { fadeness: 1.0 });
	
	this.showMoveList = new Scenario()
		.fork()
			.tween(this.topCursorColor, 0.25, 'easeInOutSine', this.lockedCursorColor)
		.end()
		.fork()
			.tween(this.moveCursorColor, 0.25, 'linear', this.normalCursorColor)
		.end()
		.tween(this, 0.25, 'easeOutExpo', { expansion: 1.0 });
	
	this.drawCursor = function(x, y, width, height, cursorColor, isLockedIn, isEnabled)
	{
		isEnabled = isEnabled !== void null ? isEnabled : null;
		
		var color;
		var color2;
		color = isEnabled ? cursorColor : CreateColor(48, 48, 48, cursorColor.alpha);
		color2 = BlendColors(color, CreateColor(0, 0, 0, color.alpha));
		if (isLockedIn) {
			var mainColor = color;
			color = color2;
			color2 = mainColor;
		}
		var halfHeight = Math.round(height / 2);
		GradientRectangle(x, y, width , halfHeight, color2, color2, color, color);
		GradientRectangle(x, y + halfHeight, width, height - halfHeight, color, color, color2, color2);
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, cursorColor.alpha / 2));
	};
	
	this.drawItemBox = function(x, y, width, height, alpha, isSelected, isLockedIn, cursorColor, isEnabled)
	{
		isEnabled = isEnabled !== void null ? isEnabled : true;
		
		Rectangle(x, y, width, height, CreateColor(0, 0, 0, alpha));
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 24));
		if (isSelected) {
			this.drawCursor(x, y, width, height, cursorColor, isLockedIn, isEnabled);
		}
	};
	
	this.drawMoveItem = function(x, y, item, isSelected, isLockedIn)
	{
		var alpha = 255 * this.fadeness * this.expansion;
		var isEnabled = item.isEnabled;
		var textColor = isSelected ? this.textColor : CreateColor(128, 128, 128, alpha);
		var usageTextColor = isSelected ? this.usageTextColor : CreateColor(128, 128, 128, alpha);
		textColor = isEnabled ? textColor : CreateColor(0, 0, 0, 32 * alpha / 255);
		usageTextColor = isEnabled ? usageTextColor : CreateColor(0, 0, 0, 32 * alpha / 255);
		this.drawItemBox(x, y, 160, 18, alpha * 128 / 255, isSelected, isLockedIn, this.moveCursorColor, isEnabled);
		Rectangle(x + 143, y + 2, 12, 14, item.idColor);
		OutlinedRectangle(x + 143, y + 2, 12, 14, CreateColor(0, 0, 0, item.idColor.alpha / 2));
		DrawTextEx(this.font, x + 149, y + 3, item.rank, CreateColor(0, 0, 0, textColor.alpha), 0, 'center');
		DrawTextEx(this.font, x + 33, y + 3, item.name, textColor, 1 * isEnabled);
		if (item.mpCost > 0) {
			this.drawText(this.font, x + 28, y + 3, isEnabled, usageTextColor, item.mpCost, 'right');
		}
	};
	
	this.drawText = function(font, x, y, shadowDistance, color, text, alignment)
	{
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
	
	this.drawTopItem = function(x, y, width, item, isSelected)
	{
		var isEnabled = item.contents.length > 0;
		this.drawItemBox(x, y, width, 18, 160 * this.fadeness, isSelected, this.isExpanded, this.topCursorColor, isEnabled);
		var textColor = isSelected ? CreateColor(255, 255, 255, 255 * this.fadeness) : CreateColor(128, 128, 128, 255 * this.fadeness);
		textColor = isEnabled ? textColor : CreateColor(0, 0, 0, 32 * this.fadeness);
		this.drawText(this.font, x + width / 2, y + 3, isEnabled, textColor, item.name, 'center');
	};
	
	this.updateTurnPreview = function(nextMoveUsable)
	{
		var prediction = this.battle.predictTurns(this.unit, nextMoveUsable.peekActions());
		this.battle.ui.hud.turnPreview.set(prediction);
	};
}

// .getInput() method
// Checks for player input and updates the state of the menu accordingly.
MoveMenu.prototype.getInput = function()
{
	var key = AreKeysLeft() ? GetKey() : null;
	/*if (this.showMenu.isRunning()) {
		return;
	}*/
	if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_A)) {
		if (!this.isExpanded && this.drawers[this.topCursor].contents.length > 0) {
			var usables = this.drawers[this.topCursor].contents;
			this.moveMenu = [];
			for (var i = 0; i < usables.length; ++i) {
				var menuItem = {
					name: usables[i].name,
					idColor: CreateColor(64, 64, 64, 255),
					isEnabled: usables[i].isUsable(this.unit),
					mpCost: usables[i].mpCost(this.unit),
					rank: usables[i].getRank(),
					usable: usables[i]
				};
				var actions = menuItem.usable.peekActions();
				for (var i2 = 0; i2 < actions.length; ++i2) {
					for (var i3 = 0; i3 < actions[i2].effects.length; ++i3) {
						if ('element' in actions[i2].effects[i3]) {
							var color = Game.elements[actions[i2].effects[i3].element].color;
							menuItem.idColor = BlendColors(color, CreateColor(0, 0, 0, color.alpha));
						}
					}
				}
				this.moveMenu.push(menuItem);
			}
			this.moveCursor = this.drawers[this.topCursor].cursor;
			this.isExpanded = true;
			this.hideMoveList.stop();
			this.showMoveList.run();
			this.updateTurnPreview(this.moveMenu[this.moveCursor].usable);
		} else if (this.isExpanded && this.moveMenu[this.moveCursor].isEnabled) {
			this.selection = this.moveMenu[this.moveCursor].usable;
			this.showMoveList.stop();
			this.chooseMove.run();
		}
	} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_B)) {
		this.drawers[this.topCursor].cursor = this.moveCursor;
		this.isExpanded = false;
		this.showMoveList.stop();
		this.hideMoveList.run();
	} else if (!this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT)) {
		--this.topCursor;
		if (this.topCursor < 0) {
			this.topCursor = this.drawers.length - 1;
		}
	} else if (!this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT)) {
		++this.topCursor;
		if (this.topCursor >= this.drawers.length) {
			this.topCursor = 0;
		}
	} else if (this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_UP)) {
		this.moveCursor = this.moveCursor - 1 < 0 ? this.moveMenu.length - 1 : this.moveCursor - 1;
		this.updateTurnPreview(this.moveMenu[this.moveCursor].usable);
	} else if (this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN)) {
		this.moveCursor = (this.moveCursor + 1) % this.moveMenu.length;
		this.updateTurnPreview(this.moveMenu[this.moveCursor].usable);
	}
};

// .open() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.open = function()
{
	this.drawers = [
		{ name: "Skill", contents: this.unit.skills },
		{ name: "Item", contents: this.unit.items },
		{ name: "Defend", contents: [] }
	];
	for (var i = 0; i < this.drawers.length; ++i) {
		this.drawers[i].cursor = 0;
	}
	this.battle.suspend();
	this.battle.ui.hud.highlight(this.unit.name);
	var chosenTargets = null;
	while (chosenTargets === null) {
		this.expansion = 0.0;
		this.isExpanded = false;
		this.selection = null;
		while (AreKeysLeft()) { GetKey(); }
		this.showMenu.run();
		Threads.waitFor(Threads.createEntityThread(this, 10));
		var chosenTargets = new TargetMenu(this.unit, this.battle, this.selection).open();
	}
	this.battle.ui.hud.highlight(null);
	this.battle.resume();
	return {
		usable: this.selection,
		targets: chosenTargets
	};
};

// .render() method
// Renders the menu in its current state.
MoveMenu.prototype.render = function()
{
	var yOrigin = -34 * (1.0 - this.fadeness) + 16;
	var itemWidth = 160 / this.drawers.length;
	var litTextColor = CreateColor(255, 255, 255, 255);
	var dimTextColor = CreateColor(192, 192, 192, 255);
	Rectangle(0, 16, 160, yOrigin - 16, CreateColor(0, 0, 0, 192 * this.fadeness));
	for (var i = 0; i < this.drawers.length; ++i) {
		var x = Math.floor(i * itemWidth);
		var width = Math.floor((i + 1) * itemWidth) - x;
		this.drawTopItem(x, yOrigin, width, this.drawers[i], i == this.topCursor);
	}
	if (this.expansion > 0.0) {
		SetClippingRectangle(0, yOrigin + 18, 160, GetScreenHeight() - (yOrigin + 18));
		var height = this.moveMenu.length * 16;
		var y = yOrigin + 18 - height * (1.0 - this.expansion);
		Rectangle(0, 34, 160, y - 34, CreateColor(0, 0, 0, 192 * this.expansion * this.fadeness)); 
		for (var i = 0; i < this.moveMenu.length; ++i) {
			var itemY = y + i * 18;
			this.drawMoveItem(0, itemY, this.moveMenu[i], i == this.moveCursor, this.chooseMove.isRunning());
		}
		SetClippingRectangle(0, 0, GetScreenWidth(), GetScreenHeight())
	}
};

// .update() method
// Updates the entity's state for the next frame.
MoveMenu.prototype.update = function()
{
	return this.selection === null || this.chooseMove.isRunning();
};
