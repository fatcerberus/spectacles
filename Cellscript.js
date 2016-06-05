function $default()
{
	install(files("scripts/*.js", true), "scripts");
	install(files("lib/*.js", true), "lib");
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
		resolution: '320x200',
		script: 'scripts/main.js',

		minimumPlatform: {
			recommend: "minisphere 4.0+",
			apiLevel: 1,
		},

		// miniRT options
		frameRate: 60,
		logPath: '~/Spectacles Saga/console.log',
		
		// Specs Engine debug options
		disableAnimation: false,
		disableBattles: false,
		disableSplash: true,
		disableTitleScreen: true,
	}));
}
