/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");

RequireScript("lib/SpriteImage.js");

// BattleSprite() constructor
// Creates an object representing a battler sprite.
// Arguments:
//     unit:       The BattleUnit this sprite represents.
//     position:   The position of the unit in the party order
//     isMirrored: If true, the sprite enters from the right. Otherwise, it enters from the left.
function BattleSprite(unit, position, row, isMirrored)
{
	this.render = function() {
		var direction;
		var x = this.xFader.value;
		var y;
		switch (this.position) {
			case 0: y = 160; break;
			case 1: y = 128; break;
			case 2: y = 192; break;
		}
		Rectangle(x + 1, y + 1, 14, 30, CreateColor(32, 32, 32, 255));
		this.idFont.setColorMask(CreateColor(255, 255, 255, 255));
		this.idFont.drawText(x + 5, y + 17, this.unit.name[0]);
		
	};
	this.update = function() {
		return true;
	};
	
	this.unit = unit;
	this.position = position;
	this.isMirrored = isMirrored;
	this.idFont = GetSystemFont(); /*ALPHA*/
	this.rowValue = row;
	this.xFader = new Fader(isMirrored ? 320.0 : -16.0);
	this.state = "idle";
	this.thread = Threads.createEntityThread(this, 1);
};

// .dispose() method
// Frees any resources used by the BattleSprite.
BattleSprite.prototype.dispose = function()
{
	Threads.kill(this.thread);
};

// .row property
// Gets or sets the sprite's current row.
// Returns:
//     A member of the BattleRow object specifying the sprite's current row.
BattleSprite.prototype.row getter = function()
{
	return this.rowValue;
};
BattleSprite.prototype.row setter = function(value)
{
	this.rowValue = value;
};

// .enter() method
// Causes the battle sprite to enter the battlefield from offscreen.
BattleSprite.prototype.enter = function()
{
	this.xFader.adjust(this.isMirrored ? 256 + this.row * 16 : 48 - this.row * 16, 0.5);
};

// .showDamage() method
// Displays damage taken by the battler.
// Arguments:
//     amount: The amount of damage taken.
BattleSprite.prototype.showDamage = function(amount)
{
};
