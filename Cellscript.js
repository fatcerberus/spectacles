function $default()
{
	install(files("scripts/*.js", true), "scripts");
	install(files("scripts/*.ts", true), "scripts");
	install(files("commonjs/*.js", true), "commonjs");
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
			recommend: "minisphere 3.0+",
			apiVersion: 2.0,
			extensions: [
				"sphere-legacy-api",
				"sphere-obj-constructors",
				"sphere-obj-props",
				"sphere-map-engine",
				"sphere-rng-object",
				"sphere-s2gm",
				"sphere-spherefs",
				"sphere-typescript",
			]
		},

		// miniRT options
		frameRate: 60,
		logPath: '~usr/Spectacles Saga/console.log',
		
		// Specs Engine debug options
		disableAnimation: false,
		disableBattles: false,
		disableSplash: true,
		disableTitleScreen: true,
	}));
}
