let uuidv1 = require('uuid/v1');

let c = require('../constants');
let helpers = require('../helpers');

let dbConnection = require('../../dbConnection');

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
				let deadPlayer = this.allPlayers.find(p => p.id == deadPlayerId);
				deadPlayer.newRating = helpers.calculateRating(deadPlayer.rating, i+1, this.allPlayers);

				// save new rating to db
				if (!deadPlayer.isAI) {
					let prize = c.PRIZES[i];
					let coins = deadPlayer.coins + prize;
					dbConnection.updatePlayer(deadPlayerId, {rating: deadPlayer.newRating, coins: coins});
				}

				this.ranking[i] = deadPlayer;

				// check if only one player is still alive
				if (this.ranking[1].id != '') {
					let winnerKing = this.allKings.find(k => k.count > 0);
					let winner = this.allPlayers.find(p => p.id == winnerKing.playerId);
					winner.newRating = helpers.calculateRating(winner.rating, 1, this.allPlayers);

					// save new rating to db
					if (!winner.isAI) {
						let prize = c.PRIZES[0];
						let coins = winner.coins + prize;
						dbConnection.updatePlayer(winnerKing.playerId, {rating: winner.newRating, coins: coins});
					}

					this.ranking[0] = winner;
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