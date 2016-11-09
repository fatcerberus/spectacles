/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('Battle.js');

scenes.defScenelet('adjustBGM',
{
	start: function(scene, volume, duration) {
		duration = duration !== undefined ? duration : 0.0;
		
		music.adjust(volume, duration);
	},
	update: function(scene) {
		return music.isAdjusting();
	}
});

// .battle() command
// Starts a battle.
// Arguments:
//     battleID: The ID of the battle definition to use to initialize the fight.
scenes.defScenelet('battle',
{
	start: function(scene, battleID, session) {
		this.mode = 'battle';
		this.battle = new Battle(session, battleID);
		this.battleThread = this.battle.go();
	},
	update: function(scene) {
		switch (this.mode) {
			case 'battle':
				if (!threads.isRunning(this.battleThread)) {
					if (this.battle.result == BattleResult.Lose) {
						term.print("Player lost battle, showing Game Over screen");
						this.mode = 'gameOver';
						this.gameOver = new GameOverScreen();
						this.gameOverThread = this.gameOver.show();
					} else {
						return false;
					}
				}
				break;
			case 'gameOver':
				if (!threads.isRunning(this.gameOverThread)) {
					if (this.gameOver.action === GameOverAction.retry) {
						term.print("Player asked to retry last battle");
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

scenes.defScenelet('changeMap',
{
	start: function(scene, map) {
		ChangeMap(map);
	}
});

scenes.defScenelet('changeBGM',
{
	start: function(scene, trackName, fadeTime) {
		music.play("music/" + trackName + ".ogg", fadeTime);
	}
});

scenes.defScenelet('facePerson',
{
	start: function(scene, person, direction) {
		var faceCommand;
		switch (direction.toLowerCase()) {
			case "n": case "north":
				faceCommand = COMMAND_FACE_NORTH;
				break;
			case "ne": case "northeast":
				faceCommand = COMMAND_FACE_NORTHEAST;
				break;
			case "e": case "east":
				faceCommand = COMMAND_FACE_EAST;
				break;
			case "se": case "southeast":
				faceCommand = COMMAND_FACE_SOUTHEAST;
				break;
			case "s": case "south":
				faceCommand = COMMAND_FACE_SOUTH;
				break;
			case "sw": case "southwest":
				faceCommand = COMMAND_FACE_SOUTHWEST;
				break;
			case "w": case "west":
				faceCommand = COMMAND_FACE_WEST;
				break;
			case "nw": case "northwest":
				faceCommand = COMMAND_FACE_NORTHWEST;
				break;
			default:
				faceCommand = COMMAND_WAIT;
		}
		QueuePersonCommand(person, faceCommand, false);
	}
});

scenes.defScenelet('focusOnPerson',
{
	start: function(scene, person, duration) {
		duration = duration !== undefined ? duration : 0.25;
		
		this.pan = new scenes.Scene()
			.panTo(GetPersonX(person), GetPersonY(person), duration)
			.run();
	},
	update: function(scene) {
		return this.pan.isRunning();
	}
});

scenes.defScenelet('followPerson',
{
	start: function(scene, person) {
		this.person = person;
		this.pan = new scenes.Scene()
			.focusOnPerson(person)
			.run();
	},
	update: function(scene) {
		return this.pan.isRunning();
	},
	finish: function(scene) {
		AttachCamera(this.person);
	}
});

scenes.defScenelet('hidePerson',
{
	start: function(scene, person) {
		SetPersonVisible(person, false);
		IgnorePersonObstructions(person, true);
	}
});

scenes.defScenelet('killPerson',
{
	start: function(scene, person) {
		DestroyPerson(person);
	}
});

scenes.defScenelet('marquee',
{
	start: function(scene, text, backgroundColor, color) {
		backgroundColor = backgroundColor || Color.Black;
		color = color || Color.White;

		this.text = text;
		this.color = color;
		this.background = backgroundColor;
		this.font = Font.Default;
		this.windowSize = screen.width + this.font.getTextSize(this.text).width;
		this.height = this.font.height + 10;
		this.textHeight = this.font.height;
		this.fadeness = 0.0;
		this.scroll = 0.0;
		this.animation = new scenes.Scene()
			.tween(this, 0.25, 'linear', { fadeness: 1.0 })
			.tween(this, 1.0, 'easeOutExpo', { scroll: 0.5 })
			.tween(this, 1.0, 'easeInExpo', { scroll: 1.0 })
			.tween(this, 0.25, 'linear', { fadeness: 0.0 })
			.run();
	},
	render: function(scene) {
		var boxHeight = this.height * this.fadeness;
		var boxY = screen.height / 2 - boxHeight / 2;
		var textX = screen.width - this.scroll * this.windowSize;
		var textY = boxY + boxHeight / 2 - this.textHeight / 2;
		prim.rect(screen, 0, boxY, screen.width, boxHeight, this.background);
		this.font.drawText(screen, textX + 1, textY + 1, this.text, Color.Black.fade(this.color.a));
		this.font.drawText(screen, textX, textY, this.text, this.color);
	},
	update: function(scene) {
		return this.animation.isRunning();
	}
});

scenes.defScenelet('maskPerson',
{
	start: function(scene, name, newMask, duration) {
		duration = duration !== undefined ? duration : 0.25;
		
		this.name = name;
		this.mask = GetPersonMask(this.name);
		this.fade = new scenes.Scene()
			.tween(this.mask, duration, 'easeInOutSine', newMask)
			.run();
	},
	update: function(scene) {
		SetPersonMask(this.name, this.mask);
		return this.fade.isRunning();
	}
});

scenes.defScenelet('movePerson',
{
	start: function(scene, person, direction, distance, speed, faceFirst) {
		faceFirst = faceFirst !== undefined ? faceFirst : true;
		
		if (!isNaN(speed)) {
			speedVector = [ speed, speed ];
		} else {
			speedVector = speed;
		}
		this.person = person;
		this.oldSpeedVector = [ GetPersonSpeedX(person), GetPersonSpeedY(person) ];
		if (speedVector != null) {
			SetPersonSpeedXY(this.person, speedVector[0], speedVector[1]);
		} else {
			speedVector = this.oldSpeedVector;
		}
		var xMovement;
		var yMovement;
		var faceCommand;
		var stepCount;
		switch (direction) {
			case "n": case "north":
				faceCommand = COMMAND_FACE_NORTH;
				xMovement = COMMAND_WAIT;
				yMovement = COMMAND_MOVE_NORTH;
				stepCount = distance / speedVector[1];
				break;
			case "e": case "east":
				faceCommand = COMMAND_FACE_EAST;
				xMovement = COMMAND_MOVE_EAST;
				yMovement = COMMAND_WAIT;
				stepCount = distance / speedVector[0];
				break;
			case "s": case "south":
				faceCommand = COMMAND_FACE_SOUTH;
				xMovement = COMMAND_WAIT;
				yMovement = COMMAND_MOVE_SOUTH;
				stepCount = distance / speedVector[1];
				break;
			case "w": case "west":
				faceCommand = COMMAND_FACE_WEST;
				xMovement = COMMAND_MOVE_WEST;
				yMovement = COMMAND_WAIT;
				stepCount = distance / speedVector[0];
				break;
			default:
				faceCommand = COMMAND_WAIT;
				xMovement = COMMAND_WAIT;
				yMovement = COMMAND_WAIT;
				stepCount = 0;
		}
		if (faceFirst) {
			QueuePersonCommand(this.person, faceCommand, true);
		}
		for (iStep = 0; iStep < stepCount; ++iStep) {
			QueuePersonCommand(this.person, xMovement, true);
			QueuePersonCommand(this.person, yMovement, true);
			QueuePersonCommand(this.person, COMMAND_WAIT, false);
		}
		return true;
	},
	update: function(scene) {
		return !IsCommandQueueEmpty(this.person);
	},
	finish: function(scene) {
		SetPersonSpeedXY(this.person, this.oldSpeedVector[0], this.oldSpeedVector[1]);
	}
});

scenes.defScenelet('panTo',
{
	start: function(scene, x, y, duration) {
		duration = duration !== undefined ? duration : 0.25;
		
		DetachCamera();
		var targetXY = {
			cameraX: x,
			cameraY: y
		};
		this.cameraX = GetCameraX();
		this.cameraY = GetCameraY();
		this.pan = new scenes.Scene()
			.tween(this, duration, 'easeOutQuad', targetXY)
			.run();
	},
	update: function(scene) {
		SetCameraX(this.cameraX);
		SetCameraY(this.cameraY);
		return this.pan.isRunning();
	}
});

scenes.defScenelet('popBGM',
{
	start: function(scene) {
		music.pop();
	}
});

scenes.defScenelet('pushBGM',
{
	start: function(scene, trackName) {
		music.push("music/" + trackName + ".ogg");
	}
});

scenes.defScenelet('setSprite',
{
	start: function(scene, name, spriteFile) {
		var spriteset = LoadSpriteset(spriteFile);
		SetPersonSpriteset(name, spriteset);
	}
});

scenes.defScenelet('showPerson',
{
	start: function(scene, person) {
		SetPersonVisible(person, true);
		IgnorePersonObstructions(person, false);
	}
});

scenes.defScenelet('talk',
{
	start: function(scene, speaker, showSpeaker, textSpeed, timeout /*...pages*/) {
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
		this.transition = new scenes.Scene()
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
	update: function(scene) {
		switch (this.mode) {
			case "idle":
				if (this.timeout !== Infinity) {
					if (this.topLine + 3 >= this.text[this.currentPage].length) {
						this.timeoutLeft -= 1.0 / screen.frameRate;
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
				if (!this.transition.isRunning()) {
					this.mode = "write";
				}
				break;
			case "write":
				this.nameVisibility = Math.min(this.nameVisibility + 4.0 / screen.frameRate, 1.0);
				if (this.nameVisibility >= 1.0) {
					this.lineVisibility = Math.min(this.lineVisibility + this.textSpeed / screen.frameRate, 1.0);
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
				this.scrollOffset = Math.min(this.scrollOffset + 8.0 * this.textSpeed / screen.frameRate, 1.0);
				if (this.scrollOffset >= 1.0) {
					this.topLine += 1;
					this.scrollOffset = 0.0;
					this.lineVisibility = 0.0;
					this.textVisibility = 1.0;
					this.mode = "write";
				}
				break;
			case "page":
				this.textVisibility = Math.max(this.textVisibility - (2.0 * this.textSpeed) / screen.frameRate, 0.0);
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
				this.textVisibility = Math.max(this.textVisibility - (4.0 * this.textSpeed) / screen.frameRate, 0.0);
				if (this.textVisibility <= 0.0) {
					this.transition = new scenes.Scene()
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
		if (this.mode != "idle")
			return;
		if ((Keyboard.Default.isPressed(Key.Z) || joy.P1.isPressed(0))
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
