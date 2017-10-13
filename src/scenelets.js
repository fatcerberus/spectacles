/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript('battleEngine/battle.js');

Scene.defineOp('adjustBGM',
{
	start(scene, volume, duration = 0.0) {
		Music.adjustVolume(volume, duration);
	},

	update(scene) {
		return Music.adjustingVolume;
	}
});

// .battle() command
// Starts a battle.
// Arguments:
//     battleID: The ID of the battle definition to use to initialize the fight.
Scene.defineOp('battle',
{
	start(scene, battleID, session) {
		this.mode = 'battle';
		this.battle = new Battle(session, battleID);
		this.battleThread = this.battle.go();
	},

	update(scene) {
		switch (this.mode) {
			case 'battle':
				if (!this.battleThread.running) {
					if (this.battle.result == BattleResult.Lose) {
						console.log("player lost battle, showing Game Over screen");
						this.mode = 'gameOver';
						this.gameOver = new GameOverScreen();
						this.gameOverThread = this.gameOver.show();
					} else {
						return false;
					}
				}
				break;
			case 'gameOver':
				if (!this.gameOverThread.running) {
					if (this.gameOver.action === GameOverAction.Retry) {
						console.log("player asked to retry last battle");
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

Scene.defineOp('changeBGM',
{
	start(scene, trackName, fadeTime) {
		Music.play(trackName, fadeTime);
	}
});

Scene.defineOp('marquee',
{
	start(scene, text, backgroundColor = Color.Black, color = Color.White) {
		this.text = text;
		this.color = color;
		this.background = backgroundColor;
		this.font = Font.Default;
		this.windowSize = screen.width + this.font.getTextSize(this.text).width;
		this.height = this.font.height + 10;
		this.textHeight = this.font.height;
		this.fadeness = 0.0;
		this.scroll = 0.0;
		this.animation = new Scene()
			.tween(this, 15, 'linear', { fadeness: 1.0 })
			.tween(this, 60, 'easeOutExpo', { scroll: 0.5 })
			.tween(this, 60, 'easeInExpo', { scroll: 1.0 })
			.tween(this, 15, 'linear', { fadeness: 0.0 });
		this.animation.run();
	},

	render(scene) {
		var boxHeight = this.height * this.fadeness;
		var boxY = screen.height / 2 - boxHeight / 2;
		var textX = screen.width - this.scroll * this.windowSize;
		var textY = boxY + boxHeight / 2 - this.textHeight / 2;
		Prim.drawSolidRectangle(screen, 0, boxY, screen.width, boxHeight, this.background);
		this.font.drawText(screen, textX + 1, textY + 1, this.text, Color.Black.fadeTo(this.color.a));
		this.font.drawText(screen, textX, textY, this.text, this.color);
	},

	update(scene) {
		return this.animation.running;
	}
});

Scene.defineOp('popBGM',
{
	start(scene) {
		Music.pop();
	}
});

Scene.defineOp('pushBGM',
{
	start(scene, trackName) {
		Music.push(trackName);
	}
});

Scene.defineOp('talk',
{
	start(scene, speaker, showSpeaker, textSpeed, timeout /*...pages*/) {
		this.speakerName = speaker;
		this.speakerText = this.speakerName != null ? this.speakerName + ":" : null;
		this.showSpeaker = showSpeaker;
		this.textSpeed = textSpeed;
		this.timeout = timeout;
		this.timeoutLeft = this.timeout;
		this.font = GetSystemFont();
		this.text = [];
		var speakerTextWidth = this.font.getStringWidth(this.speakerText);
		var textAreaWidth = GetScreenWidth() - 16;
		for (i = 5; i < arguments.length; ++i) {
			var lineWidth = this.speakerName != null ? textAreaWidth - (speakerTextWidth + 5) : textAreaWidth;
			var wrappedText = this.font.wordWrapString(arguments[i], lineWidth);
			var page = this.text.push([]) - 1;
			for (let iLine = 0; iLine < wrappedText.length; ++iLine) {
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
		this.transition = new Scene()
			.tween(this, 20, 'easeOutBack', { boxVisibility: 1.0 });
		this.transition.run();
		this.mode = "fadein";
		while (AreKeysLeft()) {
			GetKey();
		}
		if (Sphere.Game.disableTalking) {
			this.mode = "finish";
		}
		return true;
	},

	render(scene) {
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
		for (let iLine = Math.min(this.lineToReveal - this.topLine + 1, lineCount - this.topLine, 3) - 1; iLine >= 0; --iLine) {
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
					this.textSurface.gradientRectangle((textX - lineHeight * 2) + shownArea, textY, lineHeight * 2, lineHeight + 1, CreateColor(0, 0, 0, 0), CreateColor(0, 0, 0, 255), CreateColor(0, 0, 0, 255 * this.boxVisibility), CreateColor(0, 0, 0, 0));
					this.textSurface.setBlendMode(REPLACE);
					this.textSurface.rectangle(textX + shownArea, textY, textAreaWidth - shownArea, lineHeight + 1, CreateColor(0, 0, 0, 0));
					this.textSurface.setBlendMode(BLEND);
				}
			}
			if (this.showSpeaker && this.speakerName != null && trueLine == 0) {
				this.font.setColorMask(CreateColor(0, 0, 0, this.textVisibility * this.nameVisibility * 255));
				this.textSurface.drawText(this.font, 1, textY + 1, this.speakerText);
				this.font.setColorMask(CreateColor(255, 192, 0, this.textVisibility * this.nameVisibility * 255));
				this.textSurface.drawText(this.font, 0, textY, this.speakerText);
			}
		}
		this.textSurface.blit(GetScreenWidth() / 2 - this.textSurface.width / 2, boxY + 5);
	},

	update(scene) {
		if (Sphere.Game.disableTalking) {
			this.mode = "finish";
		}
		switch (this.mode) {
			case "idle":
				if (this.timeout !== Infinity) {
					if (this.topLine + 3 >= this.text[this.currentPage].length) {
						this.timeoutLeft -= 1.0 / Sphere.frameRate;
						if (this.timeoutLeft <= 0.0) {
							if (this.currentPage < this.text.length - 1) {
								this.mode = "page";
							} else {
								this.mode = "hidetext";
							}
							this.timeoutLeft = this.timeout;
						}
					} else {
						this.mode = "nextline";
						this.numLinesToDraw = 0;
						this.lineVisibility = 0.0;
					}
				}
				break;
			case "fadein":
				if (!this.transition.running) {
					this.mode = "write";
				}
				break;
			case "write":
				this.nameVisibility = Math.min(this.nameVisibility + 4.0 / Sphere.frameRate, 1.0);
				if (this.nameVisibility >= 1.0) {
					this.lineVisibility = Math.min(this.lineVisibility + this.textSpeed / Sphere.frameRate, 1.0);
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
				this.scrollOffset = Math.min(this.scrollOffset + 8.0 * this.textSpeed / Sphere.frameRate, 1.0);
				if (this.scrollOffset >= 1.0) {
					this.topLine += 1;
					this.scrollOffset = 0.0;
					this.lineVisibility = 0.0;
					this.textVisibility = 1.0;
					this.mode = "write";
				}
				break;
			case "page":
				this.textVisibility = Math.max(this.textVisibility - (2.0 * this.textSpeed) / Sphere.frameRate, 0.0);
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
				this.textVisibility = Math.max(this.textVisibility - (4.0 * this.textSpeed) / Sphere.frameRate, 0.0);
				if (this.textVisibility <= 0.0) {
				    this.transition = new Scene()
						.tween(this, 20, 'easeInBack', { boxVisibility: 0.0 });
					this.transition.run();
					this.mode = "fadeout";
				}
				break;
			case "fadeout":
				if (!this.transition.running) {
					this.mode = "finish";
				}
				break;
			case "finish":
				return false;
		}
		return true;
	},

	getInput(scene) {
		if (this.mode != "idle")
			return;
		if ((Keyboard.Default.isPressed(Key.Z) || Joypad.P1.isPressed(0))
			&& this.timeout == Infinity)
		{
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
