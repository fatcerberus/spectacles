/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Prim, Scene, Thread } from 'sphere-runtime';

import { drawTextEx } from '$/utilities';

export default
class TargetMenu extends Thread
{
	constructor(unit, battle, usable = null, moveName = null)
	{
		super({ priority: 10 });
		
		this.battle = battle;
		this.doChangeInfo = null;
		this.isChoiceMade = false;
		this.infoBoxFadeness = 1.0;
		this.infoFadeness = 1.0;
		this.isTargetScanOn = from(battle.alliesOf(unit))
			.where(unit => unit.isAlive())
			.any(unit => unit.allowTargetScan);
		this.isTargetLocked = false;
		this.isGroupCast = false;
		this.name = moveName !== null ? moveName
			: usable !== null ? usable.name
			: unit.name;
		this.statusNames = null;
		this.cursorFont = Font.Default;
		this.infoFont = Font.Default;
		this.targets = [];
		this.unit = unit;
		this.unitToShowInfo = null;
		this.usable = usable;
		this.allowDeadUnits = usable !== null ? usable.allowDeadTarget : false;

		this.drawCursor = function(unit)
		{
			let width = this.cursorFont.getTextSize(this.name).width + 10;
			let x = unit.actor.x < Surface.Screen.width / 2 ? unit.actor.x + 37 : unit.actor.x - 5 - width;
			let y = unit.actor.y + 6;
			Prim.drawSolidRectangle(Surface.Screen, x, y, width, 20, Color.Black.fadeTo(0.5));
			Prim.drawRectangle(Surface.Screen, x, y, width, 20, 1, Color.Black.fadeTo(0.25));
			drawTextEx(this.cursorFont, x + width / 2, y + 4, this.name, Color.White, 1, 'center');
		};

		this.drawInfoBox = function(x, y, width, height, alpha)
		{
			Prim.drawSolidRectangle(Surface.Screen, x, y, width, height, Color.Black.fadeTo(alpha * (1.0 - this.infoBoxFadeness)));
			Prim.drawRectangle(Surface.Screen, x, y, width, height, 1, Color.Black.fadeTo(0.125 * (1.0 - this.infoBoxFadeness)));
		};

		this.moveCursor = function(direction)
		{
			if (this.isGroupCast || this.targets == null)
				return;
			let position = this.targets[0].actor.position;
			let candidates = this.battle.alliesOf(this.targets[0]);
			let unitToSelect = null;
			while (unitToSelect === null) {
				position += direction;
				position = position > 2 ? 0
					: position < 0 ? 2
					: position;
				for (let i = 0; i < candidates.length; ++i) {
					if (position == candidates[i].actor.position
						&& (candidates[i].isAlive() || this.allowDeadUnits))
					{
						unitToSelect = candidates[i];
						break;
					}
				}
			}
			if (unitToSelect !== this.targets[0]) {
				this.targets = [ unitToSelect ];
				this.updateInfo();
			}
		};

		this.updateInfo = function()
		{
			let unit = this.targets.length == 1 ? this.targets[0] : null;
			if (this.doChangeInfo != null) {
				this.doChangeInfo.stop();
			}
			this.doChangeInfo = new Scene()
				.fork()
					.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
				.end()
				.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
				.resync()
				.call(() => {
					this.unitToShowInfo = unit;
					if (this.unitToShowInfo !== null) {
						this.statusNames = !this.unitToShowInfo.isAlive() ? [ "Knocked Out" ] : [];
						for (let i = 0; i < this.unitToShowInfo.statuses.length; ++i) {
							this.statusNames.push(this.unitToShowInfo.statuses[i].name);
						}
					}
				})
				.fork()
					.tween(this, 15, 'easeOutBack', { infoBoxFadeness: 0.0 })
				.end()
				.tween(this, 15, 'easeInOutSine', { infoFadeness: 0.0 });
			this.doChangeInfo.run();
		};
	}

	lockTargets(targetUnits)
	{
		this.targets = targetUnits;
		this.isTargetLocked = true;
	}

	async run()
	{
		this.isChoiceMade = false;
		if (!this.isTargetLocked) {
			this.targets = this.usable !== null
				? this.usable.defaultTargets(this.unit)
				: [ this.battle.enemiesOf(this.unit)[0] ];
		}
		this.isGroupCast = this.usable !== null ? this.usable.isGroupCast : false;
		this.updateInfo();
		while (AreKeysLeft()) {
			GetKey();
		}
		this.start();
		this.takeFocus();
		await Thread.join(this);
		return this.targets;
	}

	on_inputCheck()
	{
		switch (AreKeysLeft() ? GetKey() : null) {
			case GetPlayerKey(PLAYER_1, PLAYER_KEY_A):
				new Scene()
					.fork()
						.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
					.end()
					.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
					.resync()
					.call(function() { this.isChoiceMade = true; }.bind(this))
					.run();
				break;
			case GetPlayerKey(PLAYER_1, PLAYER_KEY_B):
				this.targets = null;
				new Scene()
					.fork()
						.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
					.end()
					.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
					.resync()
					.call(function() { this.isChoiceMade = true; }.bind(this))
					.run();
				break;
			case GetPlayerKey(PLAYER_1, PLAYER_KEY_UP):
				if (!this.isTargetLocked) {
					this.moveCursor(-1);
				}
				break;
			case GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN):
				if (!this.isTargetLocked) {
					this.moveCursor(1);
				}
				break;
			case GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT):
				if (!this.isTargetLocked && this.targets != null) {
					if (!this.isGroupCast) {
						this.targets = [ this.battle.enemiesOf(this.unit)[0] ];
					} else {
						this.targets = this.battle.enemiesOf(this.unit);
					}
					this.updateInfo();
				}
				break;
			case GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT):
				if (!this.isTargetLocked && this.targets != null) {
					if (!this.isGroupCast) {
						this.targets = [ this.unit ];
					} else {
						this.targets = this.battle.alliesOf(this.unit);
					}
					this.updateInfo();
				}
				break;
		}
	}

	on_render()
	{
		if (this.targets !== null) {
			for (let i = 0; i < this.targets.length; ++i) {
				this.drawCursor(this.targets[i]);
			}
		}
		if (this.unitToShowInfo != null) {
			Surface.Screen.clipTo(0, 16, 160, Surface.Screen.height - 16);
			let textAlpha = (1.0 - this.infoBoxFadeness) * (1.0 - this.infoFadeness);
			if (this.isTargetScanOn || this.unitToShowInfo.isPartyMember()) {
				let nameBoxHeight = 20 + 12 * this.statusNames.length;
				let y = 16 - (nameBoxHeight + 20) * this.infoBoxFadeness;
				Prim.drawSolidRectangle(Surface.Screen, 0, 16, 160, y - 16, Color.Black.fadeTo(0.5 * (1.0 - this.infoBoxFadeness)));
				this.drawInfoBox(0, y, 160, nameBoxHeight, 0.625);
				drawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, Color.Silver.fadeTo(textAlpha), 1, 'center');
				for (let i = 0; i < this.statusNames.length; ++i)
					drawTextEx(this.infoFont, 80, y + 16 + 12 * i, this.statusNames[i], Color.Goldenrod.fadeTo(textAlpha), 1, 'center');
				this.drawInfoBox(0, y + nameBoxHeight, 80, 20, 0.5);
				drawTextEx(this.infoFont, 40, y + nameBoxHeight + 4, "HP: " + this.unitToShowInfo.hp, Color.Khaki.fadeTo(textAlpha), 1, 'center');
				this.drawInfoBox(80, y + nameBoxHeight, 80, 20, 0.5);
				drawTextEx(this.infoFont, 120, y + nameBoxHeight + 4, "MP: " + this.unitToShowInfo.mpPool.availableMP, Color.Khaki.fadeTo(textAlpha), 1, 'center');
			} else {
				let y = 16 - 20 * this.infoBoxFadeness;
				Prim.drawSolidRectangle(Surface.Screen, 0, 16, 160, y - 16, Color.Black.fadeTo(0.5 * (1.0 - this.infoBoxFadeness)));
				this.drawInfoBox(0, y, 160, 20, 0.625);
				drawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, Color.Silver.fadeTo(textAlpha), 1, 'center');
			}
			Surface.Screen.clipTo(0, 0, Surface.Screen.width, Surface.Screen.height);
		}
	}

	on_update()
	{
		if (this.isChoiceMade)
			this.stop();
	}
}
