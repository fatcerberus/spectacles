/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

export
function clone(o, memo = [])
{
	if (typeof o === 'object' && o !== null) {
		for (let i = 0; i < memo.length; ++i) {
			if (o === memo[i].original)
				return memo[i].dolly;
		}
		let dolly = Array.isArray(o) ? []
			: 'clone' in o && typeof o.clone === 'function' ? o.clone()
			: {};
		memo[memo.length] = { original: o, dolly: dolly };
		if (Array.isArray(o) || !('clone' in o) || typeof o.clone !== 'function') {
			for (const p in o)
				dolly[p] = clone(o[p], memo);
		}
		return dolly;
	} else {
		return o;
	}
}

export
function drawTextEx(font, x, y, text, color = CreateColor(255, 255, 255), shadowDistance = 0, alignment = 'left')
{
	const Align =
	{
		'left':   (font, x, text) => x,
		'center': (font, x, text) => x - font.getStringWidth(text) / 2,
		'right':  (font, x, text) => x - font.getStringWidth(text),
	};

	x = Align[alignment](font, x, text);
	let oldColorMask = font.getColorMask();
	font.setColorMask(CreateColor(0, 0, 0, color.alpha));
	font.drawText(x + shadowDistance, y + shadowDistance, text);
	font.setColorMask(color);
	font.drawText(x, y, text);
	font.setColorMask(oldColorMask);
}

export
function* range(min, max)
{
	for (let value = min; value <= max; ++value)
		yield value;
}
