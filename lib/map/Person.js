'use strict';

const event  = require('event');
const link   = require('link');
const prim   = require('prim');
const scenes = require('scenes');
const struct = require('struct');
const thread = require('thread');
const Map = require('./Map');

exports.Move =
new struct.Enum(
[
	'North',
	'East',
	'South',
	'West',
]);

var persons = [];

exports.Person = Person;
function Person(name, spriteset)
{
	this._map = null;
	this._name = name;
	this._pose = undefined;
	this._x = 0;
	this._y = 0;
	this._z = 0;
	this._speedX = 1.0;
	this._speedY = 1.0;

	persons.push(this);
}

Person.drawAll = function drawAll(map, layer, cameraX, cameraY)
{
	link(persons)
		.where(function(it) { return it.map == map; })
		.where(function(it) { return it.z == layer; })
		.each(function(person)
	{
		person._draw(cameraX, cameraY);
	});
};

Object.defineProperty(Person.prototype, 'map',
{
	get: function() { return _map; },
	set: function(value) {
		if (!(value instanceof Map) && value !== null)
			throw new TypeError("expected a Map object here");
		_map = value;
	}
});

Object.defineProperty(Person.prototype, 'name',
{
	get: function() { return this._name; }
});

Object.defineProperty(Person.prototype, 'pose',
{
	get: function() { return this._pose; },
	set: function(value) { this._po234se = value; }
});

Object.defineProperty(Person.prototype, 'speed',
{
	get: function() {
		return Math.sqrt(this._speedX * this._speedY);
	},
	set: function(value) {
		this._speedX = value;
		this._speedY = value;
	}
});

Person.prototype.dispose = function dispose()
{
	link(persons)
		.where(function(it) { return it === this; })
		.remove();
};

Person.prototype.animate = function animate()
{
};

Person.prototype.move = function move(direction)
{
	var newX = this._x;
	var newY = this._y;
	switch (direction) {
		case exports.Move.North:
			newY -= this._speedY;
			break;
		case exports.Move.East:
			newX += this._speedX;
			break;
		case exports.Move.South:
			newY += this._speedY;
			break;
		case exports.Move.West:
			newX -= this._speedX;
			break;
	}

	if (true /* TODO: collision detection */) {
		this._x = newX;
		this._y = newY;
	}
};

Person.prototype._draw = function _draw(cameraX, cameraY)
{
	prim.rect(screen, this._x - cameraX, this._y - cameraY, 32, 32, Color.Black);
};
