let uuidv1 = require('uuid/v1');

let c = require('../constants');

class Room {
	constructor(name) {
		this.id = uuidv1();
		this.name = name;
		this.allPlayers = [];
		this.allKings = [];
		this.allLegions = [];
		this.availableColors = getColors();
		this.availableAINames = getAINames();
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

module.exports = Room;