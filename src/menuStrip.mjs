/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Scene, Thread } from 'sphere-runtime';

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
		let carouselWidth = 0;
		for (let i = 0; i < this.menuItems.length; ++i) {
			let itemText = this.menuItems[i].text;
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

		let key = AreKeysLeft() ? GetKey() : null;
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
		let height = this.font.getHeight() + 10;
		let menuY = Surface.Screen.height - height * this.openness;
		let normalStripColor = CreateColor(0, 0, 0, this.openness * 192);
		let litStripColor = CreateColor(255, 255, 255, this.openness * 192);
		let stripColor = BlendColorsWeighted(litStripColor, normalStripColor, this.brightness, 1.0 - this.brightness);
		Rectangle(0, menuY, Surface.Screen.width, height, stripColor);
		let normalTitleColor = CreateColor(64, 64, 64, this.openness * 255);
		let litTitleColor = CreateColor(0, 0, 0, this.openness * 255);
		let titleColor = BlendColorsWeighted(litTitleColor, normalTitleColor, this.brightness, 1.0 - this.brightness);
		this.font.setColorMask(CreateColor(0, 0, 0, this.openness * 255));
		this.font.drawText(6, menuY + 6, this.title);
		this.font.setColorMask(titleColor);
		this.font.drawText(5, menuY + 5, this.title);
		this.carouselSurface.setBlendMode(REPLACE);
		this.carouselSurface.rectangle(0, 0, this.carouselSurface.width, this.carouselSurface.height, CreateColor(0, 0, 0, 0));
		this.carouselSurface.setBlendMode(BLEND);
		let xOffset = (this.selectedItem + this.scrollProgress * this.scrollDirection) * this.carouselSurface.width;
		let normalItemColor = CreateColor(255, 192, 0, this.openness * 255);
		let litItemColor = CreateColor(128, 128, 64, this.openness * 255);
		let itemColor = BlendColorsWeighted(litItemColor, normalItemColor, this.brightness, 1.0 - this.brightness);
		for (let i = -1; i <= this.menuItems.length; ++i) {
			let itemIndex = i;
			if (i >= this.menuItems.length) {
				itemIndex = i % this.menuItems.length;
			} else if (i < 0) {
				itemIndex = this.menuItems.length - 1 - Math.abs(i + 1) % this.menuItems.length;
			}
			let itemText = this.menuItems[itemIndex].text;
			let textX = i * this.carouselSurface.width + (this.carouselSurface.width / 2 - this.font.getStringWidth(itemText) / 2);
			this.font.setColorMask(CreateColor(0, 0, 0, this.openness * 255));
			this.carouselSurface.drawText(this.font, textX - xOffset + 1, 6, itemText);
			this.font.setColorMask(itemColor);
			this.carouselSurface.drawText(this.font, textX - xOffset, 5, itemText);
		}
		let carouselX = Surface.Screen.width - 5 - this.carouselSurface.width - this.font.getStringWidth(">") - 5;
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
					let newSelection = this.selectedItem + this.scrollDirection;
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
