/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('BattleActor.js');
RequireScript('BattleHUD.js');

// BattleScreen() constructor
// Creates an object representing a battle screen.
// Arguments:
//     partyMaxMP:  The party's current MP capacity.
//     accentColor: Optional. The accent color for the battle. (default: #008000).
function BattleScreen(partyMaxMP, accentColor)
{
	accentColor = accentColor !== void null ? accentColor : CreateColor(255, 255, 255, 255);
	
	this.actorTypes = {
		enemy: { isEnemy: true },
		party: { isEnemy: false }
	};
	
	this.accentColor = accentColor;
	this.actors = {};
	for (var type in this.actorTypes) {
		this.actors[type] = [];
	}
	this.hud = new BattleHUD(partyMaxMP, accentColor);
	
	this.startRunning = function()
	{
		this.thread = Threads.createEntityThread(this);
		this.hud.show();
	};
}
	
// .dispose() method
// Frees all outstanding resources associated with the BattleScreen.
BattleScreen.prototype.dispose = function()
{
	this.hud.dispose();
	Threads.kill(this.thread);
};

// .announceAction() method
// Momentarily displays the name of an action being performed.
// Arguments:
//     action:      The action being performed.
//     alignment:   The alignment of the character performing the action. Can be one of the following:
//                      'party': A member of the player's party.
//                      'enemy': An enemy battler.
//     bannerColor: The background color to use for the announcement banner.
BattleScreen.prototype.announceAction = function(actionName, alignment, bannerColor)
{
	var bannerColor = alignment == 'enemy' ? CreateColor(128, 32, 32, 255) : CreateColor(64, 64, 192, 255);
	var announcement = {
		screen: this,
		text: actionName,
		alignment: alignment,
		color: bannerColor,
		font: GetSystemFont(),
		endTime: 1000 + GetTime(),
		render: function() {
			var width = this.font.getStringWidth(this.text) + 50;
			var height = this.font.getHeight() + 10;
			var x = GetScreenWidth() / 2 - width / 2;
			var y = GetScreenHeight() / 2 - height / 2;
			var textX = x + width / 2 - this.font.getStringWidth(this.text) / 2;
			var textY = y + height / 2 - this.font.getHeight() / 2;
			Rectangle(x, y, width, height, this.color);
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 128));
			this.font.setColorMask(CreateColor(0, 0, 0, 255));
			this.font.drawText(textX + 1, textY + 1, this.text);
			this.font.setColorMask(CreateColor(255, 255, 255, 255));
			this.font.drawText(textX, textY, this.text);
		},
		update: function() {
			return GetTime() < this.endTime;
		}
	};
	Threads.waitFor(Threads.createEntityThread(announcement, 10));
};

// .createActor() method
// Creates an actor to be displayed on this BattleScreen.
// Arguments:
//     name:         The actor's name.
//     position:     The position of the battler in the party order. The leader should be in position 1 (center)
//                   while the left and right flanks are positions 0 and 2, respectively.
//     row:          The row (front, middle, rear) that the battler is in.
//     alignment:    The alignment of the battler the actor will be playing. Can be one of the following:
//                       'enemy': The actor represents a monster or other enemy. Enters from the left.
//                       'party': The actor represents a playable character. Enters from the right.
//     alreadyThere: If true, the actor is displayed immediately. Otherwise, you must call the actor's .enter()
//                   method to bring it on-screen.
// Returns:
//     A reference to a BattleActor object representing the new actor.
BattleScreen.prototype.createActor = function(name, position, row, alignment, alreadyThere)
{
	if (!(alignment in this.actorTypes)) {
		Abort("BattleScreen.createActor(): Invalid actor alignment '" + alignment + "'");
	}
	var isEnemy = this.actorTypes[alignment].isEnemy;
	var actor = new BattleActor(name, position, row, isEnemy, alreadyThere);
	this.actors[alignment].push(actor);
	return actor;
};

// .go() method
// Transitions to the battle screen.
// Arguments:
//     title: Optional. A title to display during the battle transiton.
BattleScreen.prototype.go = function(title)
{
	if (title === void null) { title = null; }
	
	this.title = title;
	if (DBG_DISABLE_TRANSITIONS) {
		this.startRunning();
		return;
	}
	var transition = new Scenario()
		.fadeTo(CreateColor(255, 255, 255, 255), 0.25)
		.fadeTo(CreateColor(0, 0, 0, 0), 0.5)
		.fadeTo(CreateColor(255, 255, 255, 255), 0.25)
		.call(delegate(this, this.startRunning))
		.fadeTo(CreateColor(0, 0, 0, 0), 1.0)
		.run();
	Threads.waitFor(Threads.doWith(transition,
		function() { return this.isRunning(); }
	));
};

// .render() method
// Renders the BattleScreen.
BattleScreen.prototype.render = function()
{
	Rectangle(0, 0, 320, 112, CreateColor(0, 128, 0, 255));
	Rectangle(0, 112, 320, 16, CreateColor(64, 64, 64, 255));
	Rectangle(0, 128, 320, 112, CreateColor(192, 128, 0, 255));
	for (var type in this.actorTypes) {
		for (var i = 0; i < this.actors[type].length; ++i) {
			this.actors[type][i].render();
		}
	}
};

// .showTitle() method
// Displays the title of the battle, if one is defined.
BattleScreen.prototype.showTitle = function()
{
	if (this.title === null) {
		return;
	}
	if (DBG_DISABLE_TRANSITIONS) {
		return;
	}
	var titleScene = new Scenario()
		.marquee("Boss Battle: " + this.title, CreateColor(0, 0, 0, 128))
		.run();
	Threads.waitFor(Threads.doWith(titleScene, function() { return this.isRunning(); }))
};

// .update() method
// Advances the BattleScreen's internal state by one frame.
// Returns:
//     true if the BattleScreen is still active; false otherwise.
BattleScreen.prototype.update = function()
{
	for (var type in this.actorTypes) {
		for (var i = 0; i < this.actors[type].length; ++i) {
			this.actors[type][i].update();
		}
	}
	return true;
};
