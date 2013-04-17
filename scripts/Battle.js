/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

RequireScript("BattleUnit.js");
RequireScript("HPGauge.js");
RequireScript("MPGauge.js");
/*ALPHA*/ RequireScript("BattleUnitActionMenu.js");

// BattleResult enumeration
// Specifies the outcome of a battle.
BattleResult =
{
	partyWon: 1,
	partyRetreated: 2,
	enemyWon: 3
};

// Battle() constructor
// Creates an object representing a battle.
// Arguments:
//     session: The game session in which the battle is taking place.
//     setup:   The starting parameters for the battle.
function Battle(session, setup)
{
	// .go() method
	// Starts the battle.
	this.go = function()
	{
		this.enemyUnits = [];
		for (var i = 0; i < this.setup.enemies.length; ++i) {
			var unit = new BattleUnit(this, this.setup.enemies[i]);
			this.enemyUnits.push(unit);
			this.allBattleUnits.push(unit);
		}
		var threadID = Threads.createEntityThread(this);
		(new BattleUnitActionMenu(this, null)).show();
		Threads.waitFor(threadID);
	};
	
	// .addEnemy() method
	// Adds an additional enemy unit to the battle.
	// Arguments:
	//     enemy: The enemy type to be added.
	this.addEnemy = function(enemy)
	{
		var newUnit = new BattleUnit(this, enemy);
		this.enemyUnits.push(newUnit);
	};
	
	// .predictTurns() method
	// Takes a forecast of the next 10 units to act.
	this.predictTurns = function(actor, nextMoves)
	{
		var forecast = [];
		for (var turnIndex = 0; turnIndex <= 9; ++i) {
			for (var unit in this.allBattleUnits) {
				var timeUntilUp = unit.timeUntilTurn(i, 3, (unit === actor) ? nextMoves : null);
				forecast.push({ unit: unit, remainingTime: timeUntilUp });
			}
		}
		forecast.sort(function(a, b) { return a.remainingTime - b.remainingTime; });
		return forecast.slice(0, 10);
	};
	
	// .resume() method
	// Resumes a previously-suspended battle.
	this.resume = function()
	{
		--this.suspendCount;
		if (this.suspendCount < 0) {
			this.suspendCount = 0;
		}
	};
	
	// .runAction() method
	// Executes a battler action.
	this.runAction = function(user, targets, action)
	{
		// Invoke onAct on all active battle conditions
		for (var i = 0; i < this.conditions.length; ++i) {
			if (this.conditions[i].onCycle != null) {
				this.conditions[i].onAct(this);
			}
		}
	};
	
	// .suspend() method
	// Pauses the battle.
	this.suspend = function()
	{
		++this.suspendCount;
	};
	
	// .tick() method
	// Advances the battle by one frame.
	this.tick = function()
	{
		if (this.suspendCount <= 0) {
			for (var i = 0; i < this.allBattleUnits.length; ++i) {
				this.allBattleUnits[i].tick();
			}
		}
	};
	
	// .update() method
	// Updates the internal state for the battle.
	this.update = function()
	{
		this.tick();
		return this.battleResult == null;
	};
	
	// .render() method
	// Renders the battle screen.
	this.render = function()
	{
		Rectangle(0, 0, 320, 240, CreateColor(0, 128, 0));
	};
	
	// .battleLevel property
	// Gets the enemy battle level for the battle.
	this.battleLevel getter = function()
	{
		return this.setup.battleLevel;
	};
	
	// .result property
	// Gets the result of the battle.
	this.result getter = function()
	{
		return this.battleResult;
	};
	
	
	this.allBattleUnits = [];
	this.conditions = [];
	this.suspendCount = 0;
	this.playerUnits = [];
	this.battleResult = null;
	this.setup = setup;
}
