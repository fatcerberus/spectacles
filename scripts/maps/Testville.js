({
	enter: function(map, world) {
		BGM.change('LucidaByNight');
	},
	
	robert: {
		create: function() { SetPersonDirection('robert', 'south'); },
		talk: function() {
			DetachInput();
			new Scenario()
				.talk("Robert", true, 2.0, Infinity, "Scott, you suck. Fight me to decide who gets to kill my sister!")
				.battle('robert2', analogue.getWorld().session)
				.run(true);
			AttachInput('hero');
		}
	},
	
	maggie: {
		create: function(person) {
			person.command = COMMAND_MOVE_SOUTH;
			person.steps = 0;
			person.isActive = true;
		},
		talk: function(person) {
			DetachInput();
			person.isActive = false;
			new Scenario()
				.talk("maggie", true, 2.0, Infinity, "Hey, did you see any chickens around here?  I'm kind of hungry...")
				.run(true);
			person.isActive = true;
			AttachInput('hero');
		},
		generator: function(person) {
			if (!person.isActive) return;
			++person.steps;
			QueuePersonCommand("maggie", person.command, false);
			if (person.steps > 128) {
				person.command = person.command == COMMAND_MOVE_SOUTH ? COMMAND_MOVE_NORTH : COMMAND_MOVE_SOUTH;
				person.steps = 0;
			}
		}
	}
})
