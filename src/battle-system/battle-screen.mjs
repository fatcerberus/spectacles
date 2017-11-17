/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2012 Power-Command
***/

import { Image, Prim, Scene, Thread } from 'sphere-runtime';

import { console, drawTextEx } from '$/main.mjs';
import { SpriteImage } from './sprite-image.mjs';
import { HPGauge, MPGauge, TurnPreview } from './ui.mjs';

import { Game } from '$/game-data/index.mjs';

export
class BattleScreen extends Thread
{
	constructor(partyMaxMP)
	{
		super();

		this.actorTypes = {
			enemy: { isEnemy: true },
			party: { isEnemy: false },
		};

		this.actors = {};
		for (const type in this.actorTypes)
			this.actors[type] = [];
		this.background = new Image('battleBackground');
		this.hud = new BattleHUD(partyMaxMP);

		this.startRunning = function()
		{
			console.log("activate main battle screen");
			this.start();
			this.hud.show();
		};
	}

	dispose()
	{
		this.hud.dispose();
		this.stop();
	}

	async announceAction(actionName, alignment, bannerColor = Color.Gray)
	{
		let announcement = {
			screen: this,
			text: actionName,
			alignment: alignment,
			color: bannerColor,
			font: GetSystemFont(),
			fadeness: 1.0,
			render() {
				let width = this.font.getStringWidth(this.text) + 20;
				let height = this.font.getHeight() + 10;
				let x = (Surface.Screen.width - width) / 2;
				let y = 112;
				let textY = y + (height - this.font.getHeight()) / 2;
				let boxColor = this.color.fadeTo(1.0 - this.fadeness);
				Prim.drawSolidRectangle(Surface.Screen, x, y, width, height, boxColor);
				Prim.drawRectangle(Surface.Screen, x, y, width, height, 1, Color.Black.fadeTo(0.25 * (1.0 - this.fadeness)));
				drawTextEx(this.font, x + width / 2, textY, this.text, CreateColor(255, 255, 255, 255 * (1.0 - this.fadeness)), 1, 'center');
			},
		};
		let job = Dispatch.onRender(() => announcement.render(), { priority: 10 });
		await new Scene()
			.tween(announcement, 7, 'easeInOutSine', { fadeness: 0.0 })
			.pause(46)
			.tween(announcement, 7, 'easeInOutSine', { fadeness: 1.0 })
			.run();
		job.cancel();
	}

	createActor(name, position, row, alignment, alreadyThere = false)
	{
		if (!(alignment in this.actorTypes))
			throw new Error(`invalid actor alignment '${alignment}'`);
		let isEnemy = this.actorTypes[alignment].isEnemy;
		let actor = new BattleActor(name, position, row, isEnemy, alreadyThere);
		this.actors[alignment].push(actor);
		return actor;
	}

	async fadeOut(duration)
	{
		if (Sphere.Game.disableAnimations) {
			this.dispose();
			return;
		}
		await new Scene()
			.fadeTo(Color.Black, duration)
			.call(() => this.dispose())
			.fadeTo(Color.Transparent, 0.5)
			.run();
	}

	async go(title = null)
	{
		this.title = title;
		await new Scene()
			.doIf(() => !Sphere.Game.disableAnimations)
				.fadeTo(Color.White, 15)
				.fadeTo(Color.Transparent, 30)
				.fadeTo(Color.White, 15)
			.end()
			.call(() => this.startRunning())
			.doIf(() => !Sphere.Game.disableAnimations)
				.fadeTo(Color.Transparent, 60)
			.end()
			.run();
	}

	async showTitle()
	{
		if (this.title === null || Sphere.Game.disableAnimations)
			return;
		await new Scene()
			.marquee(this.title, Color.Black.fadeTo(0.5))
			.run();
	}

	on_render()
	{
		this.background.blitTo(Surface.Screen, 0, -56);
		for (const type in this.actorTypes) {
			for (let i = 0; i < this.actors[type].length; ++i)
				this.actors[type][i].render();
		}
	}

	on_update()
	{
		for (const type in this.actorTypes) {
			for (let i = 0; i < this.actors[type].length; ++i)
				this.actors[type][i].update();
		}
	}
}

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

class BattleHUD extends Thread
{
	constructor(partyMaxMP)
	{
		super({ priority: 20 });
		
		this.enemyHPGaugeColor = Color.White;
		this.partyHPGaugeColor = Color.Lime;
		this.partyHighlightColor = CreateColor(25, 25, 112, 255);
		this.partyMPGaugeColor = Color.DarkOrchid;

		this.fadeness = 0.0;
		this.font = GetSystemFont();
		this.highlightColor = CreateColor(0, 0, 0, 0);
		this.highlightedUnit = null;
		this.hpGaugesInfo = [];
		this.mpGauge = new MPGauge(partyMaxMP, this.partyMPGaugeColor);
		this.partyInfo = [ null, null, null ];
		this.turnPreview = new TurnPreview();

		this.drawElementBox = function(x, y, width, height)
		{
			Rectangle(x, y, width, height, CreateColor(0, 0, 0, 192));
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 32));
		};

		this.drawHighlight = function(x, y, width, height, color)
		{
			var outerColor = color;
			var innerColor = BlendColors(outerColor, CreateColor(0, 0, 0, color.alpha));
			var halfHeight = Math.round(height / 2);
			GradientRectangle(x, y, width, halfHeight, outerColor, outerColor, innerColor, innerColor);
			GradientRectangle(x, y + halfHeight, width, height - halfHeight, innerColor, innerColor, outerColor, outerColor);
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, color.alpha / 2));
		};

		this.drawPartyElement = function(x, y, memberInfo, isHighlighted)
		{
			this.drawElementBox(x, y, 100, 20, CreateColor(0, 32, 0, 192));
			if (isHighlighted) {
				this.drawHighlight(x, y, 100, 20, this.highlightColor);
			}
			this.drawHighlight(x, y, 100, 20, memberInfo.lightColor);
			var headingColor = isHighlighted ?
				BlendColorsWeighted(CreateColor(255, 192, 0, 255), CreateColor(192, 144, 0, 255), this.highlightColor.alpha, 255 - this.highlightColor.alpha) :
				CreateColor(192, 144, 0, 255);
			var textColor = isHighlighted ?
				BlendColorsWeighted(CreateColor(255, 255, 255, 255), CreateColor(192, 192, 192, 255), this.highlightColor.alpha, 255 - this.highlightColor.alpha) :
				CreateColor(192, 192, 192, 255);
			memberInfo.hpGauge.draw(x + 5, y + 5, 24, 10);
			this.drawText(this.font, x + 34, y + 4, 1, textColor, memberInfo.unit.name);
			//this.drawText(this.font, x + 62, y + 6, 1, headingColor, "HP");
			//this.drawText(this.font, x + 61, y + 2, 1, textColor, Math.round(memberInfo.hp), 'right');
			Rectangle(x + 81, y + 3, 14, 14, CreateColor(64, 96, 128, 255));
			OutlinedRectangle(x + 81, y + 3, 14, 14, CreateColor(0, 0, 0, 255));
		}

		this.drawText = function(font, x, y, shadowDistance, color, text, alignment = 'left')
		{
			const Align =
			{
				left:   (font, x, text) => x,
				center: (font, x, text) => x - font.getStringWidth(text) / 2,
				right:  (font, x, text) => x - font.getStringWidth(text),
			};

			if (!(alignment in Align))
				throw new Error(`invalid text alignment '${alignment}'.`);
			x = Align[alignment](font, x, text);
			font.setColorMask(CreateColor(0, 0, 0, color.alpha));
			font.drawText(x + shadowDistance, y + shadowDistance, text);
			font.setColorMask(color);
			font.drawText(x, y, text);
		};
	}

	dispose()
	{
		this.stop();
		this.turnPreview.dispose();
	}

	createEnemyHPGauge(unit)
	{
		var gauge = new HPGauge(unit.maxHP, Game.bossHPPerBar, this.enemyHPGaugeColor, 20);
		this.hpGaugesInfo.push({ owner: unit, gauge: gauge });
		gauge.show(0.0);
		console.log(`create HP gauge for unit '${unit.name}'`, `cap: ${unit.maxHP}`);
	}

	hide()
	{
		new Scene()
			.tween(this, 15, 'easeInExpo', { fadeness: 0.0 })
			.run();
	}

	highlight(unit)
	{
		if (unit !== null) {
			this.highlightedUnit = unit;
			new Scene()
				.tween(this.highlightColor, 6, 'easeInQuad', BlendColors(this.partyHighlightColor, CreateColor(255, 255, 255, this.partyHighlightColor.alpha)))
				.tween(this.highlightColor, 15, 'easeOutQuad', this.partyHighlightColor)
				.run();
		} else {
			new Scene()
				.tween(this.highlightColor, 6, 'easeInQuad', CreateColor(0, 0, 0, 0))
				.run();
		}
	}

	setHP(unit, hp)
	{
		for (let i = 0; i < this.partyInfo.length; ++i) {
			var characterInfo = this.partyInfo[i];
			if (characterInfo !== null && characterInfo.unit == unit && hp != characterInfo.hp) {
				characterInfo.hpGauge.set(hp);
				var gaugeColor =
					hp / characterInfo.maxHP <= 0.1 ? Color.Red
					: hp / characterInfo.maxHP <= 0.33 ? Color.Yellow
					: Color.Lime;
				characterInfo.hpGauge.changeColor(gaugeColor, 0.5);
				var flashColor = hp > characterInfo.hp ? CreateColor(0, 192, 0, 255) : CreateColor(192, 0, 0, 255);
				new Scene()
					.fork()
						.tween(characterInfo.lightColor, 15, 'easeOutQuad', flashColor)
						.tween(characterInfo.lightColor, 15, 'easeOutQuad', CreateColor(0, 0, 0, 0))
					.end()
					.tween(characterInfo, 15, 'easeInOutSine', { hp: hp })
					.run();
			}
		}
		for (let i = 0; i < this.hpGaugesInfo.length; ++i) {
			var gaugeInfo = this.hpGaugesInfo[i];
			if (gaugeInfo.owner == unit) {
				gaugeInfo.gauge.set(hp);
			}
		}
	}

	setPartyMember(slot, unit, hp, maxHP)
	{
		if (slot < 0 || slot >= this.partyInfo.length) {
			Abort("BattleHUD.switchOut(): Invalid party slot index '" + slot + "'!");
		}
		var hpGauge = new HPGauge(maxHP, Game.partyHPPerBar, this.partyHPGaugeColor, 10);
		hpGauge.show();
		this.partyInfo[slot] = {
			unit: unit,
			hp: hp,
			maxHP: maxHP,
			hpGauge: hpGauge,
			lightColor: CreateColor(255, 0, 0, 0)
		};
	}

	show()
	{
		if (!this.running) {
			console.log("activate battle screen HUD");
			this.start();
		}
		new Scene()
			.tween(this, 30, 'easeOutExpo', { fadeness: 1.0 })
			.run();
	}

	on_render()
	{
		var y = -((this.partyInfo.length + this.hpGaugesInfo.length) * 20) * (1.0 - this.fadeness);
		var itemY = y;
		this.drawElementBox(260, itemY, 60, 60);
		this.mpGauge.draw(261, itemY + 1, 58);
		for (let i = 0; i < this.partyInfo.length; ++i) {
			var itemX = 160;
			var itemY = y + i * 20;
			if (this.partyInfo[i] !== null) {
				this.drawPartyElement(itemX, itemY, this.partyInfo[i], this.highlightedUnit == this.partyInfo[i].unit);
			} else {
				this.drawElementBox(itemX, itemY, 100, 20);
			}
		}
		for (let i = 0; i < this.hpGaugesInfo.length; ++i) {
			var gaugeInfo = this.hpGaugesInfo[i];
			var itemX = 160;
			var itemY = y + this.partyInfo.length * 20 + i * 20;
			this.drawElementBox(itemX, itemY, 160, 20);
			if (this.highlightedUnit == gaugeInfo.owner) {
				this.drawHighlight(itemX, itemY, 160, 20, this.highlightColor);
			}
			Rectangle(itemX + 141, itemY + 3, 14, 14, CreateColor(128, 32, 32, 255));
			OutlinedRectangle(itemX + 141, itemY + 3, 14, 14, CreateColor(0, 0, 0, 255));
			gaugeInfo.gauge.draw(itemX + 5, itemY + 5, 131, 10);
		}
	}

	on_update()
	{
		for (let i = 0; i < this.partyInfo.length; ++i) {
			if (this.partyInfo[i] !== null) {
				this.partyInfo[i].hpGauge.update();
			}
		}
		for (let i = 0; i < this.hpGaugesInfo.length; ++i) {
			this.hpGaugesInfo[i].gauge.update();
		}
	}
}
