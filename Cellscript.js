function $sphere()
{
	install(files("scripts/*.js", true), "scripts");
	install(files("images/*.png", true), "images");
	install(files("maps/*.rmp", true), "maps");
	install(files("maps/*.rts", true), "maps");
	install(files("music/*.ogg", true), "music");
	install(files("spritesets/*.rss", true), "spritesets");
	install(files("sounds/*.wav", true), "sounds");
	install(files("icon.png"));

	install(s2gm({
		name: "Spectacles: Bruce's Story",
		author: "Fat Cerberus",
		summary: "Follow Scott Starcross in his quest to stop the Primus.",
		resolution: '320x240',
		script: 'scripts/main.js',

		// Specs Engine specifics
		logPath: '~usr/Spectacles Saga/Console Log.txt',
		disableAnimation: false,
		disableBattles: false,
		disableSplash: true,
		disableTitleScreen: true,
	}));
}
