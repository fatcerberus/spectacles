/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('lib/JS.js');
RequireScript('lib/analogue.js');
RequireScript('lib/json3.js');
RequireScript('lib/link.js');
RequireScript('lib/MultiDelegate.js');
RequireScript('lib/Scenario.js');

var DBG_DISABLE_BATTLES = false;
var DBG_DISABLE_BGM = false;
var DBG_DISABLE_TEXTBOXES = false;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_DISABLE_TITLE_SCREEN = true;
var DBG_DISABLE_TRANSITIONS = false;
var DBG_LOG_CONSOLE_OUTPUT = false;
var DBG_SHOW_CONSOLE = false;

RequireScript('Core/Engine.js');
RequireScript('Core/BGM.js');
RequireScript('Core/Console.js');
RequireScript('Core/Threads.js');
RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('DayNightFilter.js');
RequireScript('GameOverScreen.js');
RequireScript('MenuStrip.js');
RequireScript('Session.js');
RequireScript('TitleScreen.js');

EvaluateScript('Game.js');

// game() function
// This is called by Sphere when the game is launched.
function game()
{
	Engine.initialize(60);
	Threads.initialize();
	BGM.initialize();
	Scenario.initialize();
	Threads.doWith(Scenario,
		function() { return this.updateAll(), true; },
		function() { this.renderAll(); }, 99);
	analogue.init();
	Console.initialize(19);
	
	if (DBG_SHOW_CONSOLE) {
		Console.show();
	}
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.override('SpectaclesTheme');
		Engine.showLogo('TitleCard', 5.0);
	}
	var session = new TitleScreen('SpectaclesTheme').show();
	analogue.world.currentSession = session;
	DayNightFilter.initialize();
	var setup = {
		battleID: 'numberEleven',
		party: {
			//scott: { level: 50, weapon: 'templeSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
			//elysia: { level: 8, weapon: 'fireAndIce', items: [ 'tonic', 'redBull', 'holyWater' ] },
			//maggie: { level: 8, items: [ 'redBull', 'alcohol' ] },
			bruce: { level: 60, weapon: 'arsenRifle', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine' ] },
			robert: { level: 60, weapon: 'rsbSword', items: [ 'tonic', 'powerTonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ] },
			amanda: { level: 60, items: [ 'powerTonic', 'redBull', 'holyWater' ] }
		}
	};
	Link(Game.initialPartyMembers).each(function(id) {
		session.party.remove(id);
	});
	for (var id in setup.party) {
		var memberInfo = setup.party[id];
		session.party.add(id, memberInfo.level);
		if ('weapon' in memberInfo) {
			session.party.members[id].setWeapon(memberInfo.weapon);
		}
		for (var iItem = 0; iItem < memberInfo.items.length; ++iItem) {
			session.party.members[id].items.push(new ItemUsable(memberInfo.items[iItem]));
		}
	}
	new Scenario()
		.battle(setup.battleID)
		.run(true);
	//MapEngine('main.rmp', Engine.frameRate);
}

// PATCH! - Scenario.run() method
// Scenario's built-in wait loop locks the Specs threader under most circumstances.
// This patches it so it plays along.
(function() {
	var old_Scenario_run = Scenario.prototype.run;
	
	Scenario.prototype.run = function(waitUntilDone)
	{
		waitUntilDone = waitUntilDone !== void null ? waitUntilDone : false;
		
		value = old_Scenario_run.call(this, false);
		if (waitUntilDone) {
			Threads.waitFor(Threads.doWith(this, function() {
				return this.isRunning();
			}));
		}
		return value;
	}
})();

function DrawTextEx(font, x, y, text, color, shadowDistance, alignment)
{
	color = color !== void null ? color : CreateColor(255, 255, 255, 255);
	shadowDistance = shadowDistance !== void null ? shadowDistance : 0;
	alignment = alignment !== void null ? alignment : 'left';
	
	if (arguments.length < 4) {
		Abort(
			"DrawTextEx() - error: Wrong numbers of arguments\n" +
			"At least 4 arguments were expected; caller only passed " + arguments.length + "."
		);
	}
	var alignments = {
		left: function(font, x, text) { return x; },
		center: function(font, x, text) { return x - font.getStringWidth(text) / 2; },
		right: function(font, x, text) { return x - font.getStringWidth(text); }
	};
	if (!(alignment in alignments)) {
		Abort("DrawTextEx() - error: Invalid argument\nThe caller specified an invalid text alignment mode: '" + alignment + "'.");
	}
	x = alignments[alignment](font, x, text);
	var oldColorMask = font.getColorMask();
	font.setColorMask(CreateColor(0, 0, 0, color.alpha));
	font.drawText(x + shadowDistance, y + shadowDistance, text);
	font.setColorMask(color);
	font.drawText(x, y, text);
	font.setColorMask(oldColorMask);
}

// clone() function
// Creates a deep copy of an object, preserving circular references.
// Arguments:
//     o: The object to clone.
// Returns:
//     The new, cloned object.
function clone(o)
{
	var clones = arguments.length >= 2 ? arguments[1] : [];
	if (typeof o === 'object' && o !== null) {
		for (var i = 0; i < clones.length; ++i) {
			if (o === clones[i].original) {
				return clones[i].dolly;
			}
		}
		var dolly = o instanceof Array ? []
			: 'clone' in o && typeof o.clone === 'function' ? o.clone()
			: {};
		clones.push({ original: o, dolly: dolly });
		if (o instanceof Array || !('clone' in o) || typeof o.clone !== 'function') {
			for (var p in o) {
				dolly[p] = clone(o[p], clones);
			}
		}
		return dolly;
	} else {
		return o;
	}
};
