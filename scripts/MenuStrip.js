/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// MenuStrip() constructor
// Creates an object representing a menu strip.
// Arguments:
//     title:        Optional. The menu title, which is displayed on the left side of the strip. Specify null or an
//                   empty string for an untitled menu.
//     isCancelable: Optional. true to allow the menu to be canceled without making a selection; false otherwise.
//                   (default: true)
//     items:        Optional. A list of strings specifying names of items in the menu. This is useful for a quick on-demand
//                   menu, but for more flexibility, you should omit this parameter and use the .addItem() method to populate the
//                   menu instead.
function MenuStrip(title, isCancelable, items)
{
	title = title !== void null ? title : "";
	isCancelable = isCancelable !== void null ? isCancelable : true;
	items = items !== void null ? items : null;
	
	this.carouselSurface = null;
	this.font = GetSystemFont();
	this.isCancelable = isCancelable;
	this.menuItems = [];
	this.selectedItem = 0;
	this.title = title;
	if (items != null) {
		for (var i = 0; i < items.length; ++i) {
			this.addItem(items[i]);
		}
	}
}

// .addItem() method
// Adds an item to the menu strip.
// Arguments:
//     text: The text to display on the menu strip when the item is selected.
//     tag:  Optional. An object or value to associate with the menu item. If this argument is not provided,
//           the item text is used as the tag.
MenuStrip.prototype.addItem = function(text, tag)
{
	if (tag === void null) {
		tag = text;
	}
	this.menuItems.push({
		text: text,
		tag: tag
	});
}

// .getInput() method
// Checks for player input and updates state accordingly.
MenuStrip.prototype.getInput = function()
{
	if (this.mode != 'idle') {
		return;
	}
	if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_A))) {
		this.chosenItem = this.selectedItem;
		this.animation = new Scenario()
			.fork()
				.tween(this, 0.125, 'easeInOutSine', { brightness: 1.0 })
				.tween(this, 0.125, 'easeInOutSine', { brightness: 0.0 })
			.end()
			.tween(this, 0.25, 'easeInQuad', { openness: 0.0 })
			.run();
		this.mode = 'close';
	} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_B)) && this.isCancelable) {
		this.chosenItem = null;
		this.animation = new Scenario()
			.tween(this, 0.25, 'easeInQuad', { openness: 0.0 })
			.run();
		this.mode = 'close';
	} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT))) {
		this.scrollDirection = -1;
		this.animation = new Scenario()
			.tween(this, 0.25, 'linear', { scrollProgress: 1.0 })
			.run();
		this.mode = 'changeItem';
	} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT))) {
		this.scrollDirection = 1;
		this.animation = new Scenario()
			.tween(this, 0.25, 'linear', { scrollProgress: 1.0 })
			.run();
		this.mode = 'changeItem';
	}
};

// .open() method
// Opens the menu strip to allow the player to choose a menu item.
// Returns:
//     The tag associated with the chosen item.
MenuStrip.prototype.open = function()
{
	this.openness = 0.0;
	this.scrollDirection = 0;
	this.scrollProgress = 0.0;
	this.brightness = 0.0;
	this.mode = "open";
	var carouselWidth = 0;
	for (i = 0; i < this.menuItems.length; ++i) {
		var itemText = this.menuItems[i].text;
		carouselWidth = Math.max(this.font.getStringWidth(itemText) + 10, carouselWidth);
	}
	this.carouselSurface = CreateSurface(carouselWidth, this.font.getHeight() + 10, CreateColor(0, 0, 0, 0));
	var menuThread = Threads.createEntityThread(this, 100);
	this.animation = new Scenario()
		.tween(this, 0.25, 'easeOutQuad', { openness: 1.0 })
		.run();
	Threads.waitFor(menuThread);
	return this.chosenItem === null ? null : this.menuItems[this.chosenItem].tag;
};

// .render() method
// Renders the MenuStrip to the screen in its current state.
MenuStrip.prototype.render = function()
{
	var height = this.font.getHeight() + 10;
	var menuY = GetScreenHeight() - height * this.openness;
	var normalStripColor = CreateColor(0, 0, 0, this.openness * 192);
	var litStripColor = CreateColor(255, 255, 255, this.openness * 192);
	var stripColor = BlendColorsWeighted(litStripColor, normalStripColor, this.brightness, 1.0 - this.brightness);
	Rectangle(0, menuY, GetScreenWidth(), height, stripColor);
	var normalTitleColor = CreateColor(64, 64, 64, this.openness * 255);
	var litTitleColor = CreateColor(0, 0, 0, this.openness * 255);
	var titleColor = BlendColorsWeighted(litTitleColor, normalTitleColor, this.brightness, 1.0 - this.brightness);
	this.font.setColorMask(CreateColor(0, 0, 0, this.openness * 255));
	this.font.drawText(6, menuY + 6, this.title);
	this.font.setColorMask(titleColor);
	this.font.drawText(5, menuY + 5, this.title);
	this.carouselSurface.setBlendMode(REPLACE);
	this.carouselSurface.rectangle(0, 0, this.carouselSurface.width, this.carouselSurface.height, CreateColor(0, 0, 0, 0));
	this.carouselSurface.setBlendMode(BLEND);
	var xOffset = (this.selectedItem + this.scrollProgress * this.scrollDirection) * this.carouselSurface.width;
	var normalItemColor = CreateColor(255, 192, 0, this.openness * 255);
	var litItemColor = CreateColor(128, 128, 64, this.openness * 255);
	var itemColor = BlendColorsWeighted(litItemColor, normalItemColor, this.brightness, 1.0 - this.brightness);
	for (var i = -1; i <= this.menuItems.length; ++i) {
		var itemIndex = i;
		if (i >= this.menuItems.length) {
			itemIndex = i % this.menuItems.length;
		} else if (i < 0) {
			itemIndex = this.menuItems.length - 1 - Math.abs(i + 1) % this.menuItems.length;
		}
		var itemText = this.menuItems[itemIndex].text;
		var textX = i * this.carouselSurface.width + (this.carouselSurface.width / 2 - this.font.getStringWidth(itemText) / 2);
		this.font.setColorMask(CreateColor(0, 0, 0, this.openness * 255));
		this.carouselSurface.drawText(this.font, textX - xOffset + 1, 6, itemText);
		this.font.setColorMask(itemColor);
		this.carouselSurface.drawText(this.font, textX - xOffset, 5, itemText);
	}
	carouselX = GetScreenWidth() - 5 - this.carouselSurface.width - this.font.getStringWidth(">") - 5;
	this.carouselSurface.blit(carouselX, menuY);
	this.font.setColorMask(CreateColor(128, 128, 128, this.openness * 255));
	this.font.drawText(carouselX - this.font.getStringWidth("<") - 5, menuY + 5, "<");
	if (this.scrollDirection == -1) {
		this.font.setColorMask(CreateColor(255, 192, 0, this.openness * (1.0 - this.scrollProgress) * 255));
		this.font.drawText(carouselX - this.font.getStringWidth("<") - 5, menuY + 5, "<");
	}
	this.font.setColorMask(CreateColor(128, 128, 128, this.openness * 255));
	this.font.drawText(carouselX + this.carouselSurface.width + 5, menuY + 5, ">");
	if (this.scrollDirection == 1) {
		this.font.setColorMask(CreateColor(255, 192, 0, this.openness * (1.0 - this.scrollProgress) * 255));
		this.font.drawText(carouselX + this.carouselSurface.width + 5, menuY + 5, ">");
	}
};

// .update() method
// Updates the MenuStrip for the next frame.
MenuStrip.prototype.update = function()
{
	switch (this.mode) {
		case 'open':
			if (!this.animation.isRunning()) {
				this.mode = "idle";
			}
			break;
		case 'changeItem':
			if (!this.animation.isRunning()) {
				var newSelection = this.selectedItem + this.scrollDirection;
				if (newSelection < 0) {
					newSelection = this.menuItems.length - 1;
				} else if (newSelection >= this.menuItems.length) {
					newSelection = 0;
				}
				this.selectedItem = newSelection;
				this.scrollDirection = 0;
				this.scrollProgress = 0.0;
				this.mode = "idle";
			}
			break;
		case 'close':
			return this.animation.isRunning();
	}
	return true;
};
