/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

// TurnPreview() constructor
// Creates an object representing the in-battle turn order preview.
function TurnPreview()
{
	this.entries = {};
	this.fadeness = 1.0;
	this.font = GetSystemFont();
	this.lastPrediction = null;
	this.thread = null;
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
	SetClippingRectangle(0, y, 160, 16);
	Rectangle(0, y, 48, 16, CreateColor(0, 0, 0, 192 * alpha / 255));
	OutlinedRectangle(0, y, 48, 16, CreateColor(0, 0, 0, 32 * alpha / 255));
	DrawTextEx(this.font, 24, y + 2, "next:", CreateColor(128, 128, 128, alpha), 1, 'center');
	Rectangle(48, y, 112, 16, CreateColor(0, 0, 0, 192 * alpha / 255));
	OutlinedRectangle(48, y, 112, 16, CreateColor(0, 0, 0, 32 * alpha / 255));
	for (var id in this.entries) {
		var entry = this.entries[id];
		for (var i = 0; i < entry.turnBoxes.length; ++i) {
			var turnBox = entry.turnBoxes[i];
			var pictureColor = CreateColor(entry.color.red, entry.color.green, entry.color.blue, entry.color.alpha * alpha / 255);
			Rectangle(turnBox.x, y, 16, 16, pictureColor);
			OutlinedRectangle(turnBox.x, y, 16, 16, CreateColor(0, 0, 0, 64 * alpha / 255));
			DrawTextEx(this.font, turnBox.x + 4, y + 2, entry.name[0], CreateColor(255, 255, 255, 128 * alpha / 255), 1);
		}
	}
	SetClippingRectangle(0, 0, GetScreenWidth(), GetScreenHeight());
};

// .ensureEntries() method
// Ensures that turn entries for a specified unit exist and creates them if
// they don't.
// Arguments:
//     unit: The battle unit to check for.
TurnPreview.prototype.ensureEntries = function(unit)
{
	if (!(unit.id in this.entries)) {
		var entry = {
			color: unit.isPartyMember() ? CreateColor(64, 80, 96, 255) : CreateColor(96, 48, 48, 255),
			name: unit.name,
			turnBoxes: []
		};
		for (var i = 0; i < 7; ++i) {
			entry.turnBoxes[i] = { x: 160, tween: null };
		}
		this.entries[unit.id] = entry;
	}
};

// .set() method
// Updates the turn preview with a new prediction from the battle engine.
// Arguments:
//     prediction: The upcoming turn prediction, as returned by Battle.predictTurns().
TurnPreview.prototype.set = function(prediction)
{
	var moveEasing = 'easeInOutExpo';
	var moveTime = 0.25;
	if (this.lastPrediction !== null) {
		for (var i = 0; i < Math.min(this.lastPrediction.length, 7); ++i) {
			var unit = this.lastPrediction[i].unit;
			var turnIndex = this.lastPrediction[i].turnIndex;
			var turnBox = this.entries[unit.id].turnBoxes[turnIndex];
			if (turnBox.tween !== null) {
				turnBox.tween.stop();
			}
			turnBox.tween = new Scenario()
				.tween(turnBox, moveTime, moveEasing, { x: 160 });
			turnBox.tween.run();
		}
	}
	this.lastPrediction = prediction;
	for (var i = 0; i < Math.min(prediction.length, 7); ++i) {
		var unit = prediction[i].unit;
		var turnIndex = prediction[i].turnIndex;
		this.ensureEntries(unit);
		var turnBox = this.entries[unit.id].turnBoxes[turnIndex];
		if (turnBox.tween !== null) {
			turnBox.tween.stop();
		}
		turnBox.tween = new Scenario()
			.tween(turnBox, moveTime, moveEasing, { x: 48 + i * 16 });
		turnBox.tween.run();
	}
};

// .show() method
// Shows the turn preview.
TurnPreview.prototype.show = function()
{
	if (this.thread === null) {
		Console.writeLine("Activating in-battle turn preview");
		this.thread = Threads.createEntityThread(this, 20);
	}
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
