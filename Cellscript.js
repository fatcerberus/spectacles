/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import transpile from 'transpile';

describe("Spectacles: Bruce's Story",
{
	version: 1,
	saveID: 'fatcerberus-spectacles',
	author: "Fat Cerberus",
	summary: "Follow Scott Starcross in his quest to stop the Primus from destroying both worlds.",
	resolution: '320x200',
	main: 'scripts/main.js',

	logPath: '~/consoleLog.txt',

	disableAnimations: true,
	disableBattles: false,
	disableSplash: true,
	disableTalking: true,
	disableTitleScreen: true,
});

transpile('@/scripts', files('src/*.js', true));
transpile('@/scripts', files('src/*.mjs', true));

install('@/images',     files('images/*.png', true));
install('@/maps',       files('maps/*.rmp', true));
install('@/maps',       files('maps/*.rts', true));
//install('@/music',      files('music/*.ogg', true));
install('@/spritesets', files('spritesets/*.rss', true));
install('@/sounds',     files('sounds/*.wav', true));
install('@/',           files('icon.png'));
