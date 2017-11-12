/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2012 Power-Command
***/

import { Scene } from 'sphere-runtime';

import { drawTextEx } from '$/main.mjs';
import SpriteImage from '$/battleEngine/spriteImage.mjs';

export default
class BattleActor
{
	constructor(name, position, row, isEnemy)
	{
		this.damages = [];
		this.fadeScene = null;
		this.hasEntered = false;
		this.healings = [];
		this.isEnemy = isEnemy;
		this.isVisible = true;
		this.messageFont = GetSystemFont();
		this.name = name;
		this.opacity = 1.0;
		this.position = isEnemy ? position : 2 - position;
		this.row = row;
		this.sprite = new SpriteImage(`battlers/${name}.rss`);
		this.sprite.direction = isEnemy ? 'east' : 'west';
		this.x = isEnemy ? -32 : 320;
		this.y = 168 - position * 32;
	}

	update()
	{
		this.sprite.update();
		for (let i = 0; i < this.damages.length; ++i) {
			var data = this.damages[i];
			var finalY = 20 - 11 * i;
			if (data.finalY != finalY) {
				data.scene.stop();
				data.finalY = finalY;
				var tweenInfo = {};
				for (let i2 = 0; i2 < data.text.length; ++i2) {
					var yName = 'y' + i2.toString();
					tweenInfo[yName] = finalY;
				}
				data.scene = new Scene()
					.tween(data, 30, 'easeOutBounce', tweenInfo)
					.pause(15);
				data.scene.run();
			}
			if (!data.scene.running) {
				this.damages.splice(i, 1);
				--i;
			}
		}
		for (let i = 0; i < this.healings.length; ++i) {
			if (!this.healings[i].scene.running) {
				this.healings.splice(i, 1);
				--i;
			}
		}
		return true;
	}

	render()
	{
		if (!this.isVisible && this.damages.length == 0 && this.healings.length == 0)
			return;
		this.sprite.blit(this.x, this.y, this.opacity * 255);
		for (let i = 0; i < this.damages.length; ++i) {
			var text = this.damages[i].text;
			var x = this.x + 16 - this.messageFont.getStringWidth(text) / 2;
			for (let i2 = 0; i2 < text.length; ++i2) {
				var yName = 'y' + i2.toString();
				var y = this.y + this.damages[i][yName];
				var color = this.damages[i].color !== null ? this.damages[i].color
					: CreateColor(255, 255, 255, 255);
				drawTextEx(this.messageFont, x, y, text[i2], color, 1);
				x += this.messageFont.getStringWidth(text[i2]);
			}
		}
		for (let i = 0; i < this.healings.length; ++i) {
			var y = this.y + this.healings[i].y;
			var color = this.healings[i].color !== null ? this.healings[i].color : CreateColor(64, 255, 128, 255);
			var textColor = BlendColors(color, color);
			textColor.alpha *= this.healings[i].alpha / 255;
			drawTextEx(this.messageFont, this.x + 16, y, this.healings[i].amount, textColor, 1, 'center');
		}
	}

	async animate(animationID)
	{
		// TODO: implement me!
		switch (animationID) {
			case 'die':
				this.sprite.direction = 'north';
				new Scene()
					.tween(this, 60, 'easeInOutSine', { opacity: 0.1 })
					.run();
				break;
			case 'hippo':
				this.sprite = new SpriteImage('battlers/maggie_hippo.rss');
				this.sprite.direction = this.isEnemy ? 'east' : 'west';
				break;
			case 'revive':
				new Scene()
					.tween(this, 60, 'easeInOutSine', { opacity: 1.0 })
					.call(() => { this.sprite.direction = this.isEnemy ? 'east' : 'west'; })
					.run();
				break;
			case 'sleep':
				await new Scene()
					.talk("maggie", 2.0, this.name + " fell asleep! Hey, does that mean I get to eat him now?")
					.run();
				break;
		}
	}

	async enter(isImmediate = false)
	{
		if (this.hasEntered)
			return;
		var newX = this.isEnemy ? 64 - this.row * 32 : 224 + this.row * 32;
		if (!isImmediate) {
			await new Scene()
				.tween(this, 90, 'linear', { x: newX })
				.run();
		} else {
			this.x = newX;
		}
		this.sprite.stop();
		this.hasEntered = true;
	}

	showDamage(amount, color = null)
	{
		var finalY = 20 - 11 * this.damages.length;
		var data = { text: amount.toString(), color: color, finalY: finalY };
		var tweenInfo = {};
		for (let i = 0; i < data.text.length; ++i) {
			var yName = 'y' + i.toString();
			data[yName] = finalY - (20 - i * 5);
			tweenInfo[yName] = finalY;
		}
		data.scene = new Scene()
			.tween(data, 30, 'easeOutBounce', tweenInfo)
			.pause(15);
		data.scene.run();
		this.damages.push(data);
	}

	showHealing(amount, color = null)
	{
		var data = { amount: amount, color: color, y: 20, alpha: 255 };
		data.scene = new Scene()
			.tween(data, 60, 'easeOutExpo', { y: -11 * this.healings.length })
			.tween(data, 30, 'easeInOutSine', { alpha: 0 });
		data.scene.run();
		this.healings.push(data);
	}
}
