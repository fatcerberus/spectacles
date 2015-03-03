({
	enter: function(map, world) {
		BGM.change('SpectaclesTheme');
	},
	
	maggie: {
		create: function(person) {
			person.command = COMMAND_MOVE_SOUTH;
			person.steps = 0;
		},
		generator: function(person) {
			++person.steps;
			QueuePersonCommand("maggie", person.command, false);
			if (person.steps > 128) {
				person.command = person.command == COMMAND_MOVE_SOUTH ? COMMAND_MOVE_NORTH : COMMAND_MOVE_SOUTH;
				person.steps = 0;
			}
		}
	}
})
