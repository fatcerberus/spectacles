/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("Core/Fader.js");
RequireScript("Core/Threads.js");

function MenuStrip(title, items)
{
	this.render = function()
	{
		var height = this.font.getHeight() + 10;
		var menuY = GetScreenHeight() - height * this.visibility;
		Rectangle(0, menuY, GetScreenWidth(), height, CreateColor(0, 0, 0, this.visibility * 192));
		this.font.setColorMask(CreateColor(128, 128, 128, this.visibility * 255));
		this.font.drawText(5, menuY + 7, this.title);
		this.carouselSurface.setBlendMode(REPLACE);
		this.carouselSurface.rectangle(0, 0, this.carouselSurface.width, this.carouselSurface.height, CreateColor(0, 0, 0, 0));
		this.carouselSurface.setBlendMode(BLEND);
		var xOffset = (this.selectedItem + this.scrollProgress * this.scrollDirection) * this.carouselSurface.width;
		for (var i = -1; i <= this.menuItems.length; ++i) {
			var itemIndex = i;
			if (i >= this.menuItems.length) {
				itemIndex = i % this.menuItems.length;
			} else if (i < 0) {
				itemIndex = this.menuItems.length - 1 - Math.abs(i + 1) % this.menuItems.length;
			}
			var textX = i * this.carouselSurface.width + (this.carouselSurface.width / 2 - this.font.getStringWidth(this.menuItems[itemIndex]) / 2);
			this.font.setColorMask(CreateColor(0, 0, 0, this.visibility * 255));
			this.carouselSurface.drawText(this.font, textX - xOffset + 1, 8, this.menuItems[itemIndex]);
			this.font.setColorMask(CreateColor(255, 255, 128, this.visibility * 255));
			this.carouselSurface.drawText(this.font, textX - xOffset, 7, this.menuItems[itemIndex]);
		}
		carouselX = GetScreenWidth() - this.carouselSurface.width - this.font.getStringWidth(">") - 10;
		this.carouselSurface.blit(carouselX, menuY);
		this.font.setColorMask(CreateColor(64, 64, 64, this.visibility * 255));
		this.font.drawText(carouselX - this.font.getStringWidth("<") - 5, menuY + 7, "<");
		if (this.scrollDirection == -1) {
			this.font.setColorMask(CreateColor(255, 255, 255, this.visibility * (1.0 - this.scrollProgress) * 255));
			this.font.drawText(carouselX - this.font.getStringWidth("<") - 5, menuY + 7, "<");
		}
		this.font.setColorMask(CreateColor(64, 64, 64, this.visibility * 255));
		this.font.drawText(carouselX + this.carouselSurface.width + 5, menuY + 7, ">");
		if (this.scrollDirection == 1) {
			this.font.setColorMask(CreateColor(255, 255, 255, this.visibility * (1.0 - this.scrollProgress) * 255));
			this.font.drawText(carouselX + this.carouselSurface.width + 5, menuY + 7, ">");
		}
	};
	
	this.update = function()
	{
		switch (this.mode) {
			case "change-item":
				this.scrollProgress = Math.min(this.scrollProgress + 5.0 / Engine.frameRate, 1.0);
				if (this.scrollProgress >= 1.0) {
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
			case "open":
				this.visibility = Math.min(this.visibility + 5.0 / Engine.frameRate, 1.0);
				if (this.visibility >= 1.0) {
					this.mode = "idle";
				}
				break;
			case "close":
				this.visibility = Math.max(this.visibility - 5.0 / Engine.frameRate, 0.0);
				if (this.visibility <= 0.0) {
					this.mode = "finish";
				}
				break;
			case "finish":
				return false;
		}
		return true;
	};
	
	this.getInput = function()
	{
		if (this.mode != "idle") {
			return;
		}
		if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_A))) {
			this.chosenItem = this.selectedItem;
			this.mode = "close";
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_B))) {
			this.chosenItem = null;
			this.mode = "close";
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT))) {
			this.scrollDirection = -1;
			this.mode = "change-item";
		} else if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT))) {
			this.scrollDirection = 1;
			this.mode = "change-item";
		}
	};
	
	this.title = title != null ? title : "";
	this.menuItems = items;
	this.selectedItem = 0;
	this.font = LoadFont("UITextFont.rfn");
	var carouselWidth = 0;
	for (i = 0; i < this.menuItems.length; ++i) {
		carouselWidth = Math.max(this.font.getStringWidth(this.menuItems[i]) + 10, carouselWidth);
	}
	this.carouselSurface = CreateSurface(carouselWidth, this.font.getHeight() + 10, CreateColor(0, 0, 0, 0));
}

MenuStrip.prototype.open = function()
{
	this.visibility = 0.0;
	this.scrollDirection = 0;
	this.scrollProgress = 0.0;
	this.mode = "open";
	var menuThread = Threads.createEntityThread(this);
	Threads.waitFor(menuThread);
	return this.chosenItem === null ? null : this.menuItems[this.chosenItem];
};
