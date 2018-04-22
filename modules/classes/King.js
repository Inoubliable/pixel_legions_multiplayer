let uuidv1 = require('uuid/v1');

let c = require('../constants');

class King {
	
	constructor(playerId, x, y, count, attack, color, isAI) {
		this.id = uuidv1();
		this.playerId = playerId;
		this.x = x;
		this.y = y;
		this.count = count;
		this.attack = attack;
		this.path = [];
		this.isPathVisible = false;
		this.selected = false;
		this.move = false;
		this.color = c.COLORS[color].hovered;
		this.spawnedColor = color;
		this.isAI = isAI;
		this.isUnderAttack = false;
	}
}

module.exports = King;