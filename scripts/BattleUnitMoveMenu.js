/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("Core/Fader.js");

// BattleUnitMoveMenu() constructor
// Creates an object representing a move-choosing menu.
// Arguments:
//     battle:     The battle session during which the menu is being shown.
//     actingUnit: The BattleUnit to show available actions for.
function BattleUnitMoveMenu(battle, actingUnit)
{
	this.render = function() {
		menuBgColor = CreateColor(0, 0, 0, 192 * this.menuVisibilityFader.value)
		menuBorderColor = CreateColor(0, 0, 0, 224 * this.menuVisibilityFader.value)
		OutlinedRectangle(0, 16, 160, 16, menuBorderColor);
		Rectangle(1, 17, 158, 14, menuBgColor);
		for (var drawerName in this.drawers) {
			
		}
	};
	this.update = function() {
		return true;
	};
	this.getInput = function() {
		//TODO: implement me!
		if (this.menuVisibilityFader.value < 1.0
		    || (this.drawerSlideFader.value > 0.0 && this.drawerSlideFader.value < 1.0)
		    || this.cursorMoveFader.value != 0.0)
		{
			// ignore input during transition phases
			return;
		}
		if (this.drawerVisibilityFader <= 0.0) {
			// controlling top menu cursor (drawer closed)
		} else {
			// controlling move cursor (drawer open)
		}
	};
	
	this.battle = battle;
	this.actingUnit = actingUnit;
	this.menuVisibilityFader = new Fader(0.0);
	this.drawerSlideFader = new Fader(0.0);
	this.cursorMoveFader = new Fader();
	this.drawers = {
		'Attack': { rank: 2 },
		'Magic': { rank: 2 },
		'Strategy': { rank: 3 },
		'Item': { rank: 4 }
	};
}

// .show() method
// Opens the menu to allow the player to choose an action.
BattleUnitMoveMenu.prototype.show = function()
{
	this.battle.suspend();
	this.menuVisibilityFader.adjust(1.0, 15);
	var menuThread = Threads.createEntityThread(this, 2);
	Threads.waitFor(menuThread);
	this.battle.resume();
};
