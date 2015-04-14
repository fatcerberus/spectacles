({
	enter: function(map, world) {
		CreatePerson('hero', 'battlers/Scott.rss', false);
		CreatePerson('bruce', 'battlers/Bruce.rss', false);
		CreatePerson('lauren', 'battlers/Lauren.rss', false);
		CreatePerson('katelyn', 'battlers/Katelyn.rss', false);
		CreatePerson('scott-t', 'battlers/Scott T.rss', false);
		CreatePerson('amanda', 'battlers/Amanda.rss', false);
		FollowPerson('bruce', 'hero', 32);
		FollowPerson('lauren', 'bruce', 32);
		FollowPerson('katelyn', 'lauren', 32);
		FollowPerson('scott-t', 'katelyn', 32);
		FollowPerson('amanda', 'scott-t', 32);
		AttachCamera('hero');
		AttachInput('hero');
		BGM.change('TimeToLetGo');
		analogue.world.munchSound = LoadSound('Munch.wav', false);
		SetDefaultPersonScript(SCRIPT_ON_ACTIVATE_TOUCH, function() {
			food = GetCurrentPerson();
			if (IsInputAttached() && GetInputPerson() == 'maggie' && food != 'robert') {
				analogue.world.munchSound.play(false);
				DestroyPerson(food);
			}
		});
	},
	
	robert: {
		create: function(self, world) { SetPersonDirection('robert', 'south'); },
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
			person.peopleEaten = 0;
		},
		talk: function(person) {
			var inputPerson = GetInputPerson();
			DetachInput();
			person.isActive = false;
			var number = person.peopleEaten != 1 ? person.peopleEaten.toString() : "one";
			new Scenario()
				.doIf(function() { return person.peopleEaten > 0; })
					.talk("Scott", true, 2.0, Infinity,
						"Thanks maggie, you just devoured " + number + " of my friends!",
						"Stupid backstabbing hunger-pigs...")
				.end()
				.talk("maggie", true, 2.0, Infinity, "Hey, um, did you see any chickens around here?  I'm still kind of hungry...")
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
				if (person.isBlocked) return;
				var food = GetObstructingPerson('maggie', x, y);
				if (food != 'hero') {
					analogue.world.munchSound.play(false);
					DestroyPerson(food);
					++person.peopleEaten;
				} else {
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
