/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Prim, Scene, Thread } from 'sphere-runtime';

import { drawTextEx } from '$/utility';

export default
class TurnPreview extends Thread
{
	constructor()
	{
		super({ priority: 20 });

		this.entries = {};
		this.fadeness = 1.0;
		this.font = GetSystemFont();
		this.lastPrediction = null;
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
				turnBoxes: []
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
		SetClippingRectangle(0, y, 160, 16);
		Rectangle(0, y, 48, 16, CreateColor(0, 0, 0, alpha * 0.75));
		OutlinedRectangle(0, y, 48, 16, CreateColor(0, 0, 0, alpha * 0.125));
		drawTextEx(this.font, 24, y + 2, "next:", CreateColor(128, 128, 128, alpha), 1, 'center');
		Rectangle(48, y, 112, 16, CreateColor(0, 0, 0, alpha * 0.75));
		OutlinedRectangle(48, y, 112, 16, CreateColor(0, 0, 0, alpha * 0.125));
		for (const id in this.entries) {
			let entry = this.entries[id];
			for (let i = 0; i < entry.turnBoxes.length; ++i) {
				let turnBox = entry.turnBoxes[i];
				Rectangle(turnBox.x, y, 16, 16, entry.color);
				OutlinedRectangle(turnBox.x, y, 16, 16, CreateColor(0, 0, 0, alpha * 0.25));
				drawTextEx(this.font, turnBox.x + 4, y + 2, entry.name[0], BlendColors(entry.color, CreateColor(255, 255, 255, 255)), 1);
			}
		}
		SetClippingRectangle(0, 0, Surface.Screen.width, Surface.Screen.height);
	}
}
