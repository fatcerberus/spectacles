/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

// MoveMenu() constructor
// Creates an object representing a move-choosing menu.
// Arguments:
//     battle: The Battle during which the menu will be shown.
//     actor:  The BattleUnit the menu belongs to.
function MoveMenu(battle, actor)
{
	this.$battle = battle;
	this.$actor = actor;
	this.$skill = null;
	this.$fadeness = 0.0;
	this.$fadeTween = null;
	
	this.render = function() {
		var topMenuY = 240 - (224 * this.$fadeness);
		OutlinedRectangle(0, topMenuY, 160, 16, CreateColor(0, 0, 0, 144));
		Rectangle(1, topMenuY + 1, 158, 14, CreateColor(0, 0, 0, 128));
	};
	this.update = function() {
		return this.$skill == null || !this.$fadeTween.isFinished();
	};
	this.getInput = function() {
		if (!this.$fadeTween.isFinished()) {
			return;
		}
		//TODO: implement me!
	};
}

// .open() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.open = function()
{
	this.$battle.suspend();
	this.$fadeTween = new Tween(this, 0.5, 'easeOutBack', { $fadeness: 1.0 });
	this.$fadeTween.start();
	Threads.waitFor(Threads.createEntityThread(this, 20));
	this.$battle.resume();
	return this.move;
};
