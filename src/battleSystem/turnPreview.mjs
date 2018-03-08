/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Prim, Scene, Thread } from 'sphere-runtime';

import { drawTextEx } from '$/utilities';

export default
class TurnPreview extends Thread
{
	constructor()
	{
		super({ priority: 20 });

		this.entries = {};
		this.fadeness = 1.0;
		this.lastPrediction = null;

		let font = Font.Default;
		let outlineColor = Color.Black.fadeTo(0.25);
		let surface = new Surface(160, 16);
		let boxColor = Color.Black.fadeTo(0.66);
		let borderColor = Color.Black.fadeTo(0.75);
		Prim.drawRectangle(surface, 0, 0, 48, 16, 1.0, borderColor);
		Prim.drawSolidRectangle(surface, 1, 1, 46, 14, boxColor);
		font.drawText(surface, 11, 3, "next:", Color.Black);
		font.drawText(surface, 10, 2, "next:", Color.Silver);
		Prim.drawRectangle(surface, 48, 0, 112, 16, 1.0, borderColor);
		Prim.drawSolidRectangle(surface, 49, 1, 110, 14, boxColor);
		this.transform = new Transform();
		this.shape = new Shape(ShapeType.TriStrip, surface.toTexture(),
			new VertexList([
				{ x: 0,   y: 0,  u: 0.0, v: 1.0 },
				{ x: 160, y: 0,  u: 1.0, v: 1.0 },
				{ x: 0,   y: 16, u: 0.0, v: 0.0 },
				{ x: 160, y: 16, u: 1.0, v: 0.0 },
			]));
	}

	dispose()
	{
		this.stop();
	}

	ensureEntries(unit)
	{
		if (!(unit.tag in this.entries)) {
			let entry = {
				color: unit.isPartyMember() ? CreateColor(72, 61, 139, 255) : CreateColor(128, 0, 0, 255),
				name: unit.name,
				icon: new BattlerIcon(unit.name, unit.isPartyMember() ? Color.DarkSlateBlue : Color.DarkRed),
				turnBoxes: [],
			};
			for (let i = 0; i < 8; ++i) {
				entry.turnBoxes[i] = { x: 160, tween: null };
			}
			this.entries[unit.tag] = entry;
		}
	}

	set(prediction)
	{
		let moveEasing = 'easeInOutExpo';
		let moveTime = 15;
		if (this.lastPrediction !== null) {
			for (let i = 0; i < Math.min(this.lastPrediction.length, 7); ++i) {
				let unit = this.lastPrediction[i].unit;
				let turnIndex = this.lastPrediction[i].turnIndex;
				let turnBox = this.entries[unit.tag].turnBoxes[turnIndex];
				if (turnBox.tween !== null) {
					turnBox.tween.stop();
				}
				turnBox.tween = new Scene()
					.tween(turnBox, moveTime, moveEasing, { x: 160 });
				turnBox.tween.run();
			}
		}
		this.lastPrediction = prediction;
		for (let i = 0; i < Math.min(prediction.length, 7); ++i) {
			let unit = prediction[i].unit;
			let turnIndex = prediction[i].turnIndex;
			this.ensureEntries(unit);
			let turnBox = this.entries[unit.tag].turnBoxes[turnIndex];
			if (turnBox.tween !== null) {
				turnBox.tween.stop();
			}
			turnBox.tween = new Scene()
				.tween(turnBox, moveTime, moveEasing, { x: 48 + i * 16 });
			turnBox.tween.run();
		}
	}

	show()
	{
		if (!this.running) {
			console.log("activate battle screen turn preview");
			this.start();
		}
		new Scene()
			.tween(this, 30, 'easeOutExpo', { fadeness: 0.0 })
			.run();
	}

	on_render()
	{
		let alpha = 255 * (1.0 - this.fadeness);
		let y = -16 * this.fadeness;
		Surface.Screen.clipTo(0, y, 160, 16);
		this.transform.identity().translate(0, y);
		this.shape.draw(Surface.Screen, this.transform);
		for (const id in this.entries) {
			let entry = this.entries[id];
			for (let i = 0; i < entry.turnBoxes.length; ++i) {
				let turnBox = entry.turnBoxes[i];
				entry.icon.drawAt(Surface.Screen, turnBox.x, y);
			}
		}
		Surface.Screen.clipTo(0, 0, Surface.Screen.width, Surface.Screen.height);
	}
}

class BattlerIcon
{
	constructor(name, color)
	{
		let font = Font.Default;
		let outlineColor = Color.Black.fadeTo(0.25);
		let surface = new Surface(16, 16);
		Prim.drawSolidRectangle(surface, 0, 0, 16, 16, color);
		Prim.drawRectangle(surface, 0, 0, 16, 16, 1, outlineColor);
		font.drawText(surface, 5, 3, name[0], Color.Black);
		font.drawText(surface, 4, 2, name[0], Color.mix(Color.White, color));
		this.transform = new Transform();
		this.shape = new Shape(ShapeType.TriStrip, surface.toTexture(),
			new VertexList([
				{ x: 0,  y: 0,  u: 0.0, v: 1.0 },
				{ x: 16, y: 0,  u: 1.0, v: 1.0 },
				{ x: 0,  y: 16, u: 0.0, v: 0.0 },
				{ x: 16, y: 16, u: 1.0, v: 0.0 },
			]));
	}

	drawAt(surface, x, y)
	{
		this.transform.identity().translate(x, y);
		this.shape.draw(surface, this.transform);
	}
}
