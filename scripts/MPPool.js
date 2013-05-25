/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2013 Power-Command
***/

RequireScript('lib/MultiDelegate.js');

// MPPool() constructor
// Creates an object representing an MP pool.
// Arguments:
//     capacity:    The MP capacity of the pool.
//     availableMP: Optional. The amount of MP immediately available for use. If not provided, the
//                  full capacity will be available.
function MPPool(capacity, availableMP)
{
	availableMP = availableMP !== void null ? availableMP : capacity;
	
	this.availableMP = Math.min(availableMP, capacity);
	this.capacity = capacity;
	
	// .gainedMP event
	// Occurs when MP is restored to the pool.
	// Arguments (for event handler):
	//     pool:        The MPPool object raising the event.
	//     availableMP: The amount of MP available for use.
	this.gainedMP = new MultiDelegate();
	
	// .lostMP event
	// Occurs when MP is taken from the pool.
	// Arguments (for event handler):
	//     pool:        The MPPool object raising the event.
	//     availableMP: The amount of MP available for use.
	this.lostMP = new MultiDelegate();
}

// .restore() method
// Returns MP to the pool.
// Arguments:
//     amount: The amount of MP to restore.
MPPool.prototype.restore = function(amount)
{
	this.availableMP = Math.min(this.availableMP + amount, this.capacity);
	this.gainedMP.invoke(this, this.availableMP);
};

// .use() method
// Removes MP from the pool.
// Arguments:
//     amount: The amount of MP to use.
MPPool.prototype.use = function(amount)
{
	if (amount > this.availableMP) {
		Abort("MPPool.use(): Attempted to use more MP than was available in the pool.");
	}
	this.availableMP -= amount;
	this.lostMP.invoke(this, this.availableMP);
};
