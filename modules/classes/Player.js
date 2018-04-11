let uuidv1 = require('uuid/v1');

let c = require('../constants');
let helpers = require('../helpers');

let King = require('./King');
let Legion = require('./Legion');

class Player {
	constructor(id, name, rating, upgrades, isAI) {
		this.id = id;
		this.name = name;
		this.rating = rating;
		this.upgrades = upgrades;
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

	    // initiate king
	    room.allKings.push(new King(this.id, x, y, c.KING_COUNT, color, this.isAI));

	    // initiate legions
	    for (let i = 0; i < c.INITIAL_LEGIONS_NUM; i++) {
	        let legionX = Math.random() * c.SPAWN_AREA_WIDTH + x - c.SPAWN_AREA_WIDTH/2;
	        let legionY = Math.random() * c.SPAWN_AREA_WIDTH + y - c.SPAWN_AREA_WIDTH/2;
	        let legW = helpers.legionCountToWidth(c.LEGION_COUNT);

	        // check if it spawns over playfield border
	        while (!helpers.isInsidePlayfieldX(legionX, legW)) {
	            legionX = Math.random() * c.SPAWN_AREA_WIDTH + x - c.SPAWN_AREA_WIDTH/2;
	        }
	        while (!helpers.isInsidePlayfieldY(legionY, legW)) {
	            legionY = Math.random() * c.SPAWN_AREA_WIDTH + y - c.SPAWN_AREA_WIDTH/2;
	        }

	        let legionAttack = (1 + this.upgrades['attack_legion']*0.01) * c.LEGION_ATTACK;
	        room.allLegions.push(new Legion(this.id, legionX, legionY, c.LEGION_COUNT, legionAttack, color, false, 0, 0, this.isAI));
	    }

	    this.aggressiveness = aggressiveness;
	}
}

module.exports = Player;