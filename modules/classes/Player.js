let uuidv1 = require('uuid/v1');

let c = require('../constants');
let helpers = require('../helpers');

let King = require('./King');
let Legion = require('./Legion');

class Player {


	constructor(id, name, rating, upgrades, coins, isAI) {
		this.id = id;
		this.name = name;
		this.rating = rating;
		this.upgrades = upgrades;
		this.coins = coins;
		this.isAI = isAI;
	}

	initiatePlayer(room, aggressiveness) {
	    let colorIndex = Math.floor(Math.random() * room.availableColors.length);
	    let color = room.availableColors[colorIndex];
	    room.availableColors.splice(colorIndex, 1);

	    let x, y, initialDx, initialDy, initialDistance;
	    let isTooClose = true;
	    while (isTooClose) {
	        x = Math.floor(Math.random() * c.PLAYFIELD_WIDTH);
	        y = Math.floor(Math.random() * c.PLAYFIELD_HEIGHT);
	        isTooClose = false;
	        for (let i = 0; i < room.allKings.length; i++) {
	            initialDx = room.allKings[i].x - x;
	            initialDy = room.allKings[i].y - y;
	            initialDistance = Math.sqrt(initialDx * initialDx + initialDy * initialDy);
	            if (initialDistance < (c.BATTLE_DISTANCE * 2)) {
	                isTooClose = true;
	                break;
	            }
	        }
	    }

		let kingCount = helpers.valueWithUpgrade(this.upgrades, c.ID_KING_HP, c.KING_BASE_COUNT);
		let kingAttack = helpers.valueWithUpgrade(this.upgrades, c.ID_KING_ATTACK, c.KING_BASE_ATTACK);

	    // initiate king
	    room.allKings.push(new King(this.id, x, y, kingCount, kingAttack, color, this.isAI));

	    // initiate legions
	    for (let i = 0; i < c.INITIAL_LEGIONS_NUM; i++) {

			let legionCount = helpers.valueWithUpgrade(this.upgrades, c.ID_LEGION_HP, c.LEGION_BASE_COUNT);
			let legionAttack = helpers.valueWithUpgrade(this.upgrades, c.ID_LEGION_BASE_ATTACK, c.LEGION_BASE_ATTACK);

	        let legionX = Math.random() * c.SPAWN_AREA_WIDTH + x - c.SPAWN_AREA_WIDTH/2;
	        let legionY = Math.random() * c.SPAWN_AREA_WIDTH + y - c.SPAWN_AREA_WIDTH/2;
	        let legW = helpers.legionCountToWidth(legionCount);

	        // check if it spawns over playfield border
	        while (!helpers.isInsidePlayfieldX(legionX, legW)) {
	            legionX = Math.random() * c.SPAWN_AREA_WIDTH + x - c.SPAWN_AREA_WIDTH/2;
	        }
	        while (!helpers.isInsidePlayfieldY(legionY, legW)) {
	            legionY = Math.random() * c.SPAWN_AREA_WIDTH + y - c.SPAWN_AREA_WIDTH/2;
	        }

	        room.allLegions.push(new Legion(this.id, legionX, legionY, legionCount, legionAttack, color, false, 0, 0, this.isAI));
	    }

	    this.aggressiveness = aggressiveness;
	}
}

module.exports = Player;