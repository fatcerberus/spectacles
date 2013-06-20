/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('Battle.js');

Scenario.defineCommand('adjustBGMVolume',
{
	start: function(sceneState, state, volume, duration) {
		duration = duration !== void null ? duration : 0.0;
		
		BGM.adjustVolume(volume, duration);
	},
	update: function(sceneState, state) {
		return BGM.isAdjusting();
	}
});

// .battle() command
// Starts a battle.
// Arguments:
//     battleID: The ID of the battle definition to use to initialize the fight.
Scenario.defineCommand('battle',
{
	start: function(sceneState, state, battleID) {
		var world = persist.getWorldState();
		new Battle(world.currentSession, battleID).run();
	}
});

Scenario.defineCommand('changeBGM',
{
	start: function(scene, state, trackName) {
		BGM.change(trackName);
	}
});

Scenario.defineCommand('overrideBGM',
{
	start: function(sceneState, state, trackName) {
		BGM.override(trackName);
	}
});

Scenario.defineCommand('resetBGM',
{
	start: function(sceneState, state) {
		BGM.reset();
	}
});

Scenario.defineCommand('talk',
{
	start: function(sceneState, state, speaker, textSpeed /*...pages*/) {
		state.speakerName = speaker;
		state.speakerText = state.speakerName != null ? state.speakerName + ":" : null;
		state.textSpeed = textSpeed;
		state.font = GetSystemFont();
		state.text = [];
		var speakerTextWidth = state.font.getStringWidth(state.speakerText);
		var textAreaWidth = GetScreenWidth() - 16;
		for (i = 4; i < arguments.length; ++i) {
			var lineWidth = state.speakerName != null ? textAreaWidth - (speakerTextWidth + 5) : textAreaWidth;
			var wrappedText = state.font.wordWrapString(arguments[i], lineWidth);
			var page = state.text.push([]) - 1;
			for (var iLine = 0; iLine < wrappedText.length; ++iLine) {
				state.text[page].push(wrappedText[iLine]);
			}
		}
		state.boxVisibility = 0.0;
		state.textVisibility = 1.0;
		state.nameVisibility = 0.0;
		state.lineVisibility = 0.0;
		state.scrollOffset = 0.0;
		state.currentPage = 0;
		state.numLinesToDraw = 0;
		state.topLine = 0;
		state.lineToReveal = 0;
		state.textSurface = CreateSurface(textAreaWidth, state.font.getHeight() * 3 + 1, CreateColor(0, 0, 0, 0));
		state.transition = new Scenario()
			.tween(state, 0.375, 'easeOutBack', { boxVisibility: 1.0 })
			.run();
		state.mode = "fadein";
		if (DBG_DISABLE_TEXTBOXES) {
			state.mode = "finish";
		}
		return true;
	},
	render: function(sceneState, state) {
		var lineHeight = state.font.getHeight();
		var boxHeight = lineHeight * 3 + 11;
		var finalBoxY = GetScreenHeight() * 0.85 - boxHeight / 2;
		var boxY = finalBoxY + (GetScreenHeight() - finalBoxY) * (1.0 - state.boxVisibility);
		OutlinedRectangle(-1, boxY - 1, GetScreenWidth() + 2, boxHeight + 2, CreateColor(0, 0, 0, 144 * state.boxVisibility));
		Rectangle(0, boxY, GetScreenWidth(), boxHeight, CreateColor(0, 0, 0, 128 * state.boxVisibility));
		state.textSurface.setBlendMode(REPLACE);
		state.textSurface.rectangle(0, 0, state.textSurface.width, state.textSurface.height, CreateColor(0, 0, 0, 0));
		state.textSurface.setBlendMode(BLEND);
		var lineCount = state.text[state.currentPage].length;
		var textAreaWidth = state.textSurface.width;
		var textX = 0;
		if (state.speakerName != null) {
			var speakerTextWidth = state.font.getStringWidth(state.speakerText);
			textX = speakerTextWidth + 5;
		}
		textAreaWidth -= textX;
		for (var iLine = Math.min(state.lineToReveal - state.topLine + 1, lineCount - state.topLine, 3) - 1; iLine >= 0; --iLine) {
			var trueLine = state.topLine + iLine;
			var textY = iLine * lineHeight - state.scrollOffset * lineHeight;
			var lineVisibility = iLine == 0 ? 1.0 - state.scrollOffset : 1.0;
			if (state.lineVisibility > 0.0 || state.lineToReveal != trueLine) {
				var lineText = state.text[state.currentPage][trueLine];
				state.font.setColorMask(CreateColor(0, 0, 0, 255 * state.textVisibility * lineVisibility));
				state.textSurface.drawText(state.font, textX + 1, textY + 1, lineText);
				state.font.setColorMask(CreateColor(255, 255, 255, 255 * state.textVisibility * lineVisibility));
				state.textSurface.drawText(state.font, textX, textY, lineText);
				if (state.lineToReveal == trueLine) {
					var shownArea = textAreaWidth * state.lineVisibility;
					state.textSurface.setBlendMode(SUBTRACT);
					state.textSurface.gradientRectangle((textX - lineHeight) + shownArea, textY, lineHeight, lineHeight + 1, CreateColor(0, 0, 0, 0), CreateColor(0, 0, 0, 255), CreateColor(0, 0, 0, 255 * state.boxVisibility), CreateColor(0, 0, 0, 0));
					state.textSurface.setBlendMode(REPLACE);
					state.textSurface.rectangle(textX + shownArea, textY, textAreaWidth - shownArea, lineHeight + 1, CreateColor(0, 0, 0, 0));
					state.textSurface.setBlendMode(BLEND);
				}
			}
			if (state.speakerName != null && state.currentPage == 0 && trueLine == 0) {
				state.font.setColorMask(CreateColor(0, 0, 0, state.textVisibility * state.nameVisibility * 255));
				state.textSurface.drawText(state.font, 1, textY + 1, state.speakerText);
				state.font.setColorMask(CreateColor(255, 192, 0, state.textVisibility * state.nameVisibility * 255));
				state.textSurface.drawText(state.font, 0, textY, state.speakerText);
			}
		}
		state.textSurface.blit(GetScreenWidth() / 2 - state.textSurface.width / 2, boxY + 5);
	},
	update: function(sceneState, state) {
		switch (state.mode) {
			case "fadein":
				if (!state.transition.isRunning()) {
					state.mode = "write";
				}
				break;
			case "write":
				state.nameVisibility = Math.min(state.nameVisibility + 4.0 / Engine.frameRate, 1.0);
				if (state.nameVisibility >= 1.0) {
					state.lineVisibility = Math.min(state.lineVisibility + (0.5 * state.textSpeed) / Engine.frameRate, 1.0);
					var lineCount = Math.min(3,state.text[state.currentPage].length - state.topLine);
					var currentLineText = state.text[state.currentPage][state.lineToReveal];
					var currentLineWidth = state.font.getStringWidth(currentLineText);
					var textAreaWidth = state.textSurface.width;
					if (state.speakerName != null) {
						var speakerTextWidth = state.font.getStringWidth(state.speakerText);
						textAreaWidth -= speakerTextWidth + 5;
					}
					if (state.lineVisibility >= 1.0 || textAreaWidth * state.lineVisibility >= currentLineWidth + 20) {
						if (state.lineToReveal - state.topLine == lineCount - 1) state.mode = "idle";
						++state.lineToReveal;
						++state.numLinesToDraw;
						if (state.numLinesToDraw < 3 && state.lineToReveal < state.text[state.currentPage].length) {
							state.mode = "nextline";
						} else {
							state.mode = "idle";
						}
						state.lineVisibility = 0.0;
					}
				}
				break;
			case "nextline":
				if (state.lineToReveal < 3) {
					state.lineVisibility = 0.0;
					state.mode = "write";
					break;
				}
				state.scrollOffset = Math.min(state.scrollOffset + (8.0 * state.textSpeed) / Engine.frameRate, 1.0);
				if (state.scrollOffset >= 1.0) {
					state.topLine += 1;
					state.scrollOffset = 0.0;
					state.lineVisibility = 0.0;
					state.textVisibility = 1.0;
					state.mode = "write";
				}
				break;
			case "page":
				state.textVisibility = Math.max(state.textVisibility - (2.0 * state.textSpeed) / Engine.frameRate, 0.0);
				if (state.textVisibility <= 0.0) {
					state.mode = "write";
					++state.currentPage;
					state.lineToReveal = 0;
					state.numLinesToDraw = 0;
					state.textVisibility = 1.0;
					state.topLine = 0;
					state.lineVisibility = 0.0;
				}
				break;
			case "hidetext":
				state.textVisibility = Math.max(state.textVisibility - (4.0 * state.textSpeed) / Engine.frameRate, 0.0);
				if (state.textVisibility <= 0.0) {
					state.transition = new Scenario()
						.tween(state, 0.375, 'easeInBack', { boxVisibility: 0.0 })
						.run();
					state.mode = "fadeout";
				}
				break;
			case "fadeout":
				if (!state.transition.isRunning()) {
					state.mode = "finish";
				}
				break;
			case "finish":
				return false;
		}
		return true;
	},
	getInput: function(sceneState, state) {
		if (state.mode != "idle") return;
		if (IsKeyPressed(GetPlayerKey(PLAYER_1, PLAYER_KEY_A))) {
			if (state.topLine + 3 >= state.text[state.currentPage].length) {
				if (state.currentPage < state.text.length - 1) {
					state.mode = "page";
				} else {
					state.mode = "hidetext";
				}
			} else {
				state.mode = "nextline";
				state.numLinesToDraw = 0;
				state.lineVisibility = 0.0;
			}
		}
	}
});

Scenario.defineCommand('teleport',
{
	start: function(sceneState, state, map, x, y) {
		ChangeMap(map + ".rmp");
		SetPersonXYFloat("*0", x, y);
	}
});
