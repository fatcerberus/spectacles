({
	enter: function(map, world) {
		analogue.world.munchSound = new Sound('Munch.wav', false);
		var followers = [
			{ name: 'Bruce', sprite: 'battlers/Bruce.rss' },
			{ name: 'Lauren', sprite: 'battlers/Lauren.rss' },
			{ name: 'Katelyn', sprite: 'battlers/Katelyn.rss' },
			{ name: 'Scott Temple', sprite: 'battlers/Scott T.rss' },
			{ name: 'Amanda', sprite: 'battlers/Amanda.rss' },
			{ name: 'Justin', sprite: 'battlers/Justin.rss' },
			{ name: 'Victor', sprite: 'battlers/Victor.rss' },
			{ name: 'Elysia', sprite: 'battlers/Elysia.rss' },
		];
		
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
			if (GetInputPerson() == 'scott') {
				new mini.Scene()
					.talk("Scott", true, 2.0, Infinity, "Oh, hey " + name + "!")
					.talk(name, true, 2.0, Infinity, "Scott, you suck. Go get eaten by a hunger-pig or something.")
					.run(true);
			} else {
				new mini.Scene()
					.talk(name, true, 2.0, Infinity, "Please don't eat me, maggie!")
					.talk("maggie", true, 2.0, Infinity, "Too late!")
					.killPerson(name)
					.playSound('Munch.wav')
					.run(true);
			}
		});
		SetDefaultPersonScript(SCRIPT_ON_ACTIVATE_TOUCH, function() {
			food = GetCurrentPerson();
			if (food == 'maggie') return;  // nobody is allowed to eat maggie!
			if (IsInputAttached() && GetInputPerson() == 'maggie' && food != 'robert') {
				analogue.world.munchSound.play(false);
				DestroyPerson(food);
			}
		});
		
		mini.Threads.createEx(null, {
			update: function() {
				var doorX = 24 * GetTileWidth() + GetTileWidth() / 2;
				var doorY = 22 * GetTileHeight() + GetTileHeight() / 2;
				if (IsPersonObstructed('maggie', doorX, doorY))
					return true;
				mini.Link(followers)
					.pluck('name')
					.where(function(name) { return !DoesPersonExist(name); })
					.first(1)
					.unpluck()
					.each(function(info)
				{
					CreatePerson(info.name, info.sprite, false);
					SetPersonMask(info.name, new Color(255, 255, 255, 128));
					var maggieX = GetPersonX('maggie');
					var maggieY = GetPersonY('maggie');
					SetPersonX(info.name, RNG.range(maggieX - 160, maggieX + 160));
					SetPersonY(info.name, RNG.range(maggieY - 160, maggieY + 160));
					SetPersonIgnoreList(info.name, mini.Link(followers).pluck('name').toArray());
					IgnoreTileObstructions(info.name, true);
					QueuePersonCommand(info.name, COMMAND_FACE_SOUTH, true);
					for (var i = 0; i < 2 * 32; ++i)
						QueuePersonCommand(info.name, COMMAND_MOVE_SOUTH, false);
					SetPersonScript(info.name, SCRIPT_COMMAND_GENERATOR, function() {
						var name = GetCurrentPerson();
						var maggieX = GetPersonX('maggie');
						var maggieY = GetPersonY('maggie');
						var currentX = GetPersonX(name);
						var currentY = GetPersonY(name);
						var movement = RNG.sample([
							COMMAND_MOVE_NORTH,
							COMMAND_MOVE_EAST,
							COMMAND_MOVE_SOUTH,
							COMMAND_MOVE_WEST,
						]);
						var facing = movement - COMMAND_MOVE_NORTH + COMMAND_FACE_NORTH;
						var steps = RNG.normal(3, 1) * 32;
						QueuePersonCommand(name, facing, true);
						for (var i = 0; i < steps; ++i)
							QueuePersonCommand(name, movement, false);
					});
				});
				return true;
			}
		});
		
		CreatePerson('scott', 'battlers/Scott.rss', false);
		AttachCamera('scott');
		AttachInput('scott');
		
		var leader = 'scott';
		for (var i = 0; i < followers.length; ++i) {
			var name = followers[i].name;
			var spriteset = followers[i].sprite;
			CreatePerson(name, spriteset, false);
			FollowPerson(name, leader, 32);
			leader = name;
		}
		
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
			person.command = COMMAND_MOVE_SOUTHWEST;
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
			if (person.command == COMMAND_MOVE_NORTHEAST) {
				++x;
				--y;
			} else {
				--x;
				++y;
			}
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
				person.command = person.command == COMMAND_MOVE_SOUTHWEST ? COMMAND_MOVE_NORTHEAST : COMMAND_MOVE_SOUTHWEST;
				person.steps = 0;
			}
		}
	}
})
