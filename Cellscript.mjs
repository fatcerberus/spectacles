/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { transpile } from 'cell-runtime';

Object.assign(Sphere.Game,
{
	name: "Spectacles: Bruce's Story",
	version: 1,
	saveID: 'fatcerberus-spectacles',
	author: "Fat Cerberus",
	summary: "Follow Scott Starcross in his quest to stop the Primus from destroying both worlds.",
	resolution: '320x200',
	main: 'scripts/main.js',

	logPath: '~/consoleLog.txt',

	disableAnimations: false,
	disableBattles: false,
	disableSplash: false,
	disableTalking: false,
	disableTitleScreen: false,
});

transpile('@/scripts', files('src/*.js', true));
transpile('@/scripts', files('src/*.mjs', true));

install('@/images',     files('images/*.png', true));
install('@/music',      files('music/*.ogg', true));
install('@/spritesets', files('spritesets/*.rss', true));
install('@/sounds',     files('sounds/*.wav', true));
install('@/',           files('icon.png'));
