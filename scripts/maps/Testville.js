({
	enter: function(map, world) {
		BGM.change('TimeToLetGo');
	},
	
	robert: {
		create: function() { SetPersonDirection('robert', 'south'); },
		talk: function() {
			var inputPerson = GetInputPerson();
			DetachInput();
			if (inputPerson === 'hero') {
				new Scenario()
					.talk("Robert", true, 2.0, Infinity, "Scott, you suck. Fight me to decide who gets to kill my sister!")
					.battle('robert2', analogue.getWorld().session)
					.run(true);
			} else {
				new Scenario()
					.talk("Robert", true, 2.0, Infinity, "Hey maggie, where did Scott go?  Please tell me you didn't do... what I think you did... I hope?")
					.talk("maggie", true, 2.0, Infinity, "Guess what?  You're next!")
					.battle('robert2', analogue.getWorld().session)
					.run(true);
			}
			AttachInput(inputPerson);
		}
	},
	
	maggie: {
		create: function(person) {
			person.command = COMMAND_MOVE_SOUTH;
			person.timesStopped = 0;
			person.steps = 0;
			person.isActive = true;
			person.isBlocked = false;
		},
		talk: function(person) {
			var inputPerson = GetInputPerson();
			DetachInput();
			person.isActive = false;
			new Scenario()
				.talk("maggie", true, 2.0, Infinity, "Hey, did you see any chickens around here?  I'm kind of hungry...")
				.run(true);
			person.isActive = true;
			AttachInput(inputPerson);
		},
		generator: function(person) {
			if (!person.isActive) return;
			var x = GetPersonX('maggie');
			var y = GetPersonY('maggie');
			if (person.command == COMMAND_MOVE_NORTH) --y; else ++y;
			if (IsPersonObstructed('maggie', x, y)) {
				if (person.isBlocked || GetObstructingPerson('maggie', x, y) !== 'hero')
					return;
				DetachInput('hero');
				person.isActive = false;
				if (++person.timesStopped <= 1) {
					new Scenario()
						.talk("maggie", true, 2.0, Infinity, "Hey, watch where you're going Scott!  Do it again and you'll get eaten!")
						.run(true);
					person.isActive = true;
					AttachInput('hero');
				} else {
					DetachCamera();
					new Scenario()
						.talk("maggie", true, 2.0, Infinity, "That's it, you blocked my path for the last time! Prepare to be devoured!")
						.fork()
							.focusOnPerson('maggie', 2.0)
						.end()
						.talk("Scott", true, 4.0, 0.0, "No maggie, please don't eaAHHHHHHHHHHHHHHHHH--")
						.killPerson('hero')
						.playSound('Munch.wav')
						.talk("maggie", true, 2.0, Infinity, "Tastes like chicken!")
						.run(true);
					AttachInput('maggie');
					AttachCamera('maggie');
					var session = analogue.getWorld().session;
					session.party.remove('scott');
					session.party.add('maggie', 100);
					BGM.change('RiseOfThePrimus');
				}
				person.isBlocked = true;
				return;
			}
			person.isBlocked = false;
			QueuePersonCommand('maggie', person.command, false);
			++person.steps;
			if (person.steps > 128) {
				person.command = person.command == COMMAND_MOVE_SOUTH ? COMMAND_MOVE_NORTH : COMMAND_MOVE_SOUTH;
				person.steps = 0;
			}
		}
	}
})
