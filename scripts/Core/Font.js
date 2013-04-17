/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function Font(filename)
{
	var fontObject = LoadFont(filename);
	
	this.getTextSize = function(text)
	{
		return fontObject.getStringWidth(text);
	};
	
	this.print = function(x, y, text, color, shadowLength)
	{
		if (color === undefined) color = CreateColor(255, 255, 255);
		if (shadowLength === undefined) shadowLength = 0;
		
		if (shadowLength != 0) {
			this.fontObject.setColorMask(CreateColor(0, 0, 0));
			this.fontObject.drawText(x + shadowLength, y + shadowLength, text);
		}
		this.fontObject.setColorMask(color);
		this.fontObject.drawText(x, y, text);	
	};
}
