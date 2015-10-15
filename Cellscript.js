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
	
	install(sgm({
		name: "Spectacles: Bruce's Story",
		author: "Fat Cerberus",
		description: "Follow Scott Starcross in his quest to stop the Primus.",
		resolution: "320x240",
		script: "scripts/main.js"
	}));
}
