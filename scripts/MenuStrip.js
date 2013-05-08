/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("Core/Tween.js");

// MenuStrip() constructor
// Creates an object representing a menu strip.
// Arguments:
//     title:        The menu title, which is displayed on the left side of the strip. Specify null or an empty string
//                   for an untitled menu.
//     isCancelable: true to allow the menu to be canceled without making a selection; false otherwise.
//     items:        Optional. A list of strings specifying names of items in the menu. This is useful for a basic impromptu
//                   menu, but for more flexibility, you should omit this parameter and use the .addItem() method to populate the
//                   menu instead.
function MenuStrip(title, isCancelable, items)
{
	this.showStyle = { easing: 'easeOutQuad', duration: 0.25 };
	this.scrollStyle = { easing: 'linear', duration: 0.25 };
	this.flashStyle = { easing: 'linear', duration: 0.125 };
	this.hideStyle = { easing: 'easeInQuad', duration: 0.25 };
	
	this.render = function() {
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
	this.update = function() {
		switch (this.mode) {
			case "open":
				if (this.openTween.isFinished()) {
					this.mode = "idle";
				}
				break;
			case "change-item":
				if (this.scrollTween.isFinished()) {
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
			case "choose":
				if (this.flashTween.isFinished()) {
					this.flashTween = new Tween(this, this.flashStyle.duration, this.flashStyle.easing, { brightness: 0.0 });
					this.flashTween.start();
					this.hideTween = new Tween(this, this.hideStyle.duration, this.hideStyle.easing, { openness: 0.0 });
					this.hideTween.start();
					this.mode = "close";
				}
				break;
			case "close":
				if (this.hideTween.isFinished()) {
					this.mode = "finish";
				}
				break;
			case "finish":
				return false;
		}
		return true;
	};
	this.getInput = function() {
		if (this.mode != "idle") {
			return;
		}
		if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_A))) {
			this.chosenItem = this.selectedItem;
			this.flashTween = new Tween(this, this.flashStyle.duration, this.flashStyle.easing, { brightness: 1.0 });
			this.flashTween.start();
			this.mode = "choose";
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_B)) && this.isCancelable) {
			this.chosenItem = null;
			this.mode = "close";
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT))) {
			this.scrollDirection = -1;
			this.scrollTween = new Tween(this, this.scrollStyle.duration, this.scrollStyle.easing, { scrollProgress: 1.0 });
			this.scrollTween.start();
			this.mode = "change-item";
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT))) {
			this.scrollDirection = 1;
			this.scrollTween = new Tween(this, this.scrollStyle.duration, this.scrollStyle.easing, { scrollProgress: 1.0 });
			this.scrollTween.start();
			this.mode = "change-item";
		}
	};
	
	if (items === undefined) { items = null; }
	
	this.title = title == null ? "" : title;
	this.isCancelable = isCancelable;
	this.selectedItem = 0;
	this.font = GetSystemFont();
	this.menuItems = [];
	this.carouselSurface = null;
	if (items != null) {
		for (var i = 0; i < items.length; ++i) {
			this.addItem(items[i]);
		}
	}
}

// .addItem() method
// Adds a tagged item to the menu strip.
// Arguments:
//     text: The text to display on the menu strip when the item is selected.
//     tag:  Optional. An object to associate with the menu item. If this argument is not provided,
//           the item text is used as the tag.
MenuStrip.prototype.addItem = function(text, tag)
{
	if (tag === undefined) { tag = text; }
	
	this.menuItems.push({
		text: text,
		tag: tag
	});
}

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
	this.openTween = new Tween(this, this.showStyle.duration, this.showStyle.easing, { openness: 1.0 });
	this.openTween.start();
	var menuThread = Threads.createEntityThread(this, 100);
	Threads.waitFor(menuThread);
	return this.chosenItem === null ? null : this.menuItems[this.chosenItem].tag;
};
