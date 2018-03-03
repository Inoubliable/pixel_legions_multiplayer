let uuidv1 = require('uuid/v1');

let c = require('../constants');
let helpers = require('../helpers');

let King = require('./King');
let Legion = require('./Legion');

class Player {
	constructor(name, rating, id) {
		this.id = id || uuidv1();
		this.name = name;
		this.rating = rating;
	}

	initiatePlayer(room, isAI, aggressiveness) {
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
	    room.allKings.push(new King(this.id, x, y, c.KING_COUNT, color, isAI));

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

	        room.allLegions.push(new Legion(this.id, legionX, legionY, c.LEGION_COUNT, color, false, 0, 0, isAI));
	    }

	    this.aggressiveness = aggressiveness;
	}
}

module.exports = Player;