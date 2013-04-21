/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript("lib/persist.js");
RequireScript("lib/tween.js");

RequireScript("Core/Engine.js");
RequireScript("Core/BGM.js");
RequireScript("Session.js");
/*ALPHA*/ RequireScript("Cutscenes.js");
/*ALPHA*/ RequireScript("MenuStrip.js");

RequireScript("Game.js");

function game()
{
	Engine.initialize();
	persist.init();
	SetUpdateScript("Threads.updateAll();");
	SetRenderScript("Threads.renderAll();");
	BGM.track = "SpectaclesTheme";
	Engine.showLogo("TitleCard", 150);
	Threads.createEntityThread({
		visibility: 0.0,
		update: function() {
			this.visibility = Math.min(this.visibility + 1.0 / Engine.frameRate, 1.0);
			return true;
		},
		render: function() {
			Rectangle(0, 0, GetScreenWidth(), GetScreenHeight(), CreateColor(128, 128, 64, this.visibility * 255));
		}
	});
	var choice = new MenuStrip("S:BS Tech Demo", [ "Sample Cutscene", "Sample Battle" ]).open();
	MapEngine("main.rmp", Engine.frameRate);
}
