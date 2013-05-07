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
	this.startThread = function() {
		this.thread = Threads.createEntityThread(this);
	};
	
	this.render = function() {
		Rectangle(0, 0, 320, 112, CreateColor(0, 128, 0, 255));
		Rectangle(0, 112, 320, 16, CreateColor(64, 64, 64, 255));
		Rectangle(0, 128, 320, 112, CreateColor(192, 128, 0, 255));
	};
	this.update = function() {
		return true;
	};
	
	var startThread = delegate(this, 'startThread');
	new Scenario()
		.fadeTo(CreateColor(255, 255, 255, 255), 0.25)
		.fadeTo(CreateColor(255, 255, 255, 0), 0.5)
		.fadeTo(CreateColor(255, 255, 255, 255), 0.25)
		.call(startThread)
		.fadeTo(CreateColor(0, 0, 0, 0), 1.5)
		.run();
};

// .dispose() method
// Frees any resources associated with the BattleScreen.
BattleScreen.prototype.dispose = function()
{
	Threads.kill(this.thread);
};

// .announce() method
// Announces the use of a battler action to the player.
BattleScreen.prototype.announce = function(action, boxColor)
{
	if (!('announceAs' in action)) {
		return;
	}
	var announcement = {
		text: action.announceAs,
		color: boxColor,
		font: GetSystemFont(),
		endTime: 1000 + GetTime(),
		render: function() {
			var width = this.font.getStringWidth(this.text) + 20;
			var height = this.font.getHeight() + 10;
			var x = GetScreenWidth() / 2 - width / 2;
			var y = 132;
			Rectangle(x, y, width, height, this.color);
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 64));
			this.font.setColorMask(CreateColor(0, 0, 0, 255));
			this.font.drawText(x + 11, y + 6, this.text);
			this.font.setColorMask(CreateColor(255, 255, 255, 255));
			this.font.drawText(x + 10, y + 5, this.text);
		},
		update: function() {
			return GetTime() < this.endTime;
		}
	};
	Threads.waitFor(Threads.createEntityThread(announcement, 10));
};
