({
	enter: function(map, world) {
		analogue.world.munchSound = new Sound('Munch.wav', false);
		SetDefaultPersonScript(SCRIPT_ON_DESTROY, function() {
			var person = GetCurrentPerson();
			var distance = GetPersonLeader(person) != "" ? GetPersonFollowDistance(person) : 0;
			mini.Link(GetPersonFollowers(person)).each(function(name) {
				FollowPerson(name, GetPersonLeader(person), distance);
			});
		});
		SetDefaultPersonScript(SCRIPT_ON_ACTIVATE_TALK, function() {
			name = GetCurrentPerson();
			if (name == 'maggie' || name == 'robert') return;
			new mini.Scene()
				.talk(name, true, 2.0, Infinity, "Please don't eat me, maggie!")
				.talk("maggie", true, 2.0, Infinity, "Too late!")
				.killPerson(name)
				.playSound('Munch.wav')
				.run(true)
		});
		SetDefaultPersonScript(SCRIPT_ON_ACTIVATE_TOUCH, function() {
			food = GetCurrentPerson();
			if (IsInputAttached() && GetInputPerson() == 'maggie' && food != 'robert') {
				analogue.world.munchSound.play(false);
				DestroyPerson(food);
			}
		});
		
		CreatePerson('scott', 'battlers/Scott.rss', false);
		AttachCamera('scott');
		AttachInput('scott');
		
		CreatePerson('bruce', 'battlers/Bruce.rss', false);
		CreatePerson('lauren', 'battlers/Lauren.rss', false);
		CreatePerson('katelyn', 'battlers/Katelyn.rss', false);
		CreatePerson('temple', 'battlers/Scott T.rss', false);
		CreatePerson('amanda', 'battlers/Amanda.rss', false);
		CreatePerson('justin', 'battlers/Justin.rss', false);
		CreatePerson('victor', 'battlers/Victor.rss', false);
		CreatePerson('elysia', 'battlers/Elysia.rss', false);
		FollowPerson('bruce', 'scott', 32);
		FollowPerson('lauren', 'bruce', 32);
		FollowPerson('katelyn', 'lauren', 32);
		FollowPerson('temple', 'katelyn', 32);
		FollowPerson('amanda', 'temple', 32);
		FollowPerson('justin', 'amanda', 32);
		FollowPerson('victor', 'justin', 32);
		FollowPerson('elysia', 'victor', 32);
		
		mini.BGM.play('BGM/Portentia.ogg');
	},
	
	robert: {
		create: function(self, world) { SetPersonDirection('robert', 'south'); },
		talk: function() {
			var inputPerson = GetInputPerson();
			DetachInput();
			if (inputPerson === 'scott') {
				new mini.Scene()
					.talk("Robert", true, 2.0, Infinity, "Scott, you suck. Fight me to decide who gets to kill my sister!")
					.battle('robert2', analogue.getWorld().session)
					.run(true);
			} else {
				new mini.Scene()
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
			new mini.Scene()
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
				if (food != 'scott') {
					analogue.world.munchSound.play(false);
					DestroyPerson(food);
					++person.peopleEaten;
				} else {
					DetachInput('scott');
					person.isActive = false;
					if (++person.timesStopped <= 1) {
						new mini.Scene()
							.talk("maggie", true, 2.0, Infinity, "Hey, watch where you're going Scott!  Do it again and you'll get eaten!")
							.run(true);
						person.isActive = true;
						AttachInput('scott');
					} else {
						DetachCamera();
						new mini.Scene()
							.talk("maggie", true, 2.0, Infinity, "That's it, you blocked my path for the last time! Prepare to be devoured!")
							.fork()
								.focusOnPerson('maggie', 2.0)
							.end()
							.maskPerson('maggie', new Color(0, 0, 0, 0), 1.0)
							.setSprite('maggie', 'battlers/maggie_hippo.rss')
							.maskPerson('maggie', new Color(255, 255, 255, 255), 1.0)
							.resync()
							.talk("Scott", true, 4.0, 0.0, "No maggie, please don't eaAHHHHHHHHHHHHHHHHH--")
							.killPerson('scott')
							.playSound('Munch.wav')
							.talk("maggie", true, 2.0, Infinity, "Tastes like chicken!")
							.run(true);
						AttachInput('maggie');
						AttachCamera('maggie');
						var session = analogue.getWorld().session;
						session.party.remove('scott');
						session.party.add('maggie', 100);
						mini.BGM.play('BGM/Animals.ogg');
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
