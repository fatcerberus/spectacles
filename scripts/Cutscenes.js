/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('Battle.js');

Scenario.defineCommand('adjustBGM',
{
	start: function(scene, volume, duration) {
		duration = duration !== void null ? duration : 0.0;
		
		BGM.adjustVolume(volume, duration);
	},
	update: function(scene) {
		return BGM.isAdjusting();
	}
});

// .battle() command
// Starts a battle.
// Arguments:
//     battleID: The ID of the battle definition to use to initialize the fight.
Scenario.defineCommand('battle',
{
	start: function(scene, battleID) {
		this.mode = 'battle';
		this.battle = new Battle(analogue.world.currentSession, battleID);
		this.battleThread = this.battle.go();
	},
	update: function(scene) {
		switch (this.mode) {
			case 'battle':
				if (!Threads.isRunning(this.battleThread)) {
					if (this.battle.result == BattleResult.enemyWon) {
						Console.writeLine("Player lost battle, showing Game Over screen");
						this.mode = 'gameOver';
						this.gameOver = new GameOverScreen();
						this.gameOverThread = this.gameOver.show();
					} else {
						return false;
					}
				}
				break;
			case 'gameOver':
				if (!Threads.isRunning(this.gameOverThread)) {
					if (this.gameOver.action === GameOverAction.retry) {
						Console.writeLine("Player asked to retry last battle");
						this.mode = 'battle';
						this.battleThread = this.battle.go();
					} else {
						return false;
					}
				}
				break;
		}
		return true;
	}
});

Scenario.defineCommand('changeMap',
{
	start: function(scene, map) {
		ChangeMap(map);
	}
});

Scenario.defineCommand('playBGM',
{
	start: function(scene, trackName) {
		BGM.override(trackName);
	}
});

Scenario.defineCommand('resetBGM',
{
	start: function(scene) {
		BGM.reset();
	}
});

Scenario.defineCommand('talk',
{
	start: function(scene, speaker, showSpeaker, textSpeed, timeout /*...pages*/) {
		this.speakerName = speaker;
		this.speakerText = this.speakerName != null ? this.speakerName + ":" : null;
		this.showSpeaker = showSpeaker;
		this.textSpeed = textSpeed;
		this.timeout = timeout;
		this.font = GetSystemFont();
		this.text = [];
		var speakerTextWidth = this.font.getStringWidth(this.speakerText);
		var textAreaWidth = GetScreenWidth() - 16;
		for (i = 5; i < arguments.length; ++i) {
			var lineWidth = this.speakerName != null ? textAreaWidth - (speakerTextWidth + 5) : textAreaWidth;
			var wrappedText = this.font.wordWrapString(arguments[i], lineWidth);
			var page = this.text.push([]) - 1;
			for (var iLine = 0; iLine < wrappedText.length; ++iLine) {
				this.text[page].push(wrappedText[iLine]);
			}
		}
		this.boxVisibility = 0.0;
		this.textVisibility = 1.0;
		this.nameVisibility = 0.0;
		this.lineVisibility = 0.0;
		this.scrollOffset = 0.0;
		this.currentPage = 0;
		this.numLinesToDraw = 0;
		this.topLine = 0;
		this.lineToReveal = 0;
		this.textSurface = CreateSurface(textAreaWidth, this.font.getHeight() * 3 + 1, CreateColor(0, 0, 0, 0));
		this.transition = new Scenario()
			.tween(this, 0.375, 'easeOutBack', { boxVisibility: 1.0 })
			.run();
		this.mode = "fadein";
		while (AreKeysLeft()) {
			GetKey();
		}
		if (DBG_DISABLE_TEXTBOXES) {
			this.mode = "finish";
		}
		return true;
	},
	render: function(scene) {
		var lineHeight = this.font.getHeight();
		var boxHeight = lineHeight * 3 + 11;
		var finalBoxY = GetScreenHeight() * 0.85 - boxHeight / 2;
		var boxY = finalBoxY + (GetScreenHeight() - finalBoxY) * (1.0 - this.boxVisibility);
		OutlinedRectangle(-1, boxY - 1, GetScreenWidth() + 2, boxHeight + 2, CreateColor(0, 0, 0, 144 * this.boxVisibility));
		Rectangle(0, boxY, GetScreenWidth(), boxHeight, CreateColor(0, 0, 0, 128 * this.boxVisibility));
		this.textSurface.setBlendMode(REPLACE);
		this.textSurface.rectangle(0, 0, this.textSurface.width, this.textSurface.height, CreateColor(0, 0, 0, 0));
		this.textSurface.setBlendMode(BLEND);
		var lineCount = this.text[this.currentPage].length;
		var textAreaWidth = this.textSurface.width;
		var textX = 0;
		if (this.speakerName != null) {
			var speakerTextWidth = this.font.getStringWidth(this.speakerText);
			textX = speakerTextWidth + 5;
		}
		textAreaWidth -= textX;
		for (var iLine = Math.min(this.lineToReveal - this.topLine + 1, lineCount - this.topLine, 3) - 1; iLine >= 0; --iLine) {
			var trueLine = this.topLine + iLine;
			var textY = iLine * lineHeight - this.scrollOffset * lineHeight;
			var lineVisibility = iLine == 0 ? 1.0 - this.scrollOffset : 1.0;
			if (this.lineVisibility > 0.0 || this.lineToReveal != trueLine) {
				var lineText = this.text[this.currentPage][trueLine];
				this.font.setColorMask(CreateColor(0, 0, 0, 255 * this.textVisibility * lineVisibility));
				this.textSurface.drawText(this.font, textX + 1, textY + 1, lineText);
				this.font.setColorMask(CreateColor(255, 255, 255, 255 * this.textVisibility * lineVisibility));
				this.textSurface.drawText(this.font, textX, textY, lineText);
				if (this.lineToReveal == trueLine) {
					var shownArea = textAreaWidth * this.lineVisibility;
					this.textSurface.setBlendMode(SUBTRACT);
					this.textSurface.gradientRectangle((textX - lineHeight) + shownArea, textY, lineHeight, lineHeight + 1, CreateColor(0, 0, 0, 0), CreateColor(0, 0, 0, 255), CreateColor(0, 0, 0, 255 * this.boxVisibility), CreateColor(0, 0, 0, 0));
					this.textSurface.setBlendMode(REPLACE);
					this.textSurface.rectangle(textX + shownArea, textY, textAreaWidth - shownArea, lineHeight + 1, CreateColor(0, 0, 0, 0));
					this.textSurface.setBlendMode(BLEND);
				}
			}
			if (this.showSpeaker && this.speakerName != null && this.currentPage == 0 && trueLine == 0) {
				this.font.setColorMask(CreateColor(0, 0, 0, this.textVisibility * this.nameVisibility * 255));
				this.textSurface.drawText(this.font, 1, textY + 1, this.speakerText);
				this.font.setColorMask(CreateColor(255, 192, 0, this.textVisibility * this.nameVisibility * 255));
				this.textSurface.drawText(this.font, 0, textY, this.speakerText);
			}
		}
		this.textSurface.blit(GetScreenWidth() / 2 - this.textSurface.width / 2, boxY + 5);
	},
	update: function(scene) {
		switch (this.mode) {
			case "idle":
				if (this.currentPage >= this.text.length - 1) {
					this.timeout -= 1.0 / Engine.frameRate;
					this.mode = this.timeout > 0.0 ? this.mode : "hidetext";
				}
				break;
			case "fadein":
				if (!this.transition.isRunning()) {
					this.mode = "write";
				}
				break;
			case "write":
				this.nameVisibility = Math.min(this.nameVisibility + 4.0 / Engine.frameRate, 1.0);
				if (this.nameVisibility >= 1.0) {
					this.lineVisibility = Math.min(this.lineVisibility + (0.5 * this.textSpeed) / Engine.frameRate, 1.0);
					var lineCount = Math.min(3, this.text[this.currentPage].length - this.topLine);
					var currentLineText = this.text[this.currentPage][this.lineToReveal];
					var currentLineWidth = this.font.getStringWidth(currentLineText);
					var textAreaWidth = this.textSurface.width;
					if (this.speakerName != null) {
						var speakerTextWidth = this.font.getStringWidth(this.speakerText);
						textAreaWidth -= speakerTextWidth + 5;
					}
					if (this.lineVisibility >= 1.0 || textAreaWidth * this.lineVisibility >= currentLineWidth + 20) {
						if (this.lineToReveal - this.topLine == lineCount - 1) this.mode = "idle";
						++this.lineToReveal;
						++this.numLinesToDraw;
						if (this.numLinesToDraw < 3 && this.lineToReveal < this.text[this.currentPage].length) {
							this.mode = "nextline";
						} else {
							this.mode = "idle";
						}
						this.lineVisibility = 0.0;
					}
				}
				break;
			case "nextline":
				if (this.lineToReveal < 3) {
					this.lineVisibility = 0.0;
					this.mode = "write";
					break;
				}
				this.scrollOffset = Math.min(this.scrollOffset + (8.0 * this.textSpeed) / Engine.frameRate, 1.0);
				if (this.scrollOffset >= 1.0) {
					this.topLine += 1;
					this.scrollOffset = 0.0;
					this.lineVisibility = 0.0;
					this.textVisibility = 1.0;
					this.mode = "write";
				}
				break;
			case "page":
				this.textVisibility = Math.max(this.textVisibility - (2.0 * this.textSpeed) / Engine.frameRate, 0.0);
				if (this.textVisibility <= 0.0) {
					this.mode = "write";
					++this.currentPage;
					this.lineToReveal = 0;
					this.numLinesToDraw = 0;
					this.textVisibility = 1.0;
					this.topLine = 0;
					this.lineVisibility = 0.0;
				}
				break;
			case "hidetext":
				this.textVisibility = Math.max(this.textVisibility - (4.0 * this.textSpeed) / Engine.frameRate, 0.0);
				if (this.textVisibility <= 0.0) {
					this.transition = new Scenario()
						.tween(this, 0.375, 'easeInBack', { boxVisibility: 0.0 })
						.run();
					this.mode = "fadeout";
				}
				break;
			case "fadeout":
				if (!this.transition.isRunning()) {
					this.mode = "finish";
				}
				break;
			case "finish":
				return false;
		}
		return true;
	},
	getInput: function(scene) {
		if (this.mode != "idle") return;
		var key = AreKeysLeft() ? GetKey() : null;
		if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_A) && this.timeout == Infinity) {
			if (this.topLine + 3 >= this.text[this.currentPage].length) {
				if (this.currentPage < this.text.length - 1) {
					this.mode = "page";
				} else {
					this.mode = "hidetext";
				}
			} else {
				this.mode = "nextline";
				this.numLinesToDraw = 0;
				this.lineVisibility = 0.0;
			}
		}
	}
});
