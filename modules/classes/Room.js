let uuidv1 = require('uuid/v1');

let c = require('../constants');

class Room {
	constructor() {
		this.id = uuidv1();
		this.allPlayers = [];
		this.allKings = [];
		this.allLegions = [];
		this.availableColors = getColors();
		this.availableAINames = getAINames();
		this.ranking = getRanking();
	}
}

function getColors() {
	let availableColors = [];
	for (let color in c.COLORS) {
		availableColors.push(color);
	}

	return availableColors;
}

function getAINames() {
	let availableAINames = [];
	for (let i = 0; i < c.AI_NAMES.length; i++) {
		availableAINames.push(c.AI_NAMES[i]);
	}

	return availableAINames;
}

function getRanking() {
	let ranking = [];
	for (let i = 0; i < c.GAME_PLAYERS_NUM; i++) {
		ranking.push({id: '', name: ''});
	}

	return ranking;
}

module.exports = Room;