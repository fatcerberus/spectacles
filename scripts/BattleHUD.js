/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript('MPGauge.js');
RequireScript('TurnPreview.js');

// BattleHUD() constructor
// Creates an object representing the in-battle heads-up display (HUD).
// Arguments:
//     partyMaxMP: The party's current MP capacity.
function BattleHUD(partyMaxMP)
{
	this.enemyHPGaugeColor = Color.White;
	this.partyHPGaugeColor = Color.Lime;
	this.partyHighlightColor = Color.MidnightBlue;
	this.partyMPGaugeColor = Color.DarkViolet;
	
	this.fadeness = 0.0;
	this.font = Font.Default;
	this.highlightColor = new Color(0, 0, 0, 0);
	this.highlightedUnit = null;
	this.hpGaugesInfo = [];
	this.mpGauge = new MPGauge(partyMaxMP, this.partyMPGaugeColor);
	this.partyInfo = [ null, null, null ];
	this.thread = null;
	this.turnPreview = new TurnPreview();
	
	this.drawElementBox = function(x, y, width, height)
	{
		Rectangle(x, y, width, height, Color.Black.fade(192));
		OutlinedRectangle(x, y, width, height, Color.Black.fade(32));
	};
	
	this.drawHighlight = function(x, y, width, height, color)
	{
		var outerColor = color;
		var innerColor = Color.mix(outerColor, Color.Black.fade(color.alpha));
		var halfHeight = Math.round(height / 2);
		GradientRectangle(x, y, width, halfHeight, outerColor, outerColor, innerColor, innerColor);
		GradientRectangle(x, y + halfHeight, width, height - halfHeight, innerColor, innerColor, outerColor, outerColor);
		OutlinedRectangle(x, y, width, height, Color.Black.fade(color.alpha / 2));
	};
	
	this.drawPartyElement = function(x, y, memberInfo, isHighlighted)
	{
		this.drawElementBox(x, y, 100, 20, new Color(0, 32, 0, 192));
		if (isHighlighted) {
			this.drawHighlight(x, y, 100, 20, this.highlightColor);
		}
		this.drawHighlight(x, y, 100, 20, memberInfo.lightColor);
		var headingColor = isHighlighted ?
			Color.mix(new Color(255, 192, 0, 255), new Color(192, 144, 0, 255), this.highlightColor.alpha, 255 - this.highlightColor.alpha) :
			new Color(192, 144, 0, 255);
		var textColor = isHighlighted ?
			Color.mix(new Color(255, 255, 255, 255), new Color(192, 192, 192, 255), this.highlightColor.alpha, 255 - this.highlightColor.alpha) :
			new Color(192, 192, 192, 255);
		memberInfo.hpGauge.draw(x + 5, y + 5, 24, 10);
		this.drawText(this.font, x + 34, y + 4, 1, textColor, memberInfo.unit.name);
		//this.drawText(this.font, x + 62, y + 6, 1, headingColor, "HP");
		//this.drawText(this.font, x + 61, y + 2, 1, textColor, Math.round(memberInfo.hp), 'right');
		Rectangle(x + 81, y + 3, 14, 14, new Color(64, 96, 128, 255));
		OutlinedRectangle(x + 81, y + 3, 14, 14, new Color(0, 0, 0, 255));
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
		font.setColorMask(new Color(0, 0, 0, color.alpha));
		font.drawText(x + shadowDistance, y + shadowDistance, text);
		font.setColorMask(color);
		font.drawText(x, y, text);
	};
}

// .dispose() method
// Frees all outstanding resources held by this object.
BattleHUD.prototype.dispose = function()
{
	this.turnPreview.dispose();
	threads.kill(this.thread);
};

// .createEnemyHPGauge() method
// Creates an enemy HP gauge to be displayed on the HUD.
// Arguments:
//     unit:     The battle unit that the gauge belongs to.
BattleHUD.prototype.createEnemyHPGauge = function(unit)
{
	var gauge = new kh2bar.HPGauge(unit.maxHP, Game.bossHPPerBar, this.enemyHPGaugeColor, 20);
	this.hpGaugesInfo.push({ owner: unit, gauge: gauge });
	gauge.show(0.0);
	console.log("Created HP gauge for unit '" + unit.name + "'");
	console.append("cap: " + unit.maxHP);
};

// .hide() method
// Hides the HUD.
BattleHUD.prototype.hide = function()
{
	new scenes.Scene()
		.tween(this, 0.5, 'easeInExpo', { fadeness: 0.0 })
		.run();
};

// .highlight() method
// Highlights a character on the HUD.
// Arguments:
//     unit: The unit whose entry will be highlighted.
BattleHUD.prototype.highlight = function(unit)
{
	if (unit !== null) {
		this.highlightedUnit = unit;
		new scenes.Scene()
			.tween(this.highlightColor, 0.1, 'easeInQuad', Color.mix(this.partyHighlightColor, Color.White.fade(this.partyHighlightColor.alpha)))
			.tween(this.highlightColor, 0.25, 'easeOutQuad', this.partyHighlightColor)
			.run();
	} else {
		new scenes.Scene()
			.tween(this.highlightColor, 0.1, 'easeInQuad', new Color(0, 0, 0, 0))
			.run();
	}
};

// .render() method
// Renders the HUD.
BattleHUD.prototype.render = function()
{
	var y = -((this.partyInfo.length + this.hpGaugesInfo.length) * 20) * (1.0 - this.fadeness);
	var itemY = y;
	this.drawElementBox(260, itemY, 60, 60);
	this.mpGauge.draw(261, itemY + 1, 58);
	for (var i = 0; i < this.partyInfo.length; ++i) {
		var itemX = 160;
		var itemY = y + i * 20;
		if (this.partyInfo[i] !== null) {
			this.drawPartyElement(itemX, itemY, this.partyInfo[i], this.highlightedUnit == this.partyInfo[i].unit);
		} else {
			this.drawElementBox(itemX, itemY, 100, 20);
		}
	}
	for (var i = 0; i < this.hpGaugesInfo.length; ++i) {
		var gaugeInfo = this.hpGaugesInfo[i];
		var itemX = 160;
		var itemY = y + this.partyInfo.length * 20 + i * 20;
		this.drawElementBox(itemX, itemY, 160, 20);
		if (this.highlightedUnit == gaugeInfo.owner) {
			this.drawHighlight(itemX, itemY, 160, 20, this.highlightColor);
		}
		Rectangle(itemX + 141, itemY + 3, 14, 14, new Color(128, 32, 32, 255));
		OutlinedRectangle(itemX + 141, itemY + 3, 14, 14, new Color(0, 0, 0, 255));
		gaugeInfo.gauge.draw(itemX + 5, itemY + 5, 131, 10);
	}
};

// .setHP() method
// Changes the displayed HP for a character on the HUD.
// Arguments:
//     unit: The battle unit whose HP is being changed.
//     hp:   The number of hit points to change the display to.
BattleHUD.prototype.setHP = function(unit, hp)
{
	for (var i = 0; i < this.partyInfo.length; ++i) {
		var characterInfo = this.partyInfo[i];
		if (characterInfo !== null && characterInfo.unit == unit && hp != characterInfo.hp) {
			characterInfo.hpGauge.set(hp);
			var gaugeColor =
				hp / characterInfo.maxHP <= 0.1 ? Color.Red
				: hp / characterInfo.maxHP <= 0.33 ? Color.Yellow
				: Color.Lime;
			characterInfo.hpGauge.changeColor(gaugeColor, 0.5); 
			var flashColor = hp > characterInfo.hp ? new Color(0, 192, 0, 255) : new Color(192, 0, 0, 255);
			new scenes.Scene()
				.fork()
					.tween(characterInfo.lightColor, 0.25, 'easeOutQuad', flashColor)
					.tween(characterInfo.lightColor, 0.25, 'easeOutQuad', new Color(0, 0, 0, 0))
				.end()
				.tween(characterInfo, 0.25, 'easeInOutSine', { hp: hp })
				.run();
		}
	}
	for (var i = 0; i < this.hpGaugesInfo.length; ++i) {
		var gaugeInfo = this.hpGaugesInfo[i];
		if (gaugeInfo.owner == unit) {
			gaugeInfo.gauge.set(hp);
		}
	}
};

// .setPartyMember() method
// Changes the character displayed in one of the party slots.
// Arguments:
//     slot:  The slot index (0-2 inclusive) of the party slot to be changed.
//     unit:  The battle unit being switched in.
//     hp:    The amount of remaining hit points to displayed for the character.
//     maxHP: The character's maximum HP.
BattleHUD.prototype.setPartyMember = function(slot, unit, hp, maxHP)
{
	if (slot < 0 || slot >= this.partyInfo.length) {
		Abort("BattleHUD.switchOut(): Invalid party slot index '" + slot + "'!");
	}
	var hpGauge = new kh2bar.HPGauge(maxHP, Game.partyHPPerBar, this.partyHPGaugeColor, 10);
	hpGauge.show();
	this.partyInfo[slot] = {
		unit: unit,
		hp: hp,
		maxHP: maxHP,
		hpGauge: hpGauge,
		lightColor: new Color(255, 0, 0, 0)
	};
};

// .show() method
// Shows the HUD.
BattleHUD.prototype.show = function()
{
	if (this.thread === null) {
		console.log("Activating in-battle HUD");
		this.thread = threads.create(this, 20);
	}
	new scenes.Scene()
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
