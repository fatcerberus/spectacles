/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

Object.assign(Sphere.Game,
{
	version: 2, apiLevel: 1,

	name: "Spectacles: Bruce's Story",
	saveID: 'fatCerberus.spectacles',
	author: "Fat Cerberus",
	summary: "Follow Scott Starcross in his quest to stop the Primus from destroying both worlds.",
	resolution: '320x200',
	main: '@/scripts/main.mjs',

	fullScreen: false,

	disableAnimations: false,
	disableBattles: false,
	disableSplash: false,
	disableTalking: false,
	disableTitleScreen: false,
});

install('@/scripts', files('src/*.mjs', true));

install('@/images', files('images/*.png', true));
install('@/music', files('music/*.ogg', true));
install('@/spritesets', files('spritesets/*.rss', true));
install('@/sounds', files('sounds/*.wav', true));
install('@/', files('icon.png'));
