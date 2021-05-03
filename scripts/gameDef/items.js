/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

export
const Items =
{
	alcohol: {
		name: "Alcohol",
		tags: [ 'drink', 'curative' ],
		uses: 1,
		action: {
			announceAs: "Alcohol",
			effects: [
				{
					targetHint: 'selected',
					type: 'fullRecover',
				},
				{
					targetHint: 'selected',
					type: 'recoverMP',
					strength: 100,
				},
				{
					targetHint: 'selected',
					type: 'addStatus',
					status: 'drunk',
				},
			],
		},
	},
	holyWater: {
		name: "Holy Water",
		tags: [ 'remedy' ],
		uses: 3,
		action: {
			announceAs: "Holy Water",
			effects: [
				{
					targetHint: 'selected',
					type: 'liftStatusTags',
					tags: [ 'undead' ],
				},
			],
		},
	},
	lazarusPotion: {
		name: "Lazarus Potion",
		tags: [ 'drink', 'curative' ],
		allowDeadTarget: true,
		uses: 2,
		action: {
			announceAs: "Lazarus Potion",
			effects: [
				{
					targetHint: 'selected',
					type: 'revive',
					healToFull: true,
				},
			],
		},
	},
	tonic: {
		name: "Tonic",
		tags: [ 'drink', 'curative' ],
		uses: 5,
		action: {
			announceAs: "Tonic",
			effects: [
				{
					targetHint: 'selected',
					type: 'recoverHP',
					strength: 35,
				},
			],
		},
	},
	powerTonic: {
		name: "Power Tonic",
		tags: [ 'drink', 'curative' ],
		uses: 2,
		action: {
			announceAs: "Power Tonic",
			effects: [
				{
					targetHint: 'selected',
					type: 'recoverHP',
					strength: 50,
				},
				{
					targetHint: 'selected',
					type: 'addStatus',
					status: 'reGen',
				},
			],
		},
	},
	redBull: {
		name: "Red Bull",
		tags: [ 'drink', 'curative' ],
		uses: 2,
		action: {
			announceAs: "Red Bull",
			effects: [
				{
					targetHint: 'selected',
					type: 'recoverMP',
					strength: 100,
				},
			],
		},
	},
	vaccine: {
		name: "Vaccine",
		tags: [ 'drink' ],
		uses: 1,
		action: {
			announceAs: "Vaccine",
			effects: [
				{
					targetHint: 'selected',
					type: 'liftStatusTags',
					tags: [ 'ailment' ],
				},
				{
					targetHint: 'selected',
					type: 'addStatus',
					status: 'immune',
				},
			],
		},
	},
};
