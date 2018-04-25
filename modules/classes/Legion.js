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
		this.pixels = createPolygonPoints(x, y, helpers.legionCountToWidth(count)/2, count);
		this.hull = helpers.calculateHull(this.pixels, x, y);
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

class Point {

	constructor(x, y, isAnchor) {
		this.x = x;
		this.y = y;
		this.velocityX = 0;
		this.velocityY = 0;
		this.isAnchor = isAnchor || false;
	}
	
}

function createPolygonPoints(xCenter, yCenter, r, vertices) {

	let points = [];
	
	// anchor point in center
	points.push(new Point(xCenter, yCenter, true));

	for (var i = 0; i < vertices; i++) {
		let newX = r * Math.cos(2*Math.PI*i/vertices) + xCenter;
		let newY = r * Math.sin(2*Math.PI*i/vertices) + yCenter;

		newPoint = new Point(newX, newY);
		points.push(newPoint);
	}

	return points;
}

module.exports = Legion;