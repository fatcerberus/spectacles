// Color() constructor
// Creates a new color object. Color objects define colors as RGBA tuples.
// Arguments:
//     r: The red component.
//     g: The green component.
//     b: The blue component.
//     a: The alpha (translucency) component.
// Remarks:
//     All components should range from 0-255. Provided component values will be clamped
//     if they are out of range.
function Color(r, g, b, a)
{
	a = a !== undefined ? a : 255;
	
	if (typeof this !== 'object') {
		return new Color(r, g, b, a);
	}
	this.r = Math.min(Math.max(r, 0), 255);
	this.g = Math.min(Math.max(g, 0), 255);
	this.b = Math.min(Math.max(b, 0), 255);
	this.a = Math.min(Math.max(a, 0), 255);
}

// .blendWith() method
// Blends the color with another, specified color.
// Arguments:
//     color2: The color to blend with.
//     w1:     Optional. The weighting factor of the first color. (default: 1.0)
//     w2:     Optional. The weighting factor of the second color. (default: 1.0)
Color.prototype.blendWith = function(color2, w1, w2)
{
	w1 = w1 !== undefined ? w1 : 1.0;
	w2 = w2 !== undefined ? w2 : 1.0;
	
	var sigma = w1 + w2;
	var r = Math.round((this.r * w1 + color2.r * w2) / sigma);
	var g = Math.round((this.g * w1 + color2.g * w2) / sigma);
	var b = Math.round((this.b * w1 + color2.b * w2) / sigma);
	var a = Math.round((this.a * w1 + color2.a * w2) / sigma);
	return new Color(r, g, b, a);
};
