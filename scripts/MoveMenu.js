/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("Core/Tween.js");

// MoveMenu() constructor
// Creates an object representing a move-choosing menu.
// Arguments:
//     battle: The Battle during which the menu will be shown.
//     actor:  The BattleUnit the menu belongs to.
function MoveMenu(battle, actor)
{
	this.render = function() {
		//TODO: implement me!
	};
	this.update = function() {
		//TODO: implement me!
		return true;
	};
	this.getInput = function() {
		//TODO: implement me!
	};
	
	this.battle = battle;
	this.actor = actor;
	this.move = null;
}

// .show() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.show = function()
{
	this.battle.suspend();
	Threads.waitFor(Threads.createEntityThread(this, 20));
	this.battle.resume();
	return this.move;
};
