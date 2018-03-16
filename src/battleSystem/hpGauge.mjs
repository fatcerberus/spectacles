/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

//cache colours so we only load them once
let black = Color.Black;
let emptyColor = Color.of('#202020');
let white = Color.White;
let damageColour = Color.DarkRed;
let transparent = Color.Transparent;

// states for segments
const full = 0;
const damaged = 1;
const empty = 2;

export default
class HPGauge
{
	constructor(capacity, sectorSize = 100, color = white, maxSectors = 0)
	{
		// basic details
		this.capacity = capacity;
		this.sectorSize = sectorSize; //hp in a full bar
		this.numReserves = Math.ceil(capacity / sectorSize) - 1;
		this.maxSectors = maxSectors; //note 0 is used for infinity
		this.reserves = [];

		//house keeping
		this.numCombosRunning = 0;
		this.newReading = capacity;
		this.oldReading = capacity;
		let remainder = capacity % sectorSize;
		this.fraction = remainder  === 0 ? 1 : remainder / sectorSize;
		this.fading = false;
		this.drawBackground = true;

		//stats on what is shown
		this._reading = 0; // the total HP remaining
		this.damage = 0;
		this._damageShown = 0; //total value of damage shown
		this._numReservesFilled = this.numReserves; //filled reserves
		this._numReservesDamaged = 0; //damaged i.e. draining away reserves
		this._numReservesEmpty = 0; //balancing figure but still necessary...

		//sizes
		this._x = 0;
		this._y = 0;
		this._height = 0;
		this._width = 0;
		this._slotYSize = 0;
		this._slotXSize = 0;

		// shaders
		this.shader = new Shader({ //shader for most things
			fragmentFile: '#/shaders/image.frag.glsl',
			vertexFile  : '#/shaders/image.vert.glsl',
		});
		this.hpShader = this.shader.clone(); //hp bar shader used for colours (and fading) of hp bar
		this.backgroundShader = this.shader.clone(); // background shader for the faint background bar

		//timers
		this.colorFadeDuration = 0;
		this.colorFadeTimer = 0;
		this.drainSpeed = 1.0;
		this.drainTimer = 0;
		this.fadeSpeed = 0.0;
		this._fadeness = 1.0;
		this._damageFadeness = 1;

		//colour objects
		this._hpColor = null;
		this.newColor = null;
		this.oldColor = null;
		this.tintColor = objectifyColour(color);
		//intentionally make a copy
		this.hpColor = objectifyColour(color);

		// make the background bar - use a twin bar even though it will only need 2/3 of the functions
		// a special case class seems OTT
		this.backgroundBar = new DynamicTwinBar (24, 6, this.backgroundShader, this.shader, false, Color.mix(black, transparent, 25, 75));

		// make the main bar
		this.mainBar = new DynamicTwinBar (24, 6, this.hpShader, this.shader);

		// initialisation
		this.height = 10;
		this.width = 100;

		// make the reserves - a capacity setter could do this
		// would make the constructor neater if we did that
		let length = this.numReserves;
		let slotXSize = this._slotXSize;
		let slotYSize = this._slotYSize;
		let slotX = this._width - slotXSize;
		let slotY = this._height - slotYSize;
		for (let i = 0; i < length; ++i) {
			this.reserves[i] = new Segment(slotX, slotY, slotXSize, slotYSize, this.hpShader, this.shader);
			slotX -= (slotXSize - 1);
		}
	}

	set hpColor (value)
	{
		if (this._hpColor !== value) {
			this.tintColor.r = value.r;
			this.tintColor.g = value.g;
			this.tintColor.b = value.b;
			this.tintColor.a = value.a * (1 - this._fadeness);
			this._hpColor = value;
			setVectorColor(this.backgroundShader, this.tintColor, 0.25);
			setVectorColor(this.hpShader, this.tintColor, 1);
		}
	}

	set x (value)
	{
		if (this._x !== value)
		{
			this._x = value;
			
			if ((this._numReservesFilled + this._numReservesDamaged) === this.numReserves)
				this.mainBar.x = value + this._width - this.mainBar._width;
			else
				this.mainBar.x = value;

			this.backgroundBar.x = value;
			for (let i = 0, length = this.reserves.length; i < length; ++i) {
				this.reserves[i].parentX = value;
			}
		}
	}

	set y (value)
	{
		if (this._y !== value) {
			this._y = value;
			this.mainBar.y = value;
			this.backgroundBar.y = value;
			for (let i = 0, length = this.reserves.length; i < length; ++i) {
				this.reserves[i].parentY = value;
			}
		}
	}

	set slotYSize (value)
	{
		if (this._slotYSize !== value) {
			this._slotYSize = value;
			let slotY = this._height - value;
			for (let i = 0, length = this.reserves.length; i < length; ++ i) {
				this.reserves[i].childY = slotY;
			}
		}
	}

	set slotXSize (value)
	{
		if (this._slotXSize !== value) {
			this._slotXSize = value;
			let slotX = this._width - value;
			for (let i = 0, length = this.reserves.length; i < length; ++ i) {
				this.reserves[i].childX = slotX;
				this.reserves[i].width = value;
				slotX -= (value - 1);
			}
		}
	}

	//sort widths for top bar
	set width (value)
	{
		if (this._width !== value) {
			this._width = value;
			this.slotXSize = this.maxSectors === 0
				? this.slotXSize
				: Math.ceil(this._width / (this.maxSectors - 1));
					
			if ((this._numReservesFilled + this._numReservesDamaged) === this.numReserves) {
				this.mainBar.width = value * this.fraction;
			}
			else {
				this.mainBar.width = value;
			}
			
			this.backgroundBar.width = value;
			for (let i = 0, length = this.reserves.length; i < length; ++i) {
				this.reserves[i].parentX = value + this._x;
			}

		}
	}

	set height (value)
	{
		if (this._height !== value) {
			this._height = value;
			let barHeight = Math.ceil(value * 0.5 + 0.5);
			this.slotYSize = value - barHeight + 1;
			this.slotXSize = this.maxSectors === 0
				? Math.round(this._slotYSize * 1.25)
				: this.slotXSize;

			this.mainBar.height = barHeight;
			this.backgroundBar.height = barHeight;
		}
	}

	set numReservesFilled (value)
	{
		if (this._numReservesFilled !== value) {
			value = Math.max(value, 0);
			this._numReservesFilled = value;
			for (let i = 0; i < value; ++ i) {
				this.reserves[i].state = full;
			}
			this._numReservesEmpty = 0;// ensure that numReserves empty gets reset
		}
	}

	set numReservesDamaged (value)
	{
		if (this._numReservesDamaged !== value) {
			value = Math.max(value, 0);
			this._numReservesDamaged = value;
			let lastDamage = value + this._numReservesFilled;
			for (let i = this._numReservesFilled; i < lastDamage; ++ i) {
				this.reserves[i].state = damaged;
			}
		}
	}

	set numReservesEmpty (value)
	{
		if (this._numReservesEmpty !== value) {
			value = Math.max(value, 0);
			this._numReservesEmpty = value;
			let lastDamage = this._numReservesDamaged + this._numReservesFilled;
			let lastOne = value + lastDamage;
			for (let i = lastDamage; i < lastOne; ++ i) {
				this.reserves[i].state = empty;
			}
		}
	}


	beginCombo()
	{
		++this.numCombosRunning;
	}

	//external method
	changeColor(color, numFrames = 0)
	{
		this.oldColor = Object.assign({}, this._hpColor);
		this.newColor = objectifyColour(color);

		if (numFrames != 0) {
			this.fading = true;
			this.colorFadeDuration = numFrames;
			this.colorFadeTimer = 0;
		}
		else {
			this.hpColor = this.newColor;
		}
	}

	//external method
	draw(x, y, width, height)
	{
		if (this.fadeness >= 1.0)
			return;  // invisible, skip rendering
		// use the x, y, width and height setters to see if the bar has moved
		this.height = height;
		this.width = width;
		this.x = x;
		this.y = y;

		if (this.drawBackground === true)//draw the background bar if needed
			this.backgroundBar.draw();

		this.mainBar.draw();// draw the main bar
		for (let i = 0, length = this.reserves.length; i < length; ++i)
			this.reserves[i].draw();//draw all the reserves
	}

	endCombo()
	{
		--this.numCombosRunning;
		if (this.numCombosRunning < 0)
			this.numCombosRunning = 0;
	}

	//external method
	hide(duration = 0.0)
	{
		if (duration > 0.0) {
			this.fadeSpeed = 1.0 / duration * (1.0 - this.fadeness);
		}
		else {
			this.fadeSpeed = 0.0;
			this.fadeness = 1.0;
		}
	}

	//external method
	show(duration = 0.0)
	{
		if (duration > 0.0) {
			this.fadeSpeed = 1.0 / duration * (0.0 - this.fadeness);
		}
		else {
			this.fadeSpeed = 0.0;
			this.fadeness = 0.0;
		}
	}

	//external method
	set(value)
	{
		value = Math.min(Math.max(Math.round(value), 0), this.capacity);
		if (value != this.newReading) {
			if (this.numCombosRunning > 0)
				this.damage += this._reading - value;
			else
				this.damage = this._reading - value;

			this.damageFadeness = 0.0;
			this.oldReading = this._reading;
			this.newReading = value;
			this.drainTimer = 0.0;
		}
	}

	//external method
	update()
	{
		++this.colorFadeTimer;

		//tween colour fades
		if (this.fading === true) {
			if (this.colorFadeDuration != 0 && this.colorFadeTimer < this.colorFadeDuration) {
				let r = tween(this.oldColor.r, this.colorFadeTimer, this.colorFadeDuration, this.newColor.r);
				let g = tween(this.oldColor.g, this.colorFadeTimer, this.colorFadeDuration, this.newColor.g);
				let b = tween(this.oldColor.b, this.colorFadeTimer, this.colorFadeDuration, this.newColor.b);
				let a = tween(this.oldColor.a, this.colorFadeTimer, this.colorFadeDuration, this.newColor.a);
				this.hpColor = { r, g, b, a };
			}
			else {
				this.hpColor = this.newColor;
				this.colorFadeDuration = 0;
				this.fading = false;
			}
		}

		//fading in and out (for show/hide)
		if (this.fadeSpeed !== 0) {
			this.fadeness = Math.min(Math.max(this.fadeness + this.fadeSpeed / Sphere.frameRate, 0.0), 1.0);
			if (this.fadeness === 0 || this.fadeness === 1)
				this.fadeSpeed = 0;
		}

		if (this.newReading !== this._reading) {
			this.drainTimer += this.drainSpeed / Sphere.frameRate;

			if (this.drainTimer < 0.25)
				this.reading = Math.round(tween(this.oldReading, this.drainTimer, 0.25, this.newReading));
			else
				this.reading = this.newReading;
		}

		if (this.numCombosRunning <= 0 && this._reading == this.newReading)
			this.damageFadeness = this._damageFadeness + this.drainSpeed / Sphere.frameRate;

		if (this.damage > 0)
			this.damageShown = Math.min(this.damage, (this.oldReading - this._reading)) * (1.0 - this._damageFadeness);
		else
			this.damageShown = 0;

		this.numReservesEmpty = this.reserves.length - this._numReservesDamaged - this._numReservesFilled;
	}

	set damageShown (value)
	{
		if (this._damageShown !== value) {
			this._damageShown = value;
			let mainDamage = value % this.sectorSize;
			this.mainBar.damage = mainDamage * (this.mainBar._width - 2) / this.sectorSize;
			this.numReservesDamaged = Math.min(Math.floor(value / this.sectorSize), this.numReserves - this._numReservesFilled);
		}
	}

	set damageFadeness (value)
	{
		if (this._damageFadeness !== value) {
			if (value >= 1.0) {
				this.damage = 0;
				this._damageFadeness = 1.0;
			}
			else
				this._damageFadeness = value;
		}
	}

	set reading (value)
	{
		if (this._reading !== value) //do nothing if this isn't a change
		{
			// 1. set the new value
			this._reading = value;
			if (value < 0)
				value = 0;
			// 2. calculate value for main bar
			let mainValue = value % this.sectorSize;
			if (mainValue === 0 && value !== 0)
				mainValue = this.sectorSize;

			// 3. calculate number of full reserves
			this.numReservesFilled = Math.round((value - mainValue) / this.sectorSize);

			// 4. set main bar and adjust size if entering/leaving first segment.
			if ((this._numReservesFilled + this._numReservesDamaged) === this.numReserves) {
				this.mainBar.width = this._width * this.fraction;
				this.mainBar.x = this._x + this._width - this.mainBar._width;
				this.mainBar.life = mainValue * (this.mainBar._width - 2) / (this.sectorSize * this.fraction);
				this.drawBackground = true;
			}
			else {
				this.mainBar.x = this._x;
				this.mainBar.width = this._width;
				this.mainBar.life = mainValue * (this._width - 2) / this.sectorSize;
				this.drawBackground = false;
			}
		}
	}

	set fadeness (value)
	{
		if (this._fadeness !== value) {
			this._fadeness = value;
			this.tintColor.a = this._hpColor.a * (1 - this._fadeness);
			setVectorColor(this.shader, { r: 1.0, g: 1.0, b: 1.0, a: 1.0 - value }, 1);
			setVectorColor(this.hpShader, this.tintColor, 1);
			setVectorColor(this.backgroundShader, this.tintColor, 0.25);
		}
	}
}

class Segment
{
	constructor(x, y, width, height, hpShader, shader)
	{
		//coordinates and size
		this._x = Math.floor(x);
		this._y = Math.floor(y);
		this._parentX = 0;
		this._parentY = 0;
		this._childX =  Math.floor(x);
		this._childY = Math.floor(y);
		this._width = Math.ceil(width);
		this._height = Math.ceil(height);

		//colours
		this._emptyColour = emptyColor;
		this._borderColour = black;
		this._damageColour = damageColour;

		//graphics objects
		this._full = null;
		this._damaged = null;
		this._empty = null;
		this._outer = null;
		this._model = null;
		this._transform = new Transform();
		this._hpShader = hpShader;
		this._shader = shader;

		//state
		this._state = full;
		
		//housekeeping
		this._needsRender = true;
		this._needsTranslate = true;
		this._needsModel = true;
	}

	reRender ()
	{
		this._full = renderFilled(this._width - 2, this._height - 2, white);
		this._damaged = renderFilled(this._width - 2, this._height - 2, this._damageColour, false);
		this._empty = renderFilled(this._width - 2, this._height - 2, this._emptyColour);
		this._outer = renderOutline(this._width, this._height, 1, this._borderColour);
		this._needsModel = true;
		this._needsRender = false;
	}

	model ()
	{
		switch (this._state) {
			case (full):
				this._model = new Model([ this._outer, this._full ]);
				this._model.shader = this._hpShader;
				break;
			case (damaged):
				this._model = new Model([ this._outer, this._damaged ]);
				this._model.shader = this._shader;
				break;
			case (empty):
				this._model = new Model([ this._outer, this._empty ]);
				this._model.shader = this._shader;
				break;
		}
		this._model.transform = this._transform;
		this._needsModel = false;
	}
	
	translate ()
	{
		this._transform.identity()
			.translate(this._x, this._y);
		this._needsTranslate = false;
	}

	set state (value)
	{
		if (this._state !== value) {
			this._state = value;
			this._needsModel = true;
		}
	}

	set parentX (value)
	{
		let difference = value - this._parentX;
		if (difference !== 0) {
			this._parentX = value;
			this.x = this._x + difference;
		}
	}

	set parentY (value)
	{
		let difference = value - this._parentY;
		if (difference !== 0) {
			this._parentY = value;
			this.y = this._y + difference;
		}
	}

	set childY (value)
	{
		let difference = value - this._childY;
		if (difference !== 0) {
			this._childY = value;
			this.y = this._y + difference;
		}
	}

	set childX (value)
	{
		let difference = value - this._childX;
		if (difference !== 0) {
			this._childX = value;
			this.x = this._x + difference;
		}
	}

	set y (value)
	{
		if (this._y !== value) {
			this._y = value;
			this._needsTranslate = true;
		}
	}

	set x (value)
	{
		if (this._x !== value) {
			this._x = value;
			this._needsTranslate = true;
		}
	}

	get x () { return this._x; }
	get y () { return this._y; }

	set width (value)
	{
		if (this._width !== value) {
			this._width = value;
			this._needsRender = true;
		}
	}

	set height (value)
	{
		if (this._height !== value) {
			this._height = value;
			this._needsRender = true;
		}
	}

	draw ()
	{
		if (this._needsRender === true)
			this.reRender();
		if (this._needsTranslate === true)
			this.translate();
		if (this._needsModel == true)
			this.model();

		this._model.draw();
	}
}

class DynamicTwinBar
{
	constructor(width, height, hpShader, shader, drawEmpty = true, borderColour = black)
	{
		this._x = 0;
		this._y = 0;
		this._width = width;
		this._height = height;
		this.drawEmpty = drawEmpty;
		
		this._damage = 0;
		this._life = width - 2;

		this._borderColour = borderColour; 
		this._damageColour = damageColour;

		this.hpShader = hpShader;
		this.shader = shader;

		this._lifeBar = new Model([ renderFilled(10, height - 2, white) ]);
		this._damageBar = new Model([ renderFilled(10, height - 2, damageColour, false) ]);
		this._emptyBar = new Model([ renderFilled(width - 2, height - 2, emptyColor) ]);
		this._borderBar = new Model([ renderOutline(width, height, 1, borderColour) ]);
		this._lifeBar.shader = hpShader;
		this._damageBar.shader = shader;
		this._borderBar.shader = shader;
		this._emptyBar.shader = shader;
		
		this._borderTransform = new Transform();
		this._lifeTransform = new Transform();
		this._damageTransform = new Transform();
		this._emptyTransform = new Transform();

		this._borderBar.transform = this._borderTransform;
		this._lifeBar.transform = this._lifeTransform;
		this._damageBar.transform = this._damageTransform;
		this._emptyBar.transform = this._emptyTransform;

		this._needsTransform = true;
		this._needsBorderTransfrom = true;
		this._needsRender = false;
	}

	transform()
	{
		let x = this._x - this._width;
		let lifeX = this._x - this._life - 2;
		let damageWidth = Math.min(this._width - this._life - 2, this._damage);
		let damageX = lifeX - damageWidth;

		if (this._damage > 0) {
			this._damageTransform.identity();
			this._damageTransform.scale (damageWidth / 10, 1);
			this._damageTransform.translate (damageX, this._y);
		}

		if (this._life > 0) {
			this._lifeTransform.identity();
			this._lifeTransform.scale (this._life / 10, 1);
			this._lifeTransform.translate (lifeX, this._y);
		}

		if (this._needsBorderTransfrom === true) {
			this._borderTransform.identity();
			this._borderTransform.translate(x, this._y);

			this._emptyTransform.identity();
			this._emptyTransform.translate(x, this._y);
			this._needsBorderTransfrom = false;
		}
		this._needsTransform = false;
	}

	render()
	{
		this._lifeBar = new Model([ renderFilled(10, this._height - 2, white) ]);
		this._damageBar = new Model([ renderFilled(10, this._height - 2, this._damageColour, false) ]);
		this._emptyBar = new Model([ renderFilled(this._width - 2, this._height - 2, emptyColor) ]);
		this._borderBar = new Model([ renderOutline(this._width, this._height, 1, this._borderColour) ]);

		this._lifeBar.shader = this.hpShader;
		this._damageBar.shader = this.shader;
		this._borderBar.shader = this.shader;
		this._emptyBar.shader = this.shader;

		this._borderBar.transform = this._borderTransform;
		this._lifeBar.transform = this._lifeTransform;
		this._damageBar.transform = this._damageTransform;
		this._emptyBar.transform = this._emptyTransform;
	
		this._needsTransform = true;
		this._needsBorderTransfrom = true;
		this._needsRender = false;
	}

	set height (value)
	{
		if (this._height !== value) {
			this._height = value;
			this._needsRender = true;
			this._needsTransform = true;
			this._needsBorderTransfrom = true;
		}
	}

	set width (value)
	{
		if (this._width !== value) {
			let life = this._life / (this._width - 2);
			let damage = this._damage / (this._width - 2);
	
			let rightX = this.x; 
			this._width = value;
			this.x = rightX;

			this.life = life * (value - 2);
			this.damage = damage * (value - 2);
			this._needsRender = true;
			this._needsTransform = true;
			this._needsBorderTransfrom = true;
		}
	}

	set damage (value)
	{
		if (this._damage !== value) {
			this._damage = value;
			this._needsTransform = true;
		}
	}

	set life (value)
	{
		if (this._life !== value) {
			this._life = value;
			this._needsTransform = true;
		}
	}

	set y (value)
	{
		if (this._y !== value) {
			this._y = value;
			this._needsTransform = true;
			this._needsBorderTransfrom = true;
		}
	}

	set x (value) { this.rightX = (value + this._width); }
	get x () { return (this._x - this._width); }

	set rightX (value)
	{
		if (this._x !== value) {
			this._x = value;
			this._needsTransform = true;
			this._needsBorderTransfrom = true;
		}
	}

	get rightX () { return this._x; }

	draw ()
	{
		if (this._needsRender === true)
			this.render();
		if (this._needsTransform === true)
			this.transform();
		if (this.drawEmpty === true)
			this._emptyBar.draw();

		this._borderBar.draw();

		if (this._life > 0)
			this._lifeBar.draw();
		if (this._damage > 0)
			this._damageBar.draw();
	}
}


function renderFilled(width, height, color, shiny = true)
{
	if (shiny) {
		let dimColor = Color.mix(color, black, 66, 33);
		return new Shape(ShapeType.TriStrip,
			new VertexList([
				{ x: 0,     y: 0,          z: 0, u: 0, v: 1, color: dimColor },
				{ x: width, y: 0,          z: 0, u: 1, v: 1, color: dimColor },
				{ x: 0,     y: height / 8, z: 0, u: 0, v: 0, color: color },
				{ x: width, y: height / 8, z: 0, u: 1, v: 0, color: color },
				{ x: 0,     y: height / 8, z: 0, u: 0, v: 1, color: color },
				{ x: width, y: height / 8, z: 0, u: 1, v: 1, color: color },
				{ x: 0,     y: height,     z: 0, u: 0, v: 0, color: dimColor },
				{ x: width, y: height,     z: 0, u: 1, v: 0, color: dimColor },
			]));
	}
	else {
		return new Shape(ShapeType.TriStrip,
			new VertexList([
				{ x: 0,     y: 0,      z: 0, u: 0, v: 1, color },
				{ x: width, y: 0,      z: 0, u: 1, v: 1, color },
				{ x: 0,     y: height, z: 0, u: 0, v: 0, color },
				{ x: width, y: height, z: 0, u: 1, v: 0, color },
			]));
	}
}

function renderOutline(width, height, thickness, colour)
{
	let t = 0.5 * thickness;
	let x1 = t - 1;
	let y1 = t - 1;
	let x2 = width - t - 1;
	let y2 = height - t - 1;
	let vbo = new VertexList([
		{ x: x1 - t, y: y1 - t, color: colour },
		{ x: x1 + t, y: y1 + t, color: colour },
		{ x: x2 + t, y: y1 - t, color: colour },
		{ x: x2 - t, y: y1 + t, color: colour },
		{ x: x2 + t, y: y2 + t, color: colour },
		{ x: x2 - t, y: y2 - t, color: colour },
		{ x: x1 - t, y: y2 + t, color: colour },
		{ x: x1 + t, y: y2 - t, color: colour },
		{ x: x1 - t, y: y1 - t, color: colour },
		{ x: x1 + t, y: y1 + t, color: colour },
	]);

	return new Shape(ShapeType.TriStrip, null, vbo);
}

function tween(start, time, duration, end)
{
	return -(end - start) / 2 * (Math.cos(Math.PI * time / duration) - 1) + start;
}

//helper function to make setting colours neater
function setVectorColor(shader, colour, fadeness)
{
	shader.setFloatVector('tintColor', [ colour.r, colour.g, colour.b, colour.a * fadeness ]);
}

function objectifyColour(colour)
{
	return {
		r: colour.r,
		g: colour.g,
		b: colour.b,
		a: colour.a,
	};
}
