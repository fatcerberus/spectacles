/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

({
	enter: function(map, world) {
		var font = GetSystemFont();
		var maggieSize = 1.0;
		analogue.world.munchSound = new Sound('sounds/Munch.wav');
		
		var followers = [
			{ name: 'Bruce', sprite: 'battlers/Bruce.rss', ghostLevel: 0 },
			{ name: 'Lauren', sprite: 'battlers/Lauren.rss', ghostLevel: 0 },
			{ name: 'Katelyn', sprite: 'battlers/Katelyn.rss', ghostLevel: 0 },
			{ name: 'Scott Temple', sprite: 'battlers/Scott T.rss', ghostLevel: 0 },
			{ name: 'Amanda', sprite: 'battlers/Amanda.rss', ghostLevel: 0 },
			{ name: 'Justin', sprite: 'battlers/Justin.rss', ghostLevel: 0 },
			{ name: 'Victor', sprite: 'battlers/Victor.rss', ghostLevel: 0 },
			{ name: 'Elysia', sprite: 'battlers/Elysia.rss', ghostLevel: 0 },
			{ name: 'scott', sprite: 'battlers/Scott.rss', ghostLevel: 0 },
			{ name: 'robert', sprite: 'battlers/Robert.rss', ghostLevel: 0 },
		];
		
		SetDefaultPersonScript(SCRIPT_ON_DESTROY, function() {
			var person = GetCurrentPerson();
			var distance = GetPersonLeader(person) != "" ? GetPersonFollowDistance(person) : 0;
			link(GetPersonFollowers(person)).each(function(name) {
				FollowPerson(name, GetPersonLeader(person), distance);
			});
		});
		SetDefaultPersonScript(SCRIPT_ON_ACTIVATE_TALK, function() {
			var name = GetCurrentPerson();
			if (name == 'maggie' || name == 'robert') return;
			if (GetInputPerson() == 'scott') {
				new scenes.Scene()
					.talk("Scott", true, 2.0, Infinity, "Oh, hey " + name + "! maggie is just on a rampage today, isn't she? Eating ghosts left and right... how do you eat a ghost anyway?")
					.talk(name, true, 2.0, Infinity, "Scott, you suck. Go get eaten by a hunger-pig or something.")
					.run(true);
			} else {
				new scenes.Scene()
					.talk(name, true, 2.0, Infinity, "Please don't eat me, maggie!")
					.talk("maggie", true, 2.0, Infinity, "Too late!")
					.killPerson(name)
					.playSound('sounds/Munch.wav')
					.run(true);
			}
		});
		SetDefaultPersonScript(SCRIPT_ON_ACTIVATE_TOUCH, function() {
			var muncher = GetActivePerson();
			var food = GetCurrentPerson();
			if (food == 'maggie') {
				muncher = GetCurrentPerson();
				food = GetActivePerson();
			}
			if (muncher != 'maggie')
				return;  // nobody can munch except maggie!
			var maggieX = GetPersonX(muncher);
			var maggieY = GetPersonY(muncher);
			var pose = GetPersonDirection(muncher);
			var foodX = GetPersonX(food);
			var foodY = GetPersonY(food);
			if (maggieY - foodY < -8 * maggieSize && pose.indexOf('south') == -1) return;
			if (maggieY - foodY > 8 * maggieSize && pose.indexOf('north') == -1) return;
			if (maggieX - foodX < -8 * maggieSize && pose.indexOf('east') == -1) return;
			if (maggieX - foodX > 8 * maggieSize && pose.indexOf('west') == -1) return;
			analogue.world.munchSound.play(false);
			var name = GetPersonMask(food).alpha == 255 ? food : food + "'s ghost";
			DestroyPerson(food);
			SetPersonScaleFactor(muncher, maggieSize, maggieSize);
			maggieSize += 0.05;
		});
		
		threads.createEx(null, {
			render: function() {
				link(followers)
					.where(function(info) { return DoesPersonExist(info.name); })
					.where(function(info) { return info.ghostLevel > 0; })
					.each(function(info)
				{
					var x = MapToScreenX('Base', GetPersonX(info.name));
					var y = MapToScreenY('Base', GetPersonY(info.name));
					DrawTextEx(font, x, y, "Lv." + info.ghostLevel, new Color(255, 255, 255, 128), 1, 'center');
				});
			},
			update: function() {
				link(followers)
					.where(function(info) { return !DoesPersonExist(info.name); })
					.first(1)
					.each(function(info)
				{
					++info.ghostLevel;
					CreatePerson(info.name, info.sprite, false);
					SetPersonMask(info.name, new Color(255, 255, 255, 128));
					var maggieX = GetPersonX('maggie');
					var maggieY = GetPersonY('maggie');
					SetPersonIgnoreList(info.name, link(followers)
						.pluck('name')
						.concat([ 'robert' ])
						.toArray());
					var x, y;
					var distance = 160 * maggieSize;
					do {
						x = RNG.range(maggieX - distance, maggieX + distance);
						y = RNG.range(maggieY - distance, maggieY + distance);
					} while (IsPersonObstructed(info.name, x, y));
					SetPersonXYFloat(info.name, x, y);
					SetPersonScript(info.name, SCRIPT_COMMAND_GENERATOR, function() {
						var name = GetCurrentPerson();
						var maggieX = GetPersonX('maggie');
						var maggieY = GetPersonY('maggie');
						var xDelta = GetPersonX(name) - maggieX;
						var yDelta = GetPersonY(name) - maggieY;
						var isMoveOK = false;
						do {
							var movement = RNG.sample([
								COMMAND_MOVE_NORTH,
								COMMAND_MOVE_EAST,
								COMMAND_MOVE_SOUTH,
								COMMAND_MOVE_WEST,
							]);
							isMoveOK = (movement != COMMAND_MOVE_NORTH || yDelta >= -128)
								&& (movement != COMMAND_MOVE_EAST || xDelta <= 128)
								&& (movement != COMMAND_MOVE_SOUTH || yDelta <= 128)
								&& (movement != COMMAND_MOVE_WEST || xDelta >= -128);
						} while (!isMoveOK);
						var facing = movement - COMMAND_MOVE_NORTH + COMMAND_FACE_NORTH;
						var steps = RNG.normal(2, 1) * 32;
						QueuePersonCommand(name, facing, true);
						for (var i = 0; i < steps; ++i)
							QueuePersonCommand(name, movement, false);
					});
				});
				if (!IsCameraAttached()) {  // it seems Scott got eaten...
					var session = analogue.getWorld().session;
					session.party.remove('scott');
					session.party.add('maggie', 100);
					new scenes.Scene()
						.fork()
							.maskPerson('maggie', new Color(0, 0, 0, 0), 0.125)
							.setSprite('maggie', 'spritesets/battlers/maggie_hippo.rss')
							.maskPerson('maggie', new Color(255, 255, 255, 255), 0.125)
						.end()
						.followPerson('maggie')
						.call(AttachInput, 'maggie')
						.run(true);
				}
				var ghostCount = link(followers)
					.where(function(info) { return info.ghostLevel > 0 })
					.length();
				return true;
			}
		});
		
		CreatePerson('scott', 'battlers/Scott.rss', false);
		AttachCamera('scott');
		AttachInput('scott');
		AttachPlayerInput('maggie', PLAYER_2);
		
		var leader = 'scott';
		for (var i = 0; i < followers.length; ++i) {
			var name = followers[i].name;
			var spriteset = followers[i].sprite;
			if (name != 'scott' && name != 'robert') {
				CreatePerson(name, spriteset, false);
				FollowPerson(name, leader, 32);
				leader = name;
			}
		}
		
		music.play('music/Portentia.ogg');
	},
	
	robert: {
		create: function(self, world) { SetPersonDirection('robert', 'south'); },
		talk: function() {
			var inputPerson = GetInputPerson();
			DetachInput();
			var session = analogue.getWorld().session;
			if (inputPerson === 'scott') {
				var scott = session.party.members['scott'];
				scott.items.push(new ItemUsable('tonic'));
				scott.items.push(new ItemUsable('powerTonic'));
				scott.items.push(new ItemUsable('redBull'));
				scott.items.push(new ItemUsable('holyWater'));
				scott.items.push(new ItemUsable('vaccine'));
				scott.items.push(new ItemUsable('alcohol'));
				new scenes.Scene()
					.talk("Robert", true, 2.0, Infinity, "Scott, you suck. Fight me to decide who gets to kill my sister!")
					.battle('rsbFinal', analogue.getWorld().session)
					.run(true);
				scott.items = [];
			} else {
				var maggie = session.party.members['maggie'];
				maggie.items.push(new ItemUsable('alcohol'));
				new scenes.Scene()
					.talk("Robert", true, 2.0, Infinity, "Hey maggie, where did Scott go?  Please tell me you didn't do... what I think you did... I hope?")
					.talk("maggie", true, 2.0, Infinity, "Guess what?  You're next!")
					.battle('rsbFinal', analogue.getWorld().session)
					.run(true);
				maggie.items = [];
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
			new scenes.Scene()
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
			if (IsInputAttached('maggie')) return;
			var x = GetPersonX('maggie');
			var y = GetPersonY('maggie');
			if (person.command == COMMAND_MOVE_NORTHEAST) { --y; ++x; } else { ++y; --x; }
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
						new scenes.Scene()
							.talk("maggie", true, 2.0, Infinity, "Hey, watch where you're going Scott!  Do it again and you'll get eaten!")
							.run(true);
						person.isActive = true;
						AttachInput('scott');
					} else {
						DetachCamera();
						new scenes.Scene()
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
