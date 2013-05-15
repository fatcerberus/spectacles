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
	this.$drawInfoText = function(x, y, width, text, title)
	{
		if (title === void null) { title = ""; }
		
		var titleWidth = this.$font.getStringWidth(title);
		var textX = x + titleWidth + width - titleWidth;
		this.$drawText(this.$font, x, y - 2, 1, CreateColor(255, 192, 0, 255), title);
		this.$drawText(this.$font, textX, y, 1, CreateColor(192, 192, 192, 255), text, 'right');
	};
	
	this.$drawItemBox = function(x, y, width, height, lockedIn, isSelected)
	{
		if (!isSelected) {
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 144));
			Rectangle(x + 1, y + 1, width - 2, height - 2, CreateColor(0, 0, 0, 128));
		} else {
			var halfHeight = Math.round(height / 2);
			var toColor;
			var fromColor;
			if (lockedIn) {
				fromColor = CreateColor(0, 36, 72, 255);
				toColor = BlendColors(fromColor, CreateColor(0, 0, 0, 255));
			} else {
				toColor = CreateColor(0, 72, 144, 255);
				fromColor = BlendColors(toColor, CreateColor(0, 0, 0, 255));
			}
			GradientRectangle(x, y, width, halfHeight, fromColor, fromColor, toColor, toColor);
			GradientRectangle(x, y + halfHeight, width, height - halfHeight, toColor, toColor, fromColor, fromColor);
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 255));
		}
	};
	
	this.$drawText = function(font, x, y, shadowDistance, color, text, alignment)
	{
		var alignments = {
			left: function(font, x, text) { return x; },
			center: function(font, x, text) { return x - font.getStringWidth(text) / 2; },
			right: function(font, x, text) { return x - font.getStringWidth(text); }
		};
		
		if (alignment === void null) { alignment = 'left'; }
		
		if (!(alignment in alignments)) {
			Abort("MoveMenu.$drawText(): Invalid text alignment '" + alignment + "'.");
		}
		x = alignments[alignment](font, x, text);
		font.setColorMask(CreateColor(0, 0, 0, color.alpha));
		font.drawText(x + shadowDistance, y + shadowDistance, text);
		font.setColorMask(color);
		font.drawText(x, y, text);
	};
	
	this.$drawers = [
		{ name: "Attack", topItem: 0 },
		{ name: "Item", topItem: 0 },
		{ name: "Defend", topItem: 0 }
	];
	
	this.$battle = battle;
	this.$unit = unit;
	this.$fadeness = 0.0;
	this.$fadeTween = null;
	this.$font = null;
	this.$drawer = null;
	this.$drawerID = 0;
	this.$skillID = null;
	
	this.render = function() {
		var y = -(16 + 17 * 5) * (1.0 - this.$fadeness) + 16;
		var itemWidth = 160 / this.$drawers.length;
		for (var i = 0; i < this.$drawers.length; ++i) {
			var x = Math.floor(i * itemWidth);
			var width = Math.floor((i + 1) * itemWidth) - x;
			this.$drawItemBox(x, y, width, 17, true, i == this.$drawerID);
			this.$drawText(this.$font, x + itemWidth / 2, y + 2, 1, CreateColor(255, 255, 255, 255), this.$drawers[i].name, 'center');
		}
		for (var i = 0; i < 4; ++i) {
			var itemY = y + 17 + Math.floor(i * 17);
			this.$drawItemBox(0, itemY, 160, 17, false, i == 0);
			Rectangle(4, itemY + 2, 13, 13, CreateColor(128, 128, 128, 255));
			OutlinedRectangle(4, itemY + 2, 13, 13, CreateColor(0, 0, 0, 128));
			this.$drawText(this.$font, 7, itemY + 2, 1, CreateColor(255, 255, 255), "2");
			this.$drawText(this.$font, 21, itemY + 2, 1, CreateColor(255, 255, 255), "Charge Slash");
			this.$drawInfoText(119, itemY + 2, 37, "100%", "G");
		}
	};
	this.update = function() {
		return this.$skill == null || !this.$fadeTween.isFinished();
	};
	this.getInput = function() {
		if (!this.$fadeTween.isFinished()) {
			return;
		}
		//TODO: implement me!
	};
}

// .open() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.open = function()
{
	this.$battle.suspend();
	this.$battle.ui.highlightActor(this.$unit.name);
	this.$font = GetSystemFont();
	this.$fadeTween = new Tween(this, 0.5, 'easeOutBounce', { $fadeness: 1.0 });
	this.$fadeTween.start();
	Threads.waitFor(Threads.createEntityThread(this, 20));
	this.$battle.ui.highlightActor(null);
	this.$battle.resume();
	return this.$skill;
};
