/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

function FieldMenu(session)
{
	this.items = [
		{ name: "Journal", id: 'journal' },
		{ name: "Party", id: 'party' },
		{ name: "Items", id: 'items' }
	];
	this.selection = Link(this.items).pluck('id').toArray().indexOf('party');
	this.font = GetSystemFont();
	this.isOpen = false;
}

FieldMenu.prototype.update = function()
{
	return this.isOpen || this.fadeness > 0.0;
};

FieldMenu.prototype.getInput = function()
{
	if (!this.isOpen) return;
	var key = AreKeysLeft() ? GetKey() : null;
	if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_MENU) ||
	    key == GetPlayerKey(PLAYER_1, PLAYER_KEY_B))
	{
		this.isOpen = false;
		new Scenario()
			.tween(this, 0.5, 'easeInQuint', { fadeness: 0.0 })
			.run();
	}
};

FieldMenu.prototype.render = function()
{
	var y = -(1.0 - this.fadeness) * 208;
	Rectangle(0, y, 320, 224, CreateColor(0, 0, 0, 192));
	OutlinedRectangle(0, y, 320, 224, CreateColor(0, 0, 0, 64));
	y = 240 - this.fadeness * 16;
	Rectangle(0, y, 320, 16, CreateColor(0, 0, 0, 192));
	var itemWidth = Math.floor(320 / this.items.length);
	var firstItemWidth = itemWidth + 320 % this.items.length;
	var x = 0;
	for (var i = 0; i < this.items.length; ++i) {
		var width = i == 0 ? firstItemWidth : itemWidth;
		OutlinedRectangle(x, y, width, 16, CreateColor(0, 0, 0, 128));
		DrawTextEx(this.font, x + width / 2, y + 2, this.items[i].name, CreateColor(255, 255, 255, 255), 1, 'center');
		x += width;
	}
};

FieldMenu.prototype.open = function()
{
	this.isOpen = true;
	this.fadeness = 0.0;
	var thread = Threads.createEntityThread(this, 100);
	new Scenario()
		.tween(this, 0.5, 'easeOutQuint', { fadeness: 1.0 })
		.run(true);
	Threads.waitFor(thread);
};
