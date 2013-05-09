/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("Core/Threads.js");
RequireScript("Battle.js");

RequireScript("lib/Scenario.js");

var textBoxFont = GetSystemFont();

if (DBG_DISABLE_SCENE_DELAYS) {
	delete Scenario.prototype.pause;
	Scenario.defineCommand("pause", {
		start: function(sceneState, state, duration) {}
	});
}

Scenario.defineCommand("battle", {
	start: function(sceneState, state, setup) {
		new Battle(null, setup).run();
	}
});
Scenario.defineCommand("fadeBGM", {
	start: function(sceneState, state, volume, duration) {
		BGM.adjustVolume(volume, duration);
	},
	update: function(sceneState, state) {
		return BGM.isAdjusting();
	}
});
Scenario.defineCommand("marquee", {
	start: function(sceneState, state, text, color) {
		if (color === void null) { color = CreateColor(255, 255, 255, 255); }
		
		state.text = text;
		state.color = color;
		state.font = GetSystemFont();
		state.windowSize = GetScreenWidth() + state.font.getStringWidth(state.text);
		state.height = state.font.getHeight() + 10;
		state.textHeight = state.font.getHeight();
		state.fadeness = 0.0;
		state.scroll = 0.0;
		state.tweens = [
			new Tween(state, 0.25, 'linear', { fadeness: 1.0 }),
			new Tween(state, 1.0, 'easeOutExpo', { scroll: 0.5 }),
			new Tween(state, 1.0, 'easeInExpo', { scroll: 1.0 }),
			new Tween(state, 0.25, 'linear', { fadeness: 0.0 })
		];
		state.nextTweenID = 0;
		state.currentTween = null;
	},
	render: function(sceneState, state) {
		var boxHeight = state.height * state.fadeness;
		var boxY = GetScreenHeight() / 2 - boxHeight / 2;
		var textX = GetScreenWidth() - state.scroll * state.windowSize;
		var textY = boxY + boxHeight / 2 - state.textHeight / 2;
		OutlinedRectangle(-1, boxY - 1, GetScreenWidth() + 2, boxHeight + 2, CreateColor(0, 0, 0, 224 * state.fadeness));
		Rectangle(0, boxY, GetScreenWidth(), boxHeight, CreateColor(0, 0, 0, 192 * state.fadeness));
		state.font.setColorMask(CreateColor(0, 0, 0, state.color.alpha));
		state.font.drawText(textX + 1, textY + 1, state.text);
		state.font.setColorMask(state.color);
		state.font.drawText(textX, textY, state.text);
	},
	update: function(sceneState, state) {
		if (state.currentTween == null || state.currentTween.isFinished()) {
			if (state.nextTweenID < state.tweens.length) {
				state.currentTween = state.tweens[state.nextTweenID];
				state.currentTween.start();
				++state.nextTweenID;
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	}
});
Scenario.defineCommand("overrideBGM", {
	start: function(sceneState, state, song) {
		BGM.override(song);
	}
});
Scenario.defineCommand("resetBGM", {
	start: function(sceneState, state) {
		BGM.reset();
	}
});
Scenario.defineCommand("talk", {
	start: function(sceneState, state, speaker, textSpeed /*...pages*/) {
		state.speakerName = speaker;
		state.speakerText = state.speakerName != null ? state.speakerName + ":" : null;
		state.textSpeed = textSpeed;
		state.text = [];
		var speakerTextWidth = textBoxFont.getStringWidth(state.speakerText);
		var textAreaWidth = GetScreenWidth() - 16;
		for (i = 4; i < arguments.length; ++i) {
			var lineWidth = state.speakerName != null ? textAreaWidth - (speakerTextWidth + 5) : textAreaWidth;
			var wrappedText = textBoxFont.wordWrapString(arguments[i], lineWidth);
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
		state.textSurface = CreateSurface(textAreaWidth, textBoxFont.getHeight() * 3 + 1, CreateColor(0, 0, 0, 0));
		state.mode = "fadein";
		if (DBG_DISABLE_TEXTBOXES) state.mode = "finish";
		return true;
	},
	render: function(sceneState, state) {
		var lineHeight = textBoxFont.getHeight();
		var boxHeight = (lineHeight * 3 + 11) * state.boxVisibility;
		var boxY = GetScreenHeight() / 3 - boxHeight / 2;
		OutlinedRectangle(-1, boxY - 1, GetScreenWidth() + 2, boxHeight + 2, CreateColor(0, 0, 0, 224 * state.boxVisibility));
		Rectangle(0, boxY, GetScreenWidth(), boxHeight, CreateColor(0, 0, 0, 192 * state.boxVisibility));
		state.textSurface.setBlendMode(REPLACE);
		state.textSurface.rectangle(0, 0, state.textSurface.width, state.textSurface.height, CreateColor(0, 0, 0, 0));
		state.textSurface.setBlendMode(BLEND);
		var lineCount = state.text[state.currentPage].length;
		var textAreaWidth = state.textSurface.width;
		var textX = 0;
		if (state.speakerName != null) {
			var speakerTextWidth = textBoxFont.getStringWidth(state.speakerText);
			textX = speakerTextWidth + 5;
		}
		textAreaWidth -= textX;
		for (var iLine = Math.min(state.lineToReveal - state.topLine + 1, lineCount - state.topLine, 3) - 1; iLine >= 0; --iLine) {
			var trueLine = state.topLine + iLine;
			var textY = iLine * lineHeight - state.scrollOffset * lineHeight;
			var lineVisibility = iLine == 0 ? 1.0 - state.scrollOffset : 1.0;
			if (state.lineVisibility > 0.0 || state.lineToReveal != trueLine) {
				var lineText = state.text[state.currentPage][trueLine];
				textBoxFont.setColorMask(CreateColor(0, 0, 0, 255 * state.textVisibility * lineVisibility));
				state.textSurface.drawText(textBoxFont, textX + 1, textY + 1, lineText);
				textBoxFont.setColorMask(CreateColor(255, 255, 255, 255 * state.textVisibility * lineVisibility));
				state.textSurface.drawText(textBoxFont, textX, textY, lineText);
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
				textBoxFont.setColorMask(CreateColor(0, 0, 0, state.textVisibility * state.nameVisibility * 255));
				state.textSurface.drawText(textBoxFont, 1, textY + 1, state.speakerText);
				textBoxFont.setColorMask(CreateColor(255, 192, 0, state.textVisibility * state.nameVisibility * 255));
				state.textSurface.drawText(textBoxFont, 0, textY, state.speakerText);
			}
		}
		state.textSurface.blit(GetScreenWidth() / 2 - state.textSurface.width / 2, boxY + 5);
	},
	update: function(sceneState, state) {
		switch (state.mode) {
			case "fadein":
				state.boxVisibility = Math.min(state.boxVisibility + (4.0 * state.textSpeed) / Engine.frameRate, 1.0);
				if (state.boxVisibility >= 1.0) {
					state.mode = "write";
				}
				break;
			case "write":
				state.nameVisibility = Math.min(state.nameVisibility + (2.0 * state.textSpeed) / Engine.frameRate, 1.0);
				if (state.nameVisibility >= 1.0) {
					state.lineVisibility = Math.min(state.lineVisibility + (0.5 * state.textSpeed) / Engine.frameRate, 1.0);
					var lineCount = Math.min(3,state.text[state.currentPage].length - state.topLine);
					var currentLineText = state.text[state.currentPage][state.lineToReveal];
					var currentLineWidth = textBoxFont.getStringWidth(currentLineText);
					var textAreaWidth = state.textSurface.width;
					if (state.speakerName != null) {
						var speakerTextWidth = textBoxFont.getStringWidth(state.speakerText);
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
					state.mode = "fadeout";
				}
				break;
			case "fadeout":
				state.boxVisibility = Math.max(state.boxVisibility - (4.0 * state.textSpeed) / Engine.frameRate, 0.0);
				if (state.boxVisibility <= 0.0) {
					state.boxVisibility = 0.0;
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
Scenario.defineCommand("teleport", {
	start: function(sceneState, state, map, x, y) {
		ChangeMap(map + ".rmp");
		SetPersonXYFloat("*0", x, y);
	}
});
