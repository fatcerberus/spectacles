/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

function FieldMenu(session)
{
	this.itemTextColor = CreateColor(64, 64, 64, 255);
	this.litItemTextColor = CreateColor(255, 255, 255, 255);
	this.highlightColor = CreateColor(0, 72, 144, 255);
	
	this.items = [
		{ name: "Party", id: 'party' },
		{ name: "Items", id: 'items' },
		{ name: "Battlers", id: 'battlers' }
	];
	for (var i = 0; i < this.items.length; ++i) {
		this.items[i].highlight = CreateColor(0, 0, 0, 0);
		this.items[i].textColor = BlendColors(this.itemTextColor, this.itemTextColor);
	}
	this.font = GetSystemFont();
	this.isOpen = false;
	this.itemFader = null;
	this.selection = mini.Link(this.items).pluck('id').toArray().indexOf('party');
}

FieldMenu.prototype.update = function()
{
	return this.isOpen || this.fadeness > 0.0;
};

FieldMenu.prototype.getInput = function()
{
	if (!this.isOpen) return;
	var lastItem = this.selection;
	var newSelection = this.selection;
	var key = AreKeysLeft() ? GetKey() : null;
	if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_MENU) ||
	    key == GetPlayerKey(PLAYER_1, PLAYER_KEY_B))
	{
		this.close();
	} else {
		switch (key) {
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT):
			if (newSelection == 0)
				newSelection = this.items.length - 1;
			else
				--newSelection;
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT):
			if (newSelection == this.items.length - 1)
				newSelection = 0;
			else
				++newSelection;
			break;
		}
	}
	if (newSelection != lastItem) {
		this.selectItem(newSelection);
	}
};

FieldMenu.prototype.render = function()
{
	var time = LucidaClock.getTime();
	
	// draw game progress log
	var y = -(1.0 - this.fadeness) * 208;
	Rectangle(0, y, 320, 224, CreateColor(0, 0, 0, 192));
	OutlinedRectangle(0, y, 320, 224, CreateColor(0, 0, 0, 64));
	DrawTextEx(this.font, 160, y + 16, time.toString(), CreateColor(0, 64, 255, 255), 1, 'center');
	
	// draw main menu items
	y = 240 - this.fadeness * 16;
	Rectangle(0, y, 320, 16, CreateColor(0, 0, 0, 192));
	var itemWidth = Math.floor(320 / this.items.length);
	var firstItemWidth = itemWidth + 320 % this.items.length;
	var x = 0;
	for (var i = 0; i < this.items.length; ++i) {
		var width = i == 0 ? firstItemWidth : itemWidth;
		var color2 = BlendColors(this.items[i].highlight, CreateColor(0, 0, 0, 255));
		GradientRectangle(x, y, width, 8, color2, color2, this.items[i].highlight, this.items[i].highlight);
		GradientRectangle(x, y + 8, width, 8, this.items[i].highlight, this.items[i].highlight, color2, color2);
		OutlinedRectangle(x, y, width, 16, CreateColor(0, 0, 0, 128));
		DrawTextEx(this.font, x + width / 2, y + 2, this.items[i].name, this.items[i].textColor, 1, 'center');
		x += width;
	}
};

FieldMenu.prototype.open = function()
{
	this.isOpen = true;
	this.fadeness = 0.0;
	var thread = mini.Threads.create(this, 100);
	this.selectItem(this.selection);
	new mini.Scene()
		.tween(this, 0.5, 'easeOutQuint', { fadeness: 1.0 })
		.run(true);
	mini.Threads.join(thread);
};

FieldMenu.prototype.close = function()
{
	this.isOpen = false;
	new mini.Scene()
		.fork().tween(this.items[this.selection].highlight, 0.5, 'easeInSine', CreateColor(0, 0, 0, 0)).end()
		.fork().tween(this.items[this.selection].textColor, 0.5, 'easeInSine', this.itemTextColor).end()
		.tween(this, 0.5, 'easeInQuint', { fadeness: 0.0 })
		.run(true);
};

FieldMenu.prototype.selectItem = function(itemID)
{
	if (this.itemFader != null) {
		this.itemFader.stop();
	}
	this.itemFader = new mini.Scene()
		.fork().tween(this.items[this.selection].highlight, 0.25, 'easeInSine', CreateColor(0, 0, 0, 0)).end()
		.fork().tween(this.items[this.selection].textColor, 0.25, 'easeInSine', this.itemTextColor).end()
		.fork().tween(this.items[itemID].highlight, 0.25, 'easeOutSine', this.highlightColor).end()
		.fork().tween(this.items[itemID].textColor, 0.25, 'easeOutSine', this.litItemTextColor).end()
		.synchronize()
		.run();
	this.selection = itemID;
};
