/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

class MPPool
{
	constructor(id, capacity, availableMP = capacity)
	{
		this.id = id;
		this.availableMP = Math.min(availableMP, capacity);
		this.capacity = capacity;
		term.print(`create MP pool '${this.id}'`, `cap: ${this.capacity}`,
			`now: ${this.availableMP}`);

		// handler function signature:
		//     function(pool, mpLeft)
		this.gainedMP = new Delegate();
		this.lostMP = new Delegate();
	}

	restore(amount)
	{
		amount = Math.round(amount);
		this.availableMP = Math.min(this.availableMP + amount, this.capacity);
		this.gainedMP.invoke(this, this.availableMP);
		if (amount != 0) {
			term.print(`restore ${amount} MP to pool '${this.id}'`,
				`now: ${this.availableMP}`);
		}
	}

	use(amount)
	{
		amount = Math.round(amount);
		if (amount > this.availableMP)
			throw new Error(`'${this.id}' MP overdraft`);
		this.availableMP -= amount;
		this.lostMP.invoke(this, this.availableMP);
		if (amount != 0) {
			term.print(`use ${Math.round(amount)} MP from pool '${this.id}'`,
				`left: ${this.availableMP}`);
		}
	}
}
