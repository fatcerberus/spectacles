/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('lib/JS.js');

RequireScript('lib/json2.js');
RequireScript('lib/MultiDelegate.js');
RequireScript('lib/persist.js');
RequireScript('lib/Scenario.js');

var DBG_DISABLE_BATTLES = false;
var DBG_DISABLE_BGM = true;
var DBG_DISABLE_TEXTBOXES = true;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_DISABLE_TITLE_SCREEN = true;
var DBG_DISABLE_TRANSITIONS = true;
var DBG_SHOW_CONSOLE = false;

EvaluateScript('Game.js');

RequireScript('Core/Engine.js');
RequireScript('Core/BGM.js');
RequireScript('Core/Console.js');
RequireScript('Core/Threads.js');
RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('GameOverScreen.js');
RequireScript('MenuStrip.js');
RequireScript('Session.js');
RequireScript('TitleScreen.js');

// game() function
// This is called by Sphere when the game is launched.
function game()
{
	Engine.initialize(60);
	Threads.initialize();
	BGM.initialize();
	Scenario.initialize();
	var sceneThread = Threads.doWith(Scenario,
		function() { this.updateAll(); return true; },
		function() { this.renderAll(); }, 99
	);
	persist.init();
	Console.initialize(19);
	
	if (DBG_SHOW_CONSOLE) {
		Console.show();
	}
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.change("SpectaclesTheme");
		Engine.showLogo("TitleCard", 150);
	}
	while (true) {
		var session = new TitleScreen("SpectaclesTheme").show();
		var world = persist.getWorldState();
		world.currentSession = session;
		session.party.members.scott.items.push(new ItemUsable('alcohol'));
		session.party.members.scott.items.push(new ItemUsable('tonic'));
		session.party.members.scott.items.push(new ItemUsable('powerTonic'));
		session.party.members.scott.items.push(new ItemUsable('holyWater'));
		session.party.members.scott.items.push(new ItemUsable('vaccine'));
		var doOver = false;
		do {
			var battleResult = new Battle(world.currentSession, 'robert2').go();
			if (battleResult == BattleResult.enemyWon) {
				var action = new GameOverScreen().show();
				doOver = action == GameOverAction.retry;
			} else {
				doOver = false;
			}
		} while (doOver);
	}
	
	MapEngine("main.rmp", Engine.frameRate);
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
	var aligners = {
		left: function(font, x, text) { return x; },
		center: function(font, x, text) { return x - font.getStringWidth(text) / 2; },
		right: function(font, x, text) { return x - font.getStringWidth(text); }
	};
	
	color = color !== void null ? color : CreateColor(255, 255, 255, 255);
	shadowDistance = shadowDistance !== void null ? shadowDistance : 0;
	alignment = alignment !== void null ? alignment : 'left';
	
	if (arguments.length < 4) {
		Abort(
			"DrawTextEx() - error: Wrong numbers of arguments\n" +
			"At least 4 arguments were expected; caller only passed " + arguments.length + "."
		);
	}
	if (!(alignment in aligners)) {
		Abort(
			"DrawTextEx() - error: Invalid argument\n" +
			"The caller specified an invalid text alignment mode: '" + alignment + "'."
		);
	}
	x = aligners[alignment](font, x, text);
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
		var dolly = o.hasOwnProperty('length') ? [] : {};
		clones.push({ original: o, dolly: dolly });
		for (var p in o) {
			dolly[p] = clone(o[p], clones);
		}
		return dolly;
	} else {
		return o;
	}
};

// delegate() function
// Creates a method delegate from an object and function. When the delegate is called, control is
// handed over to the function, with the object set as 'this'.
// Arguments:
//     o:      The object to pass as 'this' to the method.
//     method: The function to invoke when the delegate is called.
// Returns:
//     A function that, when called, invokes the method with the specified object as 'this'.
//     Note that if method is null, delegate() also returns null.
function delegate(o, method)
{
	if (method !== null) {
		return function(/*...*/) {
			return method.apply(o, arguments);
		};
	} else {
		return null;
	}
}
