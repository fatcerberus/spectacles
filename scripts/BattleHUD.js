/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript('MPGauge.js');
RequireScript('lib/kh2Bar.js');

// BattleHUD() constructor
// Creates an object representing the battle screen heads-up display (HUD).
// Arguments:
//     partyMaxMP: The party's current MP capacity.
function BattleHUD(partyMaxMP)
{
	this.enemyHPGaugeColor = CreateColor(255, 255, 255, 255);
	this.partyHPGaugeColor = CreateColor(0, 255, 0, 255);
	this.partyHighlightColor = CreateColor(0, 36, 72, 255);
	this.partyMPGaugeColor = CreateColor(128, 64, 128, 255);
	
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.highlightColor = CreateColor(0, 0, 0, 0);
	this.highlightedName = null;
	this.hpGaugesInfo = [];
	this.mpGauge = new MPGauge(partyMaxMP, this.partyMPGaugeColor);
	this.partyInfo = [ null, null, null ];
	this.thread = null;
	this.turnPreview = null;
	
	this.drawElementBox = function(x, y, width, height)
	{
		Rectangle(x, y, width, height, CreateColor(0, 0, 0, 192));
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 32));
	};
	
	this.drawHighlight = function(x, y, width, height, color)
	{
		var outerColor = color;
		var innerColor = BlendColors(outerColor, CreateColor(0, 0, 0, color.alpha));
		var halfHeight = Math.round(height / 2);
		GradientRectangle(x, y, width, halfHeight, outerColor, outerColor, innerColor, innerColor);
		GradientRectangle(x, y + halfHeight, width, height - halfHeight, innerColor, innerColor, outerColor, outerColor);
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 128 * color.alpha / 255));
	};
	
	this.drawPartyElement = function(x, y, memberInfo, isHighlighted)
	{
		this.drawElementBox(x, y, 100, 20, CreateColor(0, 32, 0, 192));
		if (isHighlighted) {
			this.drawHighlight(x, y, 100, 20, this.highlightColor);
		}
		this.drawHighlight(x, y, 100, 20, memberInfo.lightColor);
		var textColor = isHighlighted ?
			BlendColorsWeighted(CreateColor(255, 255, 255, 255), CreateColor(192, 192, 192, 255), this.highlightColor.alpha, 255 - this.highlightColor.alpha) :
			CreateColor(192, 192, 192, 255);
		memberInfo.hpGauge.draw(x + 5, y + 5, 24, 10);
		this.drawText(this.font, x + 34, y + 4, 1, textColor, memberInfo.name);
		Rectangle(x + 82, y + 4, 12, 12, CreateColor(64, 96, 128, 255));
		OutlinedRectangle(x + 81, y + 3, 14, 14, CreateColor(0, 0, 0, 255));
	}
	
	this.drawText = function(font, x, y, shadowDistance, color, text, alignment)
	{
		var alignments = {
			left: function(font, x, text) { return x; },
			center: function(font, x, text) { return x - font.getStringWidth(text) / 2; },
			right: function(font, x, text) { return x - font.getStringWidth(text); }
		};
		
		alignment = alignment !== void null ? alignment : 'left';
		
		if (!(alignment in alignments)) {
			Abort("BattleHUD.drawText(): Invalid text alignment '" + alignment + "'.");
		}
		x = alignments[alignment](font, x, text);
		font.setColorMask(CreateColor(0, 0, 0, color.alpha));
		font.drawText(x + shadowDistance, y + shadowDistance, text);
		font.setColorMask(color);
		font.drawText(x, y, text);
	};
}

// .dispose() method
// Frees all outstanding resources held by this object.
BattleHUD.prototype.dispose = function()
{
	Threads.kill(this.thread);
};

// .createEnemyHPGauge() method
// Creates an enemy HP gauge to be displayed on the HUD.
// Arguments:
//     name:     The name of the character that the gauge belongs to.
//     capacity: The HP capacity of the gauge.
BattleHUD.prototype.createEnemyHPGauge = function(name, capacity)
{
	var gauge = new kh2Bar(capacity, 400, this.enemyHPGaugeColor);
	this.hpGaugesInfo.push({ owner: name, gauge: gauge });
	gauge.show(0.0);
};

// .hide() method
// Hides the HUD.
BattleHUD.prototype.hide = function()
{
	new Scenario()
		.tween(this, 0.5, 'easeInExpo', { fadeness: 0.0 })
		.run();
};

// .highlight() method
// Highlights a character on the HUD.
// Arguments:
//     name: The name of the character to highlight.
BattleHUD.prototype.highlight = function(name)
{
	if (name !== null) {
		this.highlightedName = name;
		new Scenario()
			.tween(this.highlightColor, 0.1, 'easeInQuad', BlendColors(this.partyHighlightColor, CreateColor(255, 255, 255, this.partyHighlightColor.alpha)))
			.tween(this.highlightColor, 0.25, 'easeOutQuad', this.partyHighlightColor)
			.run();
	} else {
		new Scenario()
			.tween(this.highlightColor, 0.1, 'easeInQuad', CreateColor(0, 0, 0, 0))
			.run();
	}
};

// .render() method
// Renders the HUD.
BattleHUD.prototype.render = function()
{
	var y = -((this.partyInfo.length + this.hpGaugesInfo.length) * 20) * (1.0 - this.fadeness);
	var itemY = y;
	if (this.turnPreview !== null) {
		for (var i = 0; i < Math.min(this.turnPreview.length, 10); ++i) {
			var actor = this.turnPreview[i];
			var x = i * 16;
			var pictureColor = actor.isEnemy ? CreateColor(64, 0, 0, 192) : CreateColor(0, 32, 64, 192);
			Rectangle(x, itemY, 16, 16, pictureColor);
			OutlinedRectangle(x, itemY, 16, 16, CreateColor(0, 0, 0, 32));
			DrawTextEx(this.font, x + 4, itemY + 2, actor.name[0], CreateColor(192, 192, 192, 192), 1);
		}
	}
	this.drawElementBox(260, itemY, 60, 60);
	this.mpGauge.draw(261, itemY + 1, 58);
	for (var i = 0; i < this.partyInfo.length; ++i) {
		var itemX = 160;
		var itemY = y + i * 20;
		if (this.partyInfo[i] !== null) {
			this.drawPartyElement(itemX, itemY, this.partyInfo[i], this.highlightedName == this.partyInfo[i].name);
		} else {
			this.drawElementBox(itemX, itemY, 100, 20);
		}
	}
	for (var i = 0; i < this.hpGaugesInfo.length; ++i) {
		var gaugeInfo = this.hpGaugesInfo[i];
		var itemX = 160;
		var itemY = y + this.partyInfo.length * 20 + i * 20;
		this.drawElementBox(itemX, itemY, 160, 20);
		if (this.highlightedName == gaugeInfo.owner) {
			this.drawHighlight(itemX, itemY, 160, 20, this.highlightColor);
		}
		gaugeInfo.gauge.draw(itemX + 5, itemY + 5, 131, 10);
		Rectangle(itemX + 142, itemY + 4, 12, 12, CreateColor(128, 32, 32, 255));
		OutlinedRectangle(itemX + 141, itemY + 3, 14, 14, CreateColor(0, 0, 0, 255));
	}
};

// .setHP() method
// Changes the displayed HP for a character on the HUD.
// Arguments:
//     name: The name of the character whose HP is being changed.
//     hp:   The number of hit points to change the display to.
BattleHUD.prototype.setHP = function(name, hp)
{
	for (var i = 0; i < this.partyInfo.length; ++i) {
		var characterInfo = this.partyInfo[i];
		if (characterInfo !== null && characterInfo.name == name && hp != characterInfo.hp) {
			characterInfo.hpGauge.set(hp);
			var flashColor = hp > characterInfo.hp ? CreateColor(0, 192, 0, 255) : CreateColor(192, 0, 0, 255);
			new Scenario()
				.fork()
					.tween(characterInfo.lightColor, 0.25, 'easeOutQuad', flashColor)
					.tween(characterInfo.lightColor, 0.25, 'easeOutQuad', CreateColor(0, 0, 0, 0))
				.end()
				.tween(characterInfo, 0.25, 'easeInOutSine', { hp: hp })
				.run();
		}
	}
	for (var i = 0; i < this.hpGaugesInfo.length; ++i) {
		var gaugeInfo = this.hpGaugesInfo[i];
		if (gaugeInfo.owner == name) {
			gaugeInfo.gauge.set(hp);
		}
	}
};

// .setPartyMember() method
// Changes the character displayed in one of the party slots.
// Arguments:
//     slot:  The slot index (0-2 inclusive) of the party slot to be changed.
//     name:  The name of the character being switched in.
//     hp:    The amount of remaining hit points to displayed for the character.
//     maxHP: The character's maximum HP.
BattleHUD.prototype.setPartyMember = function(slot, name, hp, maxHP)
{
	if (slot < 0 || slot >= this.partyInfo.length) {
		Abort("BattleHUD.switchOut(): Invalid party slot index '" + slot + "'!");
	}
	var hpGauge = new kh2Bar(maxHP, 100, this.partyHPGaugeColor, 10);
	hpGauge.show();
	this.partyInfo[slot] = {
		name: name,
		hp: hp,
		maxHP: maxHP,
		hpGauge: hpGauge,
		lightColor: CreateColor(255, 0, 0, 0)
	};
};

// .setTurnPreview() method
// Populates the upcoming turn preview in the HUD.
// Arguments:
//     prediction: The upcoming turn prediction, as returned by Battle.predictTurns().
BattleHUD.prototype.setTurnPreview = function(prediction)
{
	this.turnPreview = [];
	for (var i = 0; i < Math.min(prediction.length, 10); ++i) {
		this.turnPreview.push(prediction[i].unit.actor);
	}
};

// .show() method
// Shows the HUD.
BattleHUD.prototype.show = function()
{
	if (this.thread === null) {
		this.thread = Threads.createEntityThread(this, 20);
	}
	new Scenario()
		.tween(this, 0.5, 'easeOutExpo', { fadeness: 1.0 })
		.run();
};

// .update() method
// Advances the BattleHUD's internal state by one frame.
BattleHUD.prototype.update = function()
{
	for (var i = 0; i < this.partyInfo.length; ++i) {
		if (this.partyInfo[i] !== null) {
			this.partyInfo[i].hpGauge.update();
		}
	}
	for (var i = 0; i < this.hpGaugesInfo.length; ++i) {
		this.hpGaugesInfo[i].gauge.update();
	}
	return true;
};
