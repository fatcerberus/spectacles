/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

Object.assign(Sphere.Game,
{
	name: "Spectacles: Bruce's Story",
	version: 1,
	saveID: 'fatCerberus.spectacles',
	author: "Fat Cerberus",
	summary: "Follow Scott Starcross in his quest to stop the Primus from destroying both worlds.",
	resolution: '320x200',
	main: '@/scripts/main.js',

	disableAnimations: false,
	disableBattles: false,
	disableSplash: false,
	disableTalking: false,
	disableTitleScreen: false,
});

install('@/scripts', files('src/*.js', true));
install('@/scripts', files('src/*.mjs', true));

install('@/images',     files('images/*.png', true));
install('@/lib',        files('lib/*.js', true));
install('@/maps',       files('maps/*.rmp', true));
install('@/maps',       files('maps/*.rts', true));
install('@/music',      files('music/*.ogg', true));
install('@/music',      files('music/*.mp3', true));
install('@/spritesets', files('spritesets/*.rss', true));
install('@/sounds',     files('sounds/*.wav', true));
install('@/',           files('icon.png'));
