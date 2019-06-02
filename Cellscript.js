/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

Object.assign(Sphere.Game, {
	name: "Spectacles: Bruce's Story",
	saveID: 'fatCerberus.spectacles',
	author: "Fat Cerberus",
	summary: "Follow Scott Starcross in his quest to stop the Primus from destroying both worlds.",

	version: 2,
	apiLevel: 2,
	main: '@/scripts/main.js',
	development: {
		emptyPromises: false,
		retrograde: false,
		sandbox: 'relaxed',
	},

	resolution: '320x200',
	fullScreen: false,

	disableAnimations: false,
	disableBattles: false,
	disableSplash: false,
	disableTalking: false,
	disableTitleScreen: false,
});

install('@/scripts', files('src/*.js', true));

install('@/data', files('data/*.json', true));
install('@/images', files('images/*.png', true));
install('@/logos', files('logos/*.png', true));
install('@/music', files('music/*.ogg', true));
install('@/shaders', files('shaders/*.glsl', true));
install('@/spritesets', files('spritesets/*.rss', true));
install('@/sounds', files('sounds/*.wav', true));
install('@/', files('icon.png'));
