/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

const threads = require('threads');

class Thread
{
	constructor(priority = 0)
	{
		this.priority = priority;
		this.threadID = null;
	}

	dispose()
	{
		this.stop();
	}

	get running()
	{
		return threads.isRunning(this.threadID);
	}

	join()
	{
		threads.join(this.threadID);
	}

	start()
	{
		this.threadID = threads.create({
			getInput: () => this.on_checkInput(),
			update:   () => (this.on_update(), true),
			render:   () => this.on_render(),
		}, this.priority);
	}

	stop()
	{
		threads.kill(this.threadID);
	}

	on_checkInput () {}
	on_render     () {}
	on_update     () {}
}
