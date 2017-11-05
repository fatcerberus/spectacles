/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { Prim, Scene, Thread } from 'sphere-runtime';

export default
class MenuStrip extends Thread
{
	constructor(title = "", isCancelable = true, items = null)
	{
		super({ priority: 100 });
		
		this.carouselSurface = null;
		this.font = GetSystemFont();
		this.isCancelable = isCancelable;
		this.menuItems = [];
		this.selectedItem = 0;
		this.title = title;
		if (items !== null) {
			for (const item of items)
				this.addItem(item);
		}
	}

	addItem(text, tag = text)
	{
		this.menuItems.push({
			text: text,
			tag: tag
		});
		return this;
	}

	async run()
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
		while (AreKeysLeft())
			GetKey();
		this.start();
		this.takeFocus();
		this.animation = new Scene()
			.tween(this, 15, 'easeOutQuad', { openness: 1.0 });
		this.animation.run();
		await Thread.join(this);
		return this.chosenItem !== null
			? this.menuItems[this.chosenItem].tag
			: null;
	}

	on_inputCheck()
	{
		if (this.mode != 'idle')
			return;

		var key = AreKeysLeft() ? GetKey() : null;
		if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_A)) {
			this.chosenItem = this.selectedItem;
			this.animation = new Scene()
				.fork()
					.tween(this, 7, 'easeInOutSine', { brightness: 1.0 })
					.tween(this, 7, 'easeInOutSine', { brightness: 0.0 })
				.end()
				.tween(this, 15, 'easeInQuad', { openness: 0.0 });
			this.animation.run();
			this.mode = 'close';
		} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_B) && this.isCancelable) {
			this.chosenItem = null;
			this.animation = new Scene()
				.tween(this, 15, 'easeInQuad', { openness: 0.0 });
			this.animation.run();
			this.mode = 'close';
		} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT)) {
			this.scrollDirection = -1;
			this.animation = new Scene()
				.tween(this, 15, 'linear', { scrollProgress: 1.0 });
			this.animation.run();
			this.mode = 'changeItem';
		} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT)) {
			this.scrollDirection = 1;
			this.animation = new Scene()
				.tween(this, 15, 'linear', { scrollProgress: 1.0 });
			this.animation.run();
			this.mode = 'changeItem';
		}
	}

	on_render()
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
		for (let i = -1; i <= this.menuItems.length; ++i) {
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
		let carouselX = GetScreenWidth() - 5 - this.carouselSurface.width - this.font.getStringWidth(">") - 5;
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
	}

	on_update()
	{
		switch (this.mode) {
			case 'open':
				if (!this.animation.running) {
					this.mode = "idle";
				}
				break;
			case 'changeItem':
				if (!this.animation.running) {
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
				if (!this.animation.running)
					this.stop();
		}
	}
}
