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
	
	this.battle = battle;
	this.cursorColor = CreateColor(0, 0, 0, 0);
	this.drawer = null;
	this.drawerID = 0;
	this.fadeness = 0.0;
	this.font = null;
	this.skillID = null;
	this.transition = null;
	this.unit = unit;
	
	this.drawCursor = function(x, y, width, height, isLockedIn) {
		var color = this.cursorColor;
		var color2 = BlendColors(color, CreateColor(0, 0, 0, color.alpha));
		var halfHeight = Math.round(height / 2);
		GradientRectangle(x, y, width, halfHeight, color2, color2, color, color);
		GradientRectangle(x, y + halfHeight, width, height - halfHeight, color, color, color2, color2);
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, color.alpha));
	};
	this.drawInfoText = function(x, y, width, text, title) {
		if (title === void null) { title = ""; }
		
		var titleWidth = this.font.getStringWidth(title);
		var textX = x + titleWidth + width - titleWidth;
		this.drawText(this.font, x, y - 2, 1, CreateColor(255, 192, 0, 255), title);
		this.drawText(this.font, textX, y, 1, CreateColor(192, 192, 192, 255), text, 'right');
	};
	this.drawItemBox = function(x, y, width, height, lockedIn, isSelected) {
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 144));
		Rectangle(x + 1, y + 1, width - 2, height - 2, CreateColor(0, 0, 0, 128));
		if (isSelected) {
			this.drawCursor(x, y, width, height, lockedIn);
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
	if (this.transition.isRunning()) {
		return;
	}
	//TODO: implement me!
};

// .open() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.open = function()
{
	this.battle.suspend();
	this.battle.ui.hud.highlight(this.unit.name);
	this.font = GetSystemFont();
	this.transition = new Scenario()
		.beginFork()	
			.tween(this.cursorColor, 0.25, 'easeOutQuad', { red: 255, green: 255, blue: 255, alpha: 255 })
			.tween(this.cursorColor, 0.25, 'easeOutQuad', { red: 0, green: 72, blue: 144, alpha: 255 })
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
	var y = -(18 + 16) * (1.0 - this.fadeness) + 16;
	var itemWidth = 160 / this.drawers.length;
	for (var i = 0; i < this.drawers.length; ++i) {
		var x = Math.floor(i * itemWidth);
		var width = Math.floor((i + 1) * itemWidth) - x;
		this.drawItemBox(x, y, width, 18, false, i == this.drawerID);
		var textColor = CreateColor(255, 255, 255, i === this.drawerID ? 255 : 128);
		this.drawText(this.font, x + itemWidth / 2, y + 3, 1, textColor, this.drawers[i].name, 'center');
	}
	return;
	for (var i = 0; i < 4; ++i) {
		var itemY = y + 18 + Math.floor(i * 17);
		this.drawItemBox(0, itemY, 160, 18, false, i == 0);
		Rectangle(4, itemY + 2, 13, 13, CreateColor(128, 128, 128, 255));
		OutlinedRectangle(4, itemY + 2, 13, 13, CreateColor(0, 0, 0, 128));
		this.drawText(this.font, 7, itemY + 2, 1, CreateColor(255, 255, 255), "2");
		this.drawText(this.font, 20, itemY + 3, 1, CreateColor(255, 255, 255), "Charge Slash");
		this.drawInfoText(119, itemY + 3, 37, "100%", "G");
	}
};

// .update() method
// Updates the entity's state for the next frame.
MoveMenu.prototype.update = function()
{
	return this.skillID === null;
};
