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
//     stance: The stance this menu will be used for.
function MoveMenu(unit, battle, stance)
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
	this.isExpanded = false;
	this.menuStance = stance;
	this.menuThread = null;
	this.moveCursor = 0;
	this.moveCursorColor = CreateColor(0, 0, 0, 0);
	this.moveMenu = null;
	this.selection = null;
	this.stance = null;
	this.topCursor = 0;
	this.topCursorColor = CreateColor(0, 0, 0, 0);
	this.unit = unit;
	var drawerTable = {};
	mini.Link(this.unit.skills).each(function(skill) {
		var category = skill.skillInfo.category;
		if (!(category in drawerTable)) {
			drawerTable[category] = {
				name: Game.skillCategories[category],
				contents: [],
				cursor: 0
			};
		}
		drawerTable[category].contents.push(skill);
	});
	this.drawers = [];
	for (var category in drawerTable) {
		this.drawers.push(drawerTable[category]);
	}
	if (stance == BattleStance.attack) {
		this.drawers = this.drawers.concat([
			{ name: "Item", contents: this.unit.items, cursor: 0 } ]);
	}
	
	this.chooseMove = new mini.Scene()
		.fork()
			.tween(this.moveCursorColor, 0.125, 'easeInOutSine', this.lockedCursorColor)
		.end()
		.fork()
			.tween(this, 0.25, 'easeInBack', { expansion: 0.0 })
		.end()
		.tween(this, 0.25, 'easeInBack', { fadeness: 0.0 });
	
	this.hideMoveList = new mini.Scene()
		.fork()
			.tween(this.moveCursorColor, 0.25, 'linear', CreateColor(0, 0, 0, 0))
		.end()
		.fork()
			.tween(this.topCursorColor, 0.25, 'easeInOutSine', this.normalCursorColor)
		.end()
		.tween(this, 0.25, 'easeInBack', { expansion: 0.0 });
	
	this.showMenu = new mini.Scene()
		.fork()	
			.tween(this.topCursorColor, 0.25, 'easeOutQuad', CreateColor(192, 192, 192, 255))
			.tween(this.topCursorColor, 0.25, 'easeOutQuad', this.normalCursorColor)
		.end()
		.tween(this, 0.5, 'easeOutBounce', { fadeness: 1.0 });
	
	this.showMoveList = new mini.Scene()
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
		color = isEnabled ? cursorColor : CreateColor(96, 96, 96, cursorColor.alpha);
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
		var usageTextColor = isSelected ? this.usageTextColor : BlendColors(this.usageTextColor, CreateColor(0, 0, 0, this.usageTextColor.alpha));
		textColor = isEnabled ? textColor : CreateColor(0, 0, 0, 32 * alpha / 255);
		usageTextColor = isEnabled ? usageTextColor : CreateColor(0, 0, 0, 32 * alpha / 255);
		this.drawItemBox(x, y, 160, 18, alpha * 128 / 255, isSelected, isLockedIn, this.moveCursorColor, isEnabled);
		var rankBoxColor = isEnabled ? BlendColors(item.idColor, CreateColor(0, 0, 0, item.idColor.alpha))
			: BlendColorsWeighted(item.idColor, CreateColor(0, 0, 0, item.idColor.alpha), 25, 75);
		var rankColor = isEnabled ? item.idColor : BlendColorsWeighted(item.idColor, CreateColor(0, 0, 0, item.idColor.alpha), 33, 66);
		Rectangle(x + 5, y + 2, 14, 14, rankBoxColor);
		OutlinedRectangle(x + 5, y + 2, 14, 14, CreateColor(0, 0, 0, rankBoxColor.alpha / 2));
		DrawTextEx(this.font, x + 12, y + 3, isFinite(item.rank) ? item.rank : "?", rankColor, 1, 'center');
		DrawTextEx(this.font, x + 24, y + 3, item.name, textColor, 1 * isEnabled);
		if (item.mpCost > 0) {
			this.drawText(this.font, x + 141, y + 1, isEnabled, textColor, item.mpCost, 'right');
			this.drawText(this.font, x + 142, y + 5, isEnabled, usageTextColor, "MP");
		} else if (item.usable instanceof ItemUsable) {
			this.drawText(this.font, x + 148, y + 3, isEnabled, textColor, item.usable.usesLeft, 'right');
			this.drawText(this.font, x + 149, y + 3, isEnabled, usageTextColor, "x");
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
		this.drawItemBox(x, y, width, 18, 144 * this.fadeness, isSelected, this.isExpanded, this.topCursorColor, isEnabled);
		var textColor = isSelected ? CreateColor(255, 255, 255, 255 * this.fadeness) : CreateColor(128, 128, 128, 255 * this.fadeness);
		textColor = isEnabled ? textColor : CreateColor(0, 0, 0, 32 * this.fadeness);
		this.drawText(this.font, x + width / 2, y + 3, isEnabled, textColor, item.name.substr(0, 3), 'center');
	};
	
	this.updateTurnPreview = function()
	{
		var nextMoveOrRank;
		if (this.stance != BattleStance.guard) {
			if (this.isExpanded) {
				nextMoveOrRank = this.moveMenu[this.moveCursor].usable;
			} else {
				var drawer = this.drawers[this.topCursor];
				nextMoveOrRank = drawer.contents.length > 0 ? drawer.contents[drawer.cursor] : Game.defaultItemRank;
			}
		} else {
			nextMoveOrRank = Game.stanceChangeRank;
		}
		var prediction = this.battle.predictTurns(this.unit, isNaN(nextMoveOrRank) ? nextMoveOrRank.peekActions() : nextMoveOrRank);
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
					idColor: CreateColor(192, 192, 192, 255),
					isEnabled: usables[i].isUsable(this.unit, this.stance),
					mpCost: usables[i].mpCost(this.unit),
					rank: usables[i].getRank(),
					usable: usables[i]
				};
				var actions = menuItem.usable.peekActions();
				for (var i2 = 0; i2 < actions.length; ++i2) {
					for (var i3 = 0; i3 < actions[i2].effects.length; ++i3) {
						if ('element' in actions[i2].effects[i3]) {
							menuItem.idColor = Game.elements[actions[i2].effects[i3].element].color;
						}
					}
				}
				this.moveMenu.push(menuItem);
			}
			this.moveCursor = this.drawers[this.topCursor].cursor;
			this.isExpanded = true;
			this.hideMoveList.stop();
			this.showMoveList.run();
			this.updateTurnPreview();
		} else if (this.isExpanded && this.moveMenu[this.moveCursor].isEnabled) {
			this.drawers[this.topCursor].cursor = this.moveCursor;
			this.selection = this.moveMenu[this.moveCursor].usable;
			this.showMoveList.stop();
			this.chooseMove.run();
		}
	} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_B)) {
		this.drawers[this.topCursor].cursor = this.moveCursor;
		this.isExpanded = false;
		this.showMoveList.stop();
		this.hideMoveList.run();
	} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_Y) && this.stance == BattleStance.attack) {
		this.stance = BattleStance.guard;
		this.updateTurnPreview();
		this.showMoveList.stop();
		this.chooseMove.run();
	} else if (!this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT)) {
		--this.topCursor;
		if (this.topCursor < 0) {
			this.topCursor = this.drawers.length - 1;
		}
		this.updateTurnPreview();
	} else if (!this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT)) {
		++this.topCursor;
		if (this.topCursor >= this.drawers.length) {
			this.topCursor = 0;
		}
		this.updateTurnPreview();
	} else if (this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_UP)) {
		this.moveCursor = this.moveCursor - 1 < 0 ? this.moveMenu.length - 1 : this.moveCursor - 1;
		this.updateTurnPreview();
	} else if (this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN)) {
		this.moveCursor = (this.moveCursor + 1) % this.moveMenu.length;
		this.updateTurnPreview();
	}
};

// .open() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.open = function()
{
	this.battle.suspend();
	this.battle.ui.hud.highlight(this.unit.name);
	var chosenTargets = null;
	this.stance = this.lastStance = this.menuStance;
	while (chosenTargets === null) {
		this.expansion = 0.0;
		this.isExpanded = false;
		this.selection = null;
		this.stance = this.lastStance;
		while (AreKeysLeft()) { GetKey(); }
		this.showMenu.run();
		this.updateTurnPreview();
		this.menuThread = mini.Threads.create(this, 10);
		mini.Threads.join(this.menuThread);
		switch (this.stance) {
			case BattleStance.attack:
				var chosenTargets = new TargetMenu(this.unit, this.battle, this.selection).open();
				break;
			case BattleStance.counter:
				var targetMenu = new TargetMenu(this.unit, this.battle, null, "CS " + this.selection.name);
				targetMenu.lockTargets([ this.unit.counterTarget ]);
				var chosenTargets = targetMenu.open();
				break;
			case BattleStance.guard:
				var targetMenu = new TargetMenu(this.unit, this.battle, null, "Guard");
				targetMenu.lockTargets([ this.unit ]);
				var chosenTargets = targetMenu.open();
				break;
		}
	}
	this.battle.ui.hud.highlight(null);
	this.battle.resume();
	return {
		usable: this.selection,
		stance: this.stance,
		targets: chosenTargets
	};
};

// .render() method
// Renders the menu in its current state.
MoveMenu.prototype.render = function()
{
	var yOrigin = -54 * (1.0 - this.fadeness) + 16;
	var stanceText = this.stance == BattleStance.counter ? "CS"
		: this.stance == BattleStance.guard ? "GS"
		: "AS";
	Rectangle(0, yOrigin, 136, 16, CreateColor(0, 0, 0, 160 * this.fadeness));
	OutlinedRectangle(0, yOrigin, 136, 16, CreateColor(0, 0, 0, 24 * this.fadeness));
	Rectangle(136, yOrigin, 24, 16, CreateColor(0, 0, 0, 176 * this.fadeness));
	OutlinedRectangle(136, yOrigin, 24, 16, CreateColor(0, 0, 0, 24 * this.fadeness));
	this.drawText(this.font, 68, yOrigin + 2, 1, CreateColor(160, 160, 160, 255 * this.fadeness), this.unit.fullName, 'center');
	this.drawText(this.font, 148, yOrigin + 2, 1, CreateColor(255, 255, 128, 255 * this.fadeness), stanceText, 'center');
	var itemWidth = 160 / this.drawers.length;
	var litTextColor = CreateColor(255, 255, 255, 255);
	var dimTextColor = CreateColor(192, 192, 192, 255);
	Rectangle(0, 16, 160, yOrigin - 16, CreateColor(0, 0, 0, 192 * this.fadeness));
	for (var i = 0; i < this.drawers.length; ++i) {
		var x = Math.floor(i * itemWidth);
		var width = Math.floor((i + 1) * itemWidth) - x;
		this.drawTopItem(x, yOrigin + 16, width, this.drawers[i], i == this.topCursor);
	}
	var itemY;
	if (this.expansion > 0.0) {
		SetClippingRectangle(0, yOrigin + 34, 160, GetScreenHeight() - (yOrigin + 34));
		var height = this.moveMenu.length * 16;
		var y = yOrigin + 34 - height * (1.0 - this.expansion);
		Rectangle(0, 34, 160, y - 34, CreateColor(0, 0, 0, 128 * this.expansion * this.fadeness));
		itemY = y;
		for (var i = 0; i < this.moveMenu.length; ++i) {
			this.drawMoveItem(0, itemY, this.moveMenu[i], i == this.moveCursor, this.chooseMove.isRunning());
			itemY += 18;
		}
		SetClippingRectangle(0, 0, GetScreenWidth(), GetScreenHeight())
	} else {
		itemY = yOrigin + 34;
	}
};

// .update() method
// Updates the entity's state for the next frame.
MoveMenu.prototype.update = function()
{
	return (this.stance != BattleStance.guard && this.selection === null)
		|| this.chooseMove.isRunning();
};
