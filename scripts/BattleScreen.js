/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('BattleSprite.js');

RequireScript('Core/Threads.js');
RequireScript('lib/kh2Bar.js');
RequireScript('lib/Scenario.js');

// BattleScreen() constructor
// Creates an object representing a battle screen.
function BattleScreen()
{
	this.$drawHUD = function()
	{
		var y = -((3 + this.$lifeBars.length) * 20) * (1.0 - this.$hudFadeness);
		this.$drawHUDBox(0, y, 160, 16, 192);
		this.$drawHUDBox(260, y, 60, 60, 192);
		for (var i = 0; i < 3; ++i) {
			var itemX = 160;
			var itemY = y + i * 20;
			this.$drawHUDBox(itemX, itemY, 100, 20, 192, i == 0);
			if (i < this.$hudSprites.length) {
				var unit = this.$hudSprites[i].unit;
				this.$drawText(this.$hudFont, itemX + 5, itemY + 4, 1, CreateColor(255, 255, 255, 255), unit.name);
				this.$drawInfoText(itemX + 60, itemY + 4, 35, unit.hp, "HP");
			}
		}
		for (var i = 0; i < this.$lifeBars.length; ++i) {
			var itemX = 160;
			var itemY = y + 60 + i * 20;
			this.$drawHUDBox(itemX, itemY, 160, 20, 192);
			this.$lifeBars[i].draw(itemX + 5, itemY + 5, 150, 10);
		}
		var itemY = y + 60 + this.$lifeBars.length * 20;
	};
	
	this.$drawHUDBox = function(x, y, width, height, alpha, isLitUp)
	{
		isLitUp = (isLitUp !== void null) ? isLitUp : false;
		
		if (!isLitUp) {
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, alpha + 16));
			Rectangle(x + 1, y + 1, width - 2, height - 2, CreateColor(0, 0, 0, alpha));
		} else {
			var halfHeight = Math.round(height / 2);
			var fromColor = CreateColor(0, 72, 144, 255);
			var toColor = BlendColors(fromColor, CreateColor(0, 0, 0, 255));
			GradientRectangle(x, y, width, halfHeight, fromColor, fromColor, toColor, toColor);
			GradientRectangle(x, y + halfHeight, width, height - halfHeight, toColor, toColor, fromColor, fromColor);
			OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 255));
		}
	};
	
	this.$drawInfoText = function(x, y, width, text, title)
	{
		if (title === void null) { title = ""; }
		
		var titleWidth = this.$hudFont.getStringWidth(title);
		var textX = x + titleWidth + width - titleWidth;
		this.$drawText(this.$hudFont, x, y - 2, 1, CreateColor(255, 192, 0, 255), title);
		this.$drawText(this.$hudFont, textX, y, 1, CreateColor(192, 192, 192, 255), text, 'right');
	};
	
	this.$drawLED = function(x, y, radius, color)
	{
		var edgeColor = BlendColorsWeighted(color, CreateColor(0, 0, 0, 255), 0.75, 0.25);
		GradientCircle(x, y, radius - 1, color, edgeColor, false);
		GradientCircle(x, y, radius, CreateColor(0, 0, 0, color.alpha), false);
	}
	
	this.$drawText = function(font, x, y, shadowDistance, color, text, alignment)
	{
		var alignments = {
			left: function(font, x, text) { return x; },
			center: function(font, x, text) { return x - font.getStringWidth(text) / 2; },
			right: function(font, x, text) { return x - font.getStringWidth(text); }
		};
		
		if (alignment === void null) { alignment = 'left'; }
		
		if (!(alignment in alignments)) {
			Abort("Battle.$drawText(): Invalid text alignment '" + alignment + "'.");
		}
		x = alignments[alignment](font, x, text);
		font.setColorMask(CreateColor(0, 0, 0, color.alpha));
		font.drawText(x + shadowDistance, y + shadowDistance, text);
		font.setColorMask(color);
		font.drawText(x, y, text);
	};
	
	this.$startThread = function()
	{
		this.thread = Threads.createEntityThread(this);
	};
	
	this.$spriteTypes = {
		enemy: { isMirrored: false },
		party: { isMirrored: true }
	};
	this.$sprites = {};
	for (var type in this.$spriteTypes) {
		this.$sprites[type] = [];
	}
	this.$lifeBars = [];
	this.$turnQueue = [];
	this.$hudSprites = this.$sprites.party;
	this.$hudFont = GetSystemFont();
	this.$hudFadeness = 0.0;
	
	// .dispose() method
	// Frees all outstanding resources associated with the BattleScreen.
	this.dispose = function()
	{
		Threads.kill(this.thread);
	};
	
	// .announceAction() method
	// Momentarily displays the name of an action being performed.
	// Arguments:
	//     action:      The action being performed.
	//     alignment:   The alignment of the unit performing the action. Can be one of the following:
	//                      'party': A member of the player's party.
	//                      'enemy': An enemy battler.
	//     bannerColor: The background color to use for the announcement banner.
	this.announceAction = function(actionName, alignment, bannerColor)
	{
		var bannerColor = alignment == 'enemy' ? CreateColor(128, 32, 32, 192) : CreateColor(64, 64, 192, 192);
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
				Rectangle(x + 1, y + 1, width - 2, height - 2, this.color);
				OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 255));
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
	
	// .createLifeBar() method
	// Creates an enemy life bar to be displayed on this BattleScreen.
	// Arguments:
	//     name:     The name of the battler the life bar belongs to.
	//     capacity: The HP capacity of the new life bar.
	// Returns:
	//     A reference to a kh2Bar object that represents the new life bar.
	this.createLifeBar = function(name, capacity)
	{
		var lifeBar = new kh2Bar(capacity, 400, CreateColor(255, 255, 255, 255));
		this.$lifeBars.push(lifeBar);
		return lifeBar;
	};
	
	// .createSprite() method
	// Creates a battler sprite to be displayed on this BattleScreen.
	// Arguments:
	//     unit: The BattleUnit represented by the new sprite.
	// Returns:
	//     A reference to a BattleSprite object representing the new sprite.
	this.createSprite = function(unit, position, row, alignment, alreadyThere)
	{
		if (!(alignment in this.$spriteTypes)) {
			Abort("BattleScreen.createSprite(): Invalid battler alignment '" + alignment + "'");
		}
		var isMirrored = this.$spriteTypes[alignment].isMirrored;
		var sprite = new BattleSprite(unit, position, row, isMirrored, alreadyThere);
		this.$sprites[alignment].push(sprite);
		return sprite;
	};
	
	// .go() method
	// Transitions into the BattleScreen.
	// Arguments:
	//     title: Optional. A title to display during the battle transiton.
	this.go = function(title)
	{
		if (title === void null) { title = null; }
		
		this.$title = title;
		if (DBG_DISABLE_TRANSITIONS) {
			this.$startThread();
			return;
		}
		new Scenario()
			.fadeTo(CreateColor(255, 255, 255, 255), 0.25)
			.fadeTo(CreateColor(0, 0, 0, 0), 0.5)
			.fadeTo(CreateColor(255, 255, 255, 255), 0.25)
			.call(delegate(this, '$startThread'))
			.fadeTo(CreateColor(0, 0, 0, 0), 1.0)
			.run();
	};
	
	// .render() method
	// Renders the BattleScreen.
	this.render = function()
	{
		Rectangle(0, 0, 320, 112, CreateColor(0, 128, 0, 255));
		Rectangle(0, 112, 320, 16, CreateColor(64, 64, 64, 255));
		Rectangle(0, 128, 320, 112, CreateColor(192, 128, 0, 255));
		for (var type in this.$spriteTypes) {
			for (var i = 0; i < this.$sprites[type].length; ++i) {
				this.$sprites[type][i].render();
			}
		}
		this.$drawHUD();
	};
	
	// .showTitle() method
	// Displays the title of the battle, if one is defined.
	this.showTitle = function()
	{
		if (this.$title === null) {
			return;
		}
		new Scenario()
			.beginFork()
				.tween(this, 0.5, 'easeOutBack', { $hudFadeness: 1.0 })
			.endFork()
			.marquee("Boss Battle: " + this.$title, CreateColor(0, 0, 0, 128))
			.run();
	};
	
	// .update() method
	// Advances the BattleScreen's internal state by one frame.
	// Returns:
	//     true if the BattleScreen is still active; false otherwise.
	this.update = function()
	{
		for (var type in this.$spriteTypes) {
			for (var i = 0; i < this.$sprites[type].length; ++i) {
				this.$sprites[type][i].update();
			}
		}
		for (var i = 0; i < this.$lifeBars.length; ++i) {
			this.$lifeBars[i].update();
		}
		return true;
	};
};
