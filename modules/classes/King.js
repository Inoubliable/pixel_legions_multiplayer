let uuidv1 = require('uuid/v1');

let c = require('../constants');

class King {
	constructor(playerId, x, y, count, color, isAI) {
		this.id = uuidv1();
		this.playerId = playerId;
		this.x = x;
		this.y = y;
		this.count = count;
		this.path = [];
		this.selected = false;
		this.move = false;
		this.color = c.COLORS[color].normal;
		this.spawnedColor = color;
		this.isAI = isAI;
		this.isUnderAttack = false;
	}
}

module.exports = King;