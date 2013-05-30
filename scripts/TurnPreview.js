/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// TurnPreview() constructor
// Creates an object representing an in-battle turn preview.
function TurnPreview()
{
	this.fadeness = 1.0;
	this.font = GetSystemFont();
	this.nextUp = null;
	this.thread = Threads.createEntityThread(this, 20);
};

// .dispose() method
// Frees resources associated with this TurnPreview object.
TurnPreview.prototype.dispose = function()
{
	Threads.kill(this.thread);
};

// .render() method
// Renders the turn preview.
TurnPreview.prototype.render = function()
{
	var alpha = 255 * (1.0 - this.fadeness);
	var y = -16 * this.fadeness;
	Rectangle(0, y, 48, 16, CreateColor(0, 0, 0, 192 * alpha / 255));
	OutlinedRectangle(0, y, 48, 16, CreateColor(0, 0, 0, 32 * alpha / 255));
	DrawTextEx(this.font, 24, y + 2, "next:", CreateColor(192, 192, 192, alpha), 1, 'center');
	if (this.nextUp !== null) {
		for (var i = 0; i < Math.min(this.nextUp.length, 7); ++i) {
			var actor = this.nextUp[i].actor;
			var x = 48 + i * 16;
			var pictureColor = actor.isEnemy ? CreateColor(128, 0, 0, 192 * alpha / 255) : CreateColor(0, 64, 128, 192 * alpha / 255);
			Rectangle(x, y, 16, 16, pictureColor);
			OutlinedRectangle(x, y, 16, 16, CreateColor(0, 0, 0, 64 * alpha / 255));
			DrawTextEx(this.font, x + 4, y + 2, actor.name[0], CreateColor(255, 255, 255, 192 * alpha / 255), 1);
		}
	} else {
		Rectangle(48, y, 112, 16, CreateColor(0, 0, 0, 192 * alpha / 255));
		OutlinedRectangle(48, y, 112, 16, CreateColor(0, 0, 0, 32 * alpha / 255));
	}
};

// .set() method
// Updates the turn preview with a new prediction from the battle engine.
// Arguments:
//     prediction: The upcoming turn prediction, as returned by Battle.predictTurns().
TurnPreview.prototype.set = function(prediction)
{
	this.nextUp = [];
	for (var i = 0; i < Math.min(prediction.length, 7); ++i) {
		this.nextUp.push({
			actor: prediction[i].unit.actor,
			turnIndex: prediction[i].turnIndex
		});
	}
};

// .show() method
// Shows the turn preview.
TurnPreview.prototype.show = function()
{
	new Scenario()
		.tween(this, 0.5, 'easeOutExpo', { fadeness: 0.0 })
		.run();
};

// .update() method
// Updates the turn preview for the next frame.
TurnPreview.prototype.update = function()
{
	return true;
};
