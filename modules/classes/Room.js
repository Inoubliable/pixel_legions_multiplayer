let uuidv1 = require('uuid/v1');

let c = require('../constants');
let helpers = require('../helpers');

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

	rankPlayer(deadPlayerId) {
		for (let i = this.ranking.length-1; i >= 0; i--) {
			if (this.ranking[i].id == '') {
				this.ranking[i] = this.allPlayers.find(p => p.id == deadPlayerId);
				this.ranking[i].newRating = helpers.calculateRating(this.ranking[i].rating, i+1, this.allPlayers);

				// check if only one player is still alive
				if (this.ranking[1].id != '') {
					let winnerKing = this.allKings.find(k => k.count > 0);
					this.ranking[0] = this.allPlayers.find(p => p.id == winnerKing.playerId);
					this.ranking[0].newRating = helpers.calculateRating(this.ranking[0].rating, 1, this.allPlayers);
				}
				break;
			}
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