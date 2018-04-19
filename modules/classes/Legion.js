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
		this.pixels = createPixels(x, y, helpers.legionCountToWidth(count), helpers.legionCountToWidth(count), count);
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

function createPixels(x, y, w, h, count) {

	let pixels = [];
	let num = count + c.PIXELS_NUM_MIN;

	for (let i = 0; i < num; i++) {
		let pixelX = Math.random() * (w - 2 * c.HULL_SPACE_PX) + x - w/2 + c.HULL_SPACE_PX;
		let pixelY = Math.random() * h + y - h/2;
		let pixelMoveDirectionX = Math.floor(Math.random() * 2);
		let pixelMoveDirectionY = Math.floor(Math.random() * 2);
		pixels.push([pixelX, pixelY, pixelMoveDirectionX, pixelMoveDirectionY]);
	}

	return pixels;
}

module.exports = Legion;