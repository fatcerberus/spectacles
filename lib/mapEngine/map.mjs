import from from 'from';
import * as prim from 'prim';

const engineData = new WeakMap();

export
class MapEngine
{
	constructor(mapName = null)
	{
		var updateJob = Dispatch.onUpdate(this.onUpdate.bind(this));
		var renderJob = Dispatch.onRender(this.onRender.bind(this));
		engineData.set(this, {
			updateJob,
			renderJob,
			persons: [],
			cameraX: 0,
			cameraY: 0,
			cameraMap: mapName,
		});
	}

	addPerson(person)
	{
		const self = engineData.get(this);
		if (!self.persons.includes(person))
			self.persons.push(person);
	}

	removePerson(person)
	{
		const self = engineData.get(this);
		from.Array(self.persons)
			.where(it => it === person)
			.remove();
	}

	shutDown()
	{
		const self = engineData.get(this);
		Dispatch.cancel(self.updateJob);
		Dispatch.cancel(self.renderJob);
		from.Array(self.persons).remove();
	}

	onUpdate()
	{
	}

	onRender()
	{
		const self = engineData.get(this);
		from.Array(self.persons)
			.where(it => it.map == this.currentMap)
			.each(person =>
		{
			
		});
	}
}

export
class Person
{
	constructor(engine, name)
	{
		Object.assign(this, {
			engine,
			name,
		});
		engine.addPerson(this);
	}

	dispose()
	{
		this.engine.removePerson(this);
	}
}
