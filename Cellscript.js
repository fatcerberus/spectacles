/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2024 Fat Cerberus
**/

describe({
	version: 2,
	apiLevel: 4,
	name: "Spectacles: Bruce's Story",
	author: "Fat Cerberus",
	summary: "Follow Scott Starcross in his quest to stop the Primus from destroying both worlds.",
	resolution: '320x240',
	main: 'scripts/main.js',
	saveID: 'Spectacles Saga',
});

install('@/', files('icon.png'));

install('@/scripts', files('scripts/*.js', true));
install('@/data', files('data/*.json', true));
install('@/images', files('images/*.png', true));
install('@/logos', files('logos/*.png', true));
install('@/music', files('music/*.ogg', true));
install('@/shaders', files('shaders/*.glsl', true));
install('@/spritesets', files('spritesets/*.rss', true));
install('@/sounds', files('sounds/*.wav', true));
