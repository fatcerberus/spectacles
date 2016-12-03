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

	install(manifest({
		version: 1,
		name: "Spectacles: Bruce's Story",
		author: "Fat Cerberus",
		summary: "Follow Scott Starcross in his quest to stop the Primus.",
		resolution: '320x200',
		main: 'scripts/main.js',

		logPath: '~/Spectacles Saga/console.log',
		
		disableAnimation: false,
		disableBattles: false,
		disableSplash: false,
		disableTitleScreen: false,
	}));
}
