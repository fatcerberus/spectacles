/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("Core/Fader.js");

// BattleUnitActionMenu() constructor
// Creates an object representing a move-choosing menu.
// Arguments:
//     battle: The battle during which the menu is being shown.
//     unit:   The battle unit the menu is associated with.
function BattleUnitActionMenu(battle, unit)
{
	// .show() method
	// Opens the menu to allow the player to choose an action.
	this.show = function()
	{
		battle.suspend();
		this.menuVisibilityFader.adjust(1.0, 15);
		var threadID = Threads.createEntityThread(this, 2);
		Threads.waitFor(threadID);
		battle.resume();
	};
	
	// .checkInput() method
	// Handles player input.
	this.checkInput = function()
	{
		if (this.menuVisibilityFader.value < 1.0
		    || (this.drawerSlideFader.value > 0.0 && this.drawerSlideFader.value < 1.0)
		    || this.cursorMoveFader.value != 0.0)
		{
			// Ignore input during transition phases
			return;
		}
		if (this.drawerVisibilityFader <= 0.0) {
			// Control top menu cursor (drawer closed)
		} else {
			// Control move cursor (drawer open)
		}
	};
	
	// .update() method
	// Updates the menu's internal state.
	this.update = function()
	{
		return true;
	};
	
	// .render() method
	// Renders the menu.
	this.render = function()
	{
		menuBgColor = CreateColor(0, 0, 0, 192 * this.menuVisibilityFader.value)
		menuBorderColor = CreateColor(0, 0, 0, 224 * this.menuVisibilityFader.value)
		OutlinedRectangle(0, 16, 160, 16, menuBorderColor);
		Rectangle(1, 17, 158, 14, menuBgColor);
		for (var drawerName in this.drawers) {
			
		}
	};
	
	
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
