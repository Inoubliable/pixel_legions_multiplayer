let uuidv1 = require('uuid/v1');

let c = require('../constants');

class Room {
	constructor() {
		this.id = uuidv1();
		this.allPlayers = [];
		this.allKings = [];
		this.allLegions = [];
		this.availableColors = getColors();
		this.availableAIObjects = getAIObjects();
		this.ranking = getRanking();
		this.open = true;
		this.isEmpty = false;
	}

	checkIfEmpty() {
		let foundHuman = this.allKings.find(k => !k.isAI);
		let numOfPlayers = this.allKings.length;
		if (!foundHuman || numOfPlayers <= 1) {
			this.isEmpty = true;
		}
	}
}

function getColors() {
	let availableColors = [];
	for (let color in c.COLORS) {
		availableColors.push(color);
	}

	return availableColors;
}

function getAIObjects() {
	let availableAIObjects = [];
	for (let i = 0; i < c.AI_OBJECTS.length; i++) {
		availableAIObjects.push(c.AI_OBJECTS[i]);
	}

	return availableAIObjects;
}

function getRanking() {
	let ranking = [];
	for (let i = 0; i < c.GAME_PLAYERS_NUM; i++) {
		ranking.push({id: '', name: ''});
	}

	return ranking;
}

module.exports = Room;