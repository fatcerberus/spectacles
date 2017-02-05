/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2017 Power-Command
***/

import * as prim from 'prim';

export
class MPGauge
{
	constructor(capacity, color = Color.DodgerBlue, font = Font.Default) {
		this.color = color;
		this.textFont = font;
		
		this.animation = null;
		this.capacity = capacity;
		this.reading = capacity;
		this.usage = 0;
		this.usageColor = Color.Transparent;
		this.value = capacity;
	}

	draw(x, y, size)
	{
		screen.clipTo(x, y, size, size);
		if (this.capacity > 0) {
			var innerFillColor = this.color;
			var outerFillColor = Color.mix(this.color, Color.Black.fade(this.color.a));
			var outerUsageColor = this.usageColor;
			var innerUsageColor = Color.mix(this.usageColor, Color.Black.fade(this.usageColor.a));
			var maxRadius = Math.ceil(size * Math.sqrt(2) / 2);
			prim.circle(screen, x + size / 2, y + size / 2, maxRadius * (this.reading + this.usage) / this.capacity, innerUsageColor, outerUsageColor);
			prim.circle(screen, x + size / 2, y + size / 2, maxRadius * this.reading / this.capacity, innerFillColor, outerFillColor);
			drawText(this.textFont, x + size - 21, y + size / 2 - 8, 1, Color.White, Math.round(this.reading), 'right');
			drawText(this.textFont, x + size - 20, y + size / 2 - 4, 1, new Color(1, 0.75, 0), "MP");
		}
		screen.clipTo(0, 0, screen.width, screen.height);
	}

	set(value)
	{
		value = Math.min(Math.max(value, 0), this.capacity);
		if (value != this.value) {
			if (this.animation != null) {
				this.animation.stop();
			}
			this.animation = new scenes.Scene()
				.fork()
					.tween(this, 15, 'easeInOutSine', { usage: this.reading - value })
				.end()
				.fork()
					.tween(this, 15, 'easeInOutSine', { reading: value })
				.end()
				.tween(this.usageColor, 6, 'easeInOutSine', this.color)
				.tween(this.usageColor, 30, 'easeInOutSine', Color.Transparent)
				.run();
		}
		this.value = value;
	}

	update()
	{
		if (this.animation != null && !this.animation.isRunning()) {
			this.usage = 0;
		}
	}
}

function drawText(font, x, y, shadowDistance, color, text, alignment = 'left')
{
	const Align = {
		left(font, x, text) { return x; },
		center(font, x, text) { return x - font.getTextSize(text).width / 2; },
		right(font, x, text) { return x - font.getTextSize(text).width; }
	};

	if (!(alignment in Align))
		throw new Error(`invalid text alignment '${alignment}'.`);
	x = Align[alignment](font, x, text);
	font.drawText(screen, x + shadowDistance, y + shadowDistance, text, Color.Black.fade(color.a));
	font.drawText(screen, x, y, text, color);
}
