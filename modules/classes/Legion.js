let uuidv1 = require('uuid/v1');

let c = require('../constants');
let helpers = require('../helpers');

class Legion {
	
	constructor(playerId, x, y, count, attack, color, spawning, spawnX, spawnY, isAI) {
		this.id = uuidv1();
		this.playerId = playerId;
		this.x = x;
		this.y = y;
		this.count = count;
		this.attack = attack;
		this.path = [];
		this.isPathVisible = false;
		this.selected = false;
		this.hovered = false;
		this.move = false;
		this.pixels = helpers.createPolygonPoints(x, y, helpers.legionCountToWidth(count)/2, count);
		this.hull = helpers.calculateHull(x, y, helpers.legionCountToWidth(count)/2, count);
		this.nearbyEnemies = [];
		this.colorHovered = c.COLORS[color].hovered.replace('1)', '0.3)');
		this.borderSelected = c.COLORS[color].selected;
		this.colorSelected = c.COLORS[color].selected.replace('1)', '0.5)');
		this.spawning = spawning;
		this.spawnX = spawnX;
		this.spawnY = spawnY;
		this.isAI = isAI;
	}
}

module.exports = Legion;