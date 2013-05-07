/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("BattleSprite.js"); /*ALPHA*/

RequireScript("lib/Scenario.js");

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
	
	Scenario.defineCommand('$showBattle', {
		start: function(scene, state, battleScreen) {
			battleScreen.thread = Threads.createEntityThread(battleScreen);
		}
	});
	new Scenario()
		.fadeTo(CreateColor(255, 255, 255, 255), 0.5)
		.fadeTo(CreateColor(255, 255, 255, 0), 0.5)
		.fadeTo(CreateColor(255, 255, 255, 255), 0.5)
		.$showBattle(this)
		.fadeTo(CreateColor(0, 0, 0, 0), 2.0)
		.run();
	var transition = {
		capture: GrabImage(0, 0, GetScreenWidth(), GetScreenHeight()),
		phase: 0,
		fadeness: 0.0,
		tween: null
	};
	transition.tween = new Tween(transition, 0.5, 'easeInOutQuad', { fadeness: 1.0 });
};

// .dispose() method
// Frees any resources associated with the BattleScreen.
BattleScreen.prototype.dispose = function()
{
	Threads.kill(this.thread);
};
