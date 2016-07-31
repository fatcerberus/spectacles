/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

// MPPool() constructor
// Creates an object representing an MP pool.
// Arguments:
//     id:          The ID string for the pool, used for logging purposes.
//     capacity:    The MP capacity of the pool.
//     availableMP: Optional. The amount of MP immediately available for use. If not provided, the
//                  full capacity will be available.
function MPPool(id, capacity, availableMP)
{
	availableMP = availableMP !== void null ? availableMP : capacity;
	
	this.id = id;
	this.availableMP = Math.min(availableMP, capacity);
	this.capacity = capacity;
	terminal.log("Created MP pool '" + this.id + "'",
		"cap: " + this.capacity,
		"avail: " + this.availableMP);
	
	// .gainedMP event
	// Occurs when MP is returned to the pool.
	// Arguments (for event handler):
	//     pool:        The MPPool object raising the event.
	//     availableMP: The amount of MP available for use.
	this.gainedMP = new events.Delegate();
	
	// .lostMP event
	// Occurs when MP is taken from the pool.
	// Arguments (for event handler):
	//     pool:        The MPPool object raising the event.
	//     availableMP: The amount of MP available for use.
	this.lostMP = new events.Delegate();
}

// .restore() method
// Returns MP to the pool.
// Arguments:
//     amount: The amount of MP to restore.
MPPool.prototype.restore = function(amount)
{
	amount = Math.round(amount);
	this.availableMP = Math.min(this.availableMP + amount, this.capacity);
	this.gainedMP.invoke(this, this.availableMP);
	if (amount != 0) {
		terminal.log(amount + " MP restored to pool '" + this.id + "'",
			"avail: " + this.availableMP);
	}
};

// .use() method
// Removes MP from the pool.
// Arguments:
//     amount: The amount of MP to use.
MPPool.prototype.use = function(amount)
{
	amount = Math.round(amount);
	if (amount > this.availableMP) {
		Abort("MPPool.use(): Attempted to use more MP than was available in the pool.");
	}
	this.availableMP -= amount;
	this.lostMP.invoke(this, this.availableMP);
	if (amount != 0) {
		terminal.log(Math.round(amount) + " MP used from pool '" + this.id + "'",
			"left: " + this.availableMP);
	}
};
