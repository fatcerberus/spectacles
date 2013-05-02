/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("BattleSprite.js"); /*ALPHA*/

// BattleScreen() constructor
// Creates an object representing a battle screen.
// Arguments:
//     battle: The Battle associated with this battle screen.
function BattleScreen(battle)
{
	this.render = function() {
		Rectangle(0, 0, 320, 112, CreateColor(0, 128, 0, 255));
		Rectangle(0, 112, 320, 16, CreateColor(64, 64, 64, 255));
		Rectangle(0, 128, 320, 112, CreateColor(192, 128, 0, 255));
	};
	this.update = function() {
		return true;
	};
	
	this.thread = Threads.createEntityThread(this);
};

// .dispose() method
// Frees any resources associated with the BattleScreen.
BattleScreen.prototype.dispose = function()
{
	Threads.kill(this.thread);
};
