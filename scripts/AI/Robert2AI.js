/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function Robert2AI(battle, unit, context)
{
	this.battle = battle;
	this.unit = unit;
	this.context = context;
}

// .strategize() method
// Decides the enemy's next move(s).
Robert2AI.prototype.strategize = function()
{				
	if ('maggie' in this.context.enemies && this.context.turnsTaken == 0) {
		var me = this.unit;
		new Scenario()
			.talk("Robert", true, 2.0, "Wait, hold on... what in Hades' name is SHE doing here?")
			.talk("maggie", true, 2.0, "The same thing I'm always doing, having stuff for dinner. Like you!")
			.call(function() { me.takeDamage(me.maxHP - 1); })
			.playSound('Munch.wav')
			.talk("Robert", true, 2.0, "HA! You missed! ...hold on, where'd my leg go? ...and my arm, and my other leg...")
			.talk("maggie", true, 2.0,
				"Tastes like chicken!",
				"Hey, speaking of which, Robert, did you see any chickens around here? I could really go for some fried chicken right about now! Or even the regular, uncooked, feathery kind...")
			.talk("Robert", true, 2.0, "...")
			.run(true);
		this.context.useItem('alcohol');
	}
	if (this.context.turnsTaken == 0) {
		this.phase = 0;
		this.context.useSkill('omni');
		this.context.useSkill('necromancy');
	} else {
		var phaseToEnter =
			this.unit.getHealth() > 75 ? 1 :
			this.unit.getHealth() > 40 ? 2 :
			this.unit.getHealth() > 10 ? 3 :
			4;
		var lastPhase = this.phase;
		this.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter
		switch (this.phase) {
			case 1:
				if (this.phase > lastPhase) {
					this.isComboStarted = false;
				}
				var forecast = this.context.turnForecast('chargeSlash');
				if (forecast[0].unit === me) {
					this.context.useSkill('chargeSlash');
				} else {
					forecast = this.context.turnForecast('quickstrike');
					if (forecast[0].unit === me) {
						this.context.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.context.useSkill('swordSlash');
							this.isComboStarted = false;
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
							this.context.useSkill(moves[Math.min(Math.floor(Math.random() * 4), 3)]);
						}
					}
				}
				break;
			case 2:
				if (this.phase > lastPhase) {
					this.context.useSkill('upheaval');
					this.isComboStarted = false;
				} else {
					var forecast = this.context.turnForecast('quickstrike');
					if ((Math.random() < 0.5 || this.isComboStarted) && forecast[0].unit === me) {
						this.context.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.context.useSkill('swordSlash');
							this.isComboStarted = false;
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
							this.context.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
						}
					}
				}
				break;
			case 3:
				if (this.phase > lastPhase) {
					this.context.useSkill('protectiveAura');
					this.context.useSkill('crackdown');
					this.doChargeSlashNext = false;
					this.isComboStarted = false;
				} else {
					var chanceOfCombo = 0.25 + this.hasStatus('crackdown') * 0.25;
					if (Math.random() < chanceOfCombo || this.isComboStarted) {
						var forecast = this.context.turnForecast('chargeSlash');
						if ((forecast[0] === me && !this.isComboStarted) || this.doChargeSlashNext) {
							this.isComboStarted = false;
							if (forecast[0] === me) {
								this.context.useSkill('chargeSlash');
							} else {
								var moves = [ 'hellfire', 'windchill' ];
								this.context.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
							}
						} else {
							this.isComboStarted = true;
							forecast = this.context.turnForecast('quickstrike');
							if (forecast[0] === me) {
								this.context.useSkill('quickstrike');
							} else {
								if (this.hasStatus('crackdown')) {
									this.context.useSkill('omni');
									this.isComboStarted = false;
								} else {
									this.context.useSkill('quickstrike');
									this.doChargeSlashNext = true;
								}
							}
						}
					} else {
						var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
						this.context.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
					}
				}
				break;
			case 4:
				if (this.phase > lastPhase) {
					if (!this.hasStatus('drunk')) {
						this.context.useSkill('desperationSlash');
					}
					this.context.useSkill('electrocute');
				} else {
					var forecast = this.context.turnForecast('omni');
					if (forecast[0] === me || forecast[1] === me) {
						this.context.useSkill('omni');
					} else {
						if (Math.random() < 0.5) {
							this.context.useSkill('chargeSlash');
						} else {
							var moves = [ 'hellfire', 'windchill', 'electrocute', 'upheaval' ];
							this.context.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
						}
					}
				}
				break;
		}
	}
};
