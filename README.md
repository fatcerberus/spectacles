Spectacles: Bruce's Story
=========================

Bruce's Story is the first installment of the three-part Spectacles Saga, a
series of role-playing games following the travails of Scott Starcross as he
attempts to find and defeat the Primus, an exceedingly powerful magic user who
threatens both worlds. According to a prophecy made years before the saga
begins, Scott, the eleventh Littermate, is the only person capable of stopping
the Primus with the aid of the Spectacles, a legendary pair of eyeglasses
granting their wearer magical protection--ostensibly making Scott the chosen
one. But all may not be as it seems...


Credits
=======

- *Bruce Pascoe* - Director / Writer / Lead Developer
- *John Stanko* - Co-writer / Beta Tester


Building
========

The Spectacles Saga games are written in JavaScript for the minisphere
general-purpose game engine.  Building and running the game will require the
minisphere GDK version 2.0 or later, available here:

[minisphere GDK on Spherical Forums]
(http://forums.spheredev.org/index.php/topic,1215.0.html)

After installing the GDK, you can build and run the game by executing the
following on the command line:

- `cell -l dist`
- `msphere dist`

Alternatively, you can open `spectacles.ssproj` in Sphere Studio.


The Battle System
=================

Spectacles uses a conditional turn-based battle system, very similar to the
battle system seen in Final Fantasy X. This system resolves turns dynamically
and assymetrically, based on both the battlers' speed (AGI stat) and the nature
of the attacks used. The rank of a move, displayed next to the move's name in
the action menu and ranging from 1 to 5, determines how long the move will take
to recover from. The higher the rank, the more recovery time is needed and the
longer it will take before the unit's next turn arrives.

Battlers can also choose to change to a defensive stance to parry powerful blows
and counterattack. Pressing the key assigned to [Y] in the engine configuration
utility during move selection will switch the battler to Guard Stance, which
reduces the damage taken from attacks and prevents secondary effects, such as
the Zombie affliction caused by Electrocute. It cannot block statuses inflicted
as a primary effect, however, such as that from Necromancy. Guarding is treated
as a Rank 5 action; if the cooldown expires before the character is attacked,
they will automatically return to Attack Stance.

Note that when a melee (sword or contact) move is Guarded, the attack will miss
outright. The opening thus created will allow the Guarding character to
counterattack, dealing extra damage with their attack.


Status Effects
==============

There are many status effects in Spectacles; some are detrimental, while others
are benign or even beneficial. Unlike many other role-playing games, almost all
bosses in Spectacles are susceptible to status afflictions, with a small to
non-existant list of immunities.

Below are descriptions of some of the statuses available in the Spectacles Saga.

- *Crackdown:* Crackdown, as its name suggests, cracks down on consecutive
               attacks of the same type. Each time an attack of the same type as
               the previous one is used, its efficacy is cut by 25%. Using a
               different type of move will reset the multiplier, but the
               affliction will remain in effect until the end of the battle.

- *Disarray:*  Randomizes the ranks of actions taken by the afflicted unit. This
               cannot be cured, but will wear off on its own after the victim
               has taken 3 actions.

- *Drunk:*     Using Alcohol constitutes full HP recovery at the cost of
               inflicting the Drunk status on the user. This cuts the victim's
               AGI, FOC, and accuracy, as well as creating a painful Earth
               weakness, but doubles STR as a compromise. The status must be
               allowed to wear off on its own; the number of turns required for
               it to expire depends on the victim's base VIT.

- *Frostbite:* Inflicts a small amount of ice damage after every action taken by
               the victim. The effect worsens over time, peaking at double its
               initial efficacy. Frostbite can be removed by subjecting the
               afflicted battler to a fire attack, the damage from which will be
               doubled as a tradeoff.

- *Ghost:*     A battler in Ghost status can't be damaged by anything other than
               magic; however, they are also limited to using magic against
               non-Ghosts if they intend to get anywhere. Note that two Ghosts
               attacking each other will bypass this restriction. Ghost can be
               removed with Holy Water.

- *Ignite:*    Similar to Frostbite, except it inflicts fire damage and hits
               between turns, dealing damage with every action taken in the
               battle. As a tradeoff, the effect weakens over time, quickly
               dropping to only half its initial output. As with Frostbite, this
               can be removed by attacking the afflicted unit with ice.

- *Skeleton:*  The end result of Zombie (see below) if the status is not cured
               before the victim reaches 0 HP. Skeletons have their STR and FOC
               cut in half in exchange for being allowed to continue fighting
               after death. Any physical or slash damage will end a Skeleton,
               however. Skeleton can be removed with Holy Water, reviving the
               battler with 1 HP.

- *Zombie:*    Reverses HP restoration (healing), converting it into an
               equivalent amount of damage. If a zombified battler is reduced to
               0 HP by an attack, the status will progress to Skeleton; however,
               converted restoratives will bypass this clause. Zombie can be
               cured with the use of  Holy Water.
