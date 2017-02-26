/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('BattleActor.js');
RequireScript('BattleHUD.js');

// BattleScreen() constructor
// Creates an object representing the battle screen.
// Arguments:
//     partyMaxMP:  The party's current MP capacity.
function BattleScreen(partyMaxMP)
{
	this.actorTypes = {
		enemy: { isEnemy: true },
		party: { isEnemy: false }
	};
	
	this.actors = {};
	for (var type in this.actorTypes) {
		this.actors[type] = [];
	}
	this.background = LoadImage('TestBattle.png');
	this.hud = new BattleHUD(partyMaxMP);
	
	this.startRunning = function()
	{
		term.print("Activating battle screen");
		this.thread = threads.create(this);
		this.hud.show();
	};
}
	
// .dispose() method
// Frees all outstanding resources associated with the BattleScreen.
BattleScreen.prototype.dispose = function()
{
	this.hud.dispose();
	threads.kill(this.thread);
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
	var bannerColor = alignment == 'enemy' ? CreateColor(128, 32, 32, 192) : CreateColor(64, 64, 192, 192);
	var announcement = {
		screen: this,
		text: actionName,
		alignment: alignment,
		color: bannerColor,
		font: GetSystemFont(),
		fadeness: 1.0,
		render: function() {
			var width = this.font.getStringWidth(this.text) + 20;
			var height = this.font.getHeight() + 10;
			var x = GetScreenWidth() / 2 - width / 2;
			var y = 112;
			var textY = y + height / 2 - this.font.getHeight() / 2;
			var boxColor = CreateColor(this.color.red, this.color.green, this.color.blue, this.color.alpha * (1.0 - this.fadeness));
			Rectangle(x, y, width, height, boxColor);
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 64 * (1.0 - this.fadeness)));
			DrawTextEx(this.font, x + width / 2, textY, this.text, CreateColor(255, 255, 255, 255 * (1.0 - this.fadeness)), 1, 'center');
		},
		update: function() {
			return true;
		}
	};
	var thread = threads.create(announcement, 10);
	new scenes.Scene()
		.tween(announcement, 7, 'easeInOutSine', { fadeness: 0.0 })
		.pause(46)
		.tween(announcement, 7, 'easeInOutSine', { fadeness: 1.0 })
		.run(true);
	threads.kill(thread);
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

// .fadeOut() method
// Fades out of the battle screen.
// Arguments:
//     duration: Optional. The duration, in seconds, of the fade out.
// Remarks:
//     This method calls dispose() internally. As when dispose() is called directly, you should avoid doing
//     anything else with the BattleScreen object afterwards.
BattleScreen.prototype.fadeOut = function(duration)
{
	if (Sphere.Game.disableAnimations) {
		this.dispose();
		return;
	}
	new scenes.Scene()
		.fadeTo(Color.Black, duration)
		.call(this.dispose.bind(this))
		.fadeTo(Color.Transparent, 0.5)
		.run(true);
};

// .go() method
// Transitions to the battle screen.
// Arguments:
//     title: Optional. A title to display during the battle transiton.
BattleScreen.prototype.go = function(title)
{
	title = title !== void null ? title : null;
	
	this.title = title;
	new scenes.Scene()
		.doIf(() => !Sphere.Game.disableAnimations)
			.fadeTo(Color.White, 15)
			.fadeTo(Color.Transparent, 30)
			.fadeTo(Color.White, 15)
		.end()
		.call(this.startRunning.bind(this))
		.doIf(() => !Sphere.Game.disableAnimations)
			.fadeTo(Color.Transparent, 60)
		.end()
		.run(true);
};

// .render() method
// Renders the BattleScreen.
BattleScreen.prototype.render = function()
{
	this.background.blit(0, -56);
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
	if (Sphere.Game.disableAnimations) {
		return;
	}
	new scenes.Scene()
		.marquee(this.title, Color.Black.fade(0.5))
		.run(true);
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
