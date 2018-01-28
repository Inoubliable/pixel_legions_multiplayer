let express = require('express');
let app = express();
let path = require('path');
let http = require('http').Server(app);
let io = require('socket.io')(http);
let uuidv1 = require('uuid/v1');

let public = __dirname + '/public/';

app.use(express.static(public));

app.get('/', (req, res) => {
	res.sendFile(path.join(public + 'login.html'));
});
app.get('/login', (req, res) => {
	res.sendFile(path.join(public + 'login.html'));
});
app.post('/login', (req, res) => {
	res.sendFile(path.join(public + 'waitingRoom.html'));
});
app.get('/waitingRoom', (req, res) => {
	res.sendFile(path.join(public + 'waitingRoom.html'));
});
app.get('/game', (req, res) => {
	res.sendFile(path.join(public + 'game.html'));
});
app.get('/gameOver', (req, res) => {
	res.sendFile(path.join(public + 'gameOver.html'));
});
app.get('/ranking', (req, res) => {
	res.json({ranking: ranking});
});

const MAX_LEGIONS = 15;

const STARTING_RATING = 1500;

const GAME_PLAYERS_NUM = 4;
const WAIT_TIME_BEFORE_AI_FILL = 2 * 1000;

const PLAYFIELD_WIDTH = 1000;
const PLAYFIELD_HEIGHT = 550;

const KING_COUNT = 50;
const KING_WIDTH = 30;

const INITIAL_LEGIONS_NUM = 2;
const LEGION_COUNT = 25;
const LEGION_COUNT_TO_WIDTH = 1.6;
const LEGION_MINIMAL_PX = 30;
const LEGION_OVER_BORDER = 0.2;

const PIXEL_SIZE_PX = 4;	// preferably even number
const PIXELS_NUM_MIN = 8;

const HULL_SPACE_PX = 10;

const AI_LOOP_INTERVAL = 2 * 1000;
const SPAWN_INTERVAL = 10 * 1000;
const SPAWN_ITERVAL_RANDOM_PART = 0.1;

const SPAWN_AREA_WIDTH = 200;

const BATTLE_COUNT_LOSE = 0.04;
const BATTLE_AMBUSH_COUNT_LOSE = 0.03;
const BATTLE_DISTANCE = 100;

const RATING_K = 26;	// rating change per place

const COLORS = {
	blue: {
		normal: 'rgba(76, 103, 214, 1)',
		selected: 'rgba(122, 143, 214, 1)'
	},
	red: {
		normal: 'rgba(248, 6, 42, 1)',
		selected: 'rgba(254, 76, 112, 1)'
	},
	green: {
		normal: 'rgba(37, 177, 42, 1)',
		selected: 'rgba(87, 217, 82, 1)'
	},
	orange: {
		normal: 'rgba(240, 100, 23, 1)',
		selected: 'rgba(254, 140, 63, 1)'
	},
	purple: {
		normal: 'rgba(178, 50, 194, 1)',
		selected: 'rgba(218, 90, 234, 1)'
	},
	yellow: {
		normal: 'rgba(244, 198, 28, 1)',
		selected: 'rgba(254, 238, 68, 1)'
	}
};
let colors = [];
for (let color in COLORS) {
	colors.push(color);
}

let allKings = [];
let allLegions = [];

let allPlayers = [];
let ranking = [];
for (let i = 0; i < GAME_PLAYERS_NUM; i++) {
	ranking.push({id: '', name: ''});
}
let AInames = ['DeepBlue', 'AlphaZero', 'TARS', 'R2D2', 'Unity'];

let waitingRoom = io.of('/waitingRoom');
waitingRoom.on('connection', waitingConnection);

let gameRoom = io.of('/game');
gameRoom.on('connection', gameConnection);

function waitingConnection(socket) {
	let playerName = socket.handshake.query.name;
	let playerId = socket.handshake.query.id || uuidv1();
	let playerRating = +socket.handshake.query.rating || STARTING_RATING;
	waitingRoom.to(socket.id).emit('myPlayer', {id: playerId, name: playerName, rating: playerRating});
	allPlayers.push({id: playerId, name: playerName, rating: playerRating});

	let humanPlayersCount = allPlayers.length;
	setTimeout(function() {
		if (humanPlayersCount == allPlayers.length) {
			fillWithAI(humanPlayersCount);

			if (allPlayers.length == GAME_PLAYERS_NUM) {
				waitingRoom.emit('start countdown', allPlayers);
			}
		}
	}, WAIT_TIME_BEFORE_AI_FILL);

	waitingRoom.emit('player joined', allPlayers);

	socket.on('disconnect', function() {
		let index = allPlayers.findIndex(function(player) {
			return player.id == playerId;
		});
		allPlayers.splice(index, 1);
		console.log('User disconnected');
	});
};

function fillWithAI(playerCount) {
	// generate AIs to fill the room
	for (let i = playerCount; i < GAME_PLAYERS_NUM; i++) {
		let AIindex = Math.floor((Math.random() * AInames.length));
		let AIid = uuidv1();
		allPlayers.push({id: AIid, name: AInames[AIindex], rating: STARTING_RATING});
		AInames.splice(AIindex, 1);
		initiatePlayer(AIid, true);
	}
}

function gameConnection(socket) {
	let playerId = socket.handshake.query.id;
	let playerName = socket.handshake.query.name;
	let playerRating = +socket.handshake.query.rating || STARTING_RATING;
	allPlayers.push({id: playerId, name: playerName, rating: playerRating});

	initiatePlayer(playerId, false);

	// create spawn loops for every player
	if (allPlayers.length == GAME_PLAYERS_NUM) {
		for (let i = 0; i < allPlayers.length; i++) {
			(function loop() {
				let spawnTimeout = SPAWN_INTERVAL + Math.round(Math.random() * SPAWN_INTERVAL * SPAWN_ITERVAL_RANDOM_PART);
				setTimeout(function() {
					let king = allKings.find(k => k.playerId == allPlayers[i].id);
	
					if (king) {
						if (!king.isUnderAttack) {
							let counter = 0;
							for (let j = 0; j < allLegions.length; j++) {
								if (allLegions[j].playerId == allPlayers[i].id) {
									counter++;
								}
							}
							if (counter < MAX_LEGIONS) {
								// spawn new legion
								let startX = king.x;
								let startY = king.y;
								let color = king.spawnedColor;
								let spawnX = Math.random() * SPAWN_AREA_WIDTH + king.x - SPAWN_AREA_WIDTH/2;
								let spawnY = Math.random() * SPAWN_AREA_WIDTH + king.y - SPAWN_AREA_WIDTH/2;
								let isAI = king.isAI;
								allLegions.push(new Legion(king.playerId, startX, startY, LEGION_COUNT, color, true, spawnX, spawnY, isAI));
							}
						}

						loop();
					}
					
				}, spawnTimeout);
			}());
		}
	}

	socket.on('move', function(data) {
		let playerId = data.playerId;
		let dataKing = data.king;
		let dataLegions = data.legions;

		let foundKing = allKings.find(king => king.id == dataKing.id);
		if (foundKing) {
			foundKing.x = dataKing.x;
			foundKing.y = dataKing.y;
			foundKing.path = dataKing.path;
		}

		if (dataLegions.length > 0) {
			for (let i = 0; i < dataLegions.length; i++) {
				let foundLegion = allLegions.find(legion => legion.id == dataLegions[i].id);
				if (foundLegion) {
					foundLegion.x = dataLegions[i].x;
					foundLegion.y = dataLegions[i].y;
					foundLegion.path = dataLegions[i].path;
					foundLegion.spawning = dataLegions[i].spawning;
				}
			}
		}
	});

	socket.on('myPing', function() {
		gameRoom.to(socket.id).emit('myPong', 'Pong');
	});

	socket.on('disconnect', function() {
		console.log('User disconnected');
	});
};

// game physics loop
setInterval(function() {
	if (allLegions.length > 0) {
		battle();
		moveAI();
	}
}, 1000/60);

// send game state loop
setInterval(function() {
	let gameUpdate = {allKings: allKings, allLegions: allLegions};
	gameRoom.emit('game update', gameUpdate);
}, 1000/60);

function initiatePlayer(playerId, isAI) {
	let colorIndex = Math.floor(Math.random() * colors.length);
	let color = colors[colorIndex];
	colors.splice(colorIndex, 1);

	let x, y, initialDx, initialDy, initialDistance;
	let isTooClose = true;
	while (isTooClose) {
		x = Math.floor(Math.random() * PLAYFIELD_WIDTH);
		y = Math.floor(Math.random() * PLAYFIELD_HEIGHT);
		isTooClose = false;
		for (let i = 0; i < allKings.length; i++) {
			initialDx = allKings[i].x - x;
			initialDy = allKings[i].y - y;
			initialDistance = Math.sqrt(initialDx * initialDx + initialDy * initialDy);
			if (initialDistance < (BATTLE_DISTANCE * 2)) {
				isTooClose = true;
				break;
			}
		}
	}

	// initiate king
	allKings.push(new King(playerId, x, y, KING_COUNT, color, isAI));

	// initiate legions
	for (let i = 0; i < INITIAL_LEGIONS_NUM; i++) {
		let legionX = Math.random() * SPAWN_AREA_WIDTH + x - SPAWN_AREA_WIDTH/2;
		let legionY = Math.random() * SPAWN_AREA_WIDTH + y - SPAWN_AREA_WIDTH/2;
		let legW = legionCountToWidth(LEGION_COUNT);

		// check if it spawns over playfield border
		while (!(legionX > (legW*LEGION_OVER_BORDER) && legionX < (PLAYFIELD_WIDTH - legW*LEGION_OVER_BORDER))) {
			legionX = Math.random() * SPAWN_AREA_WIDTH + x - SPAWN_AREA_WIDTH/2;
		}
		while (!(legionY > (legW*LEGION_OVER_BORDER) && legionY < (PLAYFIELD_HEIGHT - legW*LEGION_OVER_BORDER))) {
			legionY = Math.random() * SPAWN_AREA_WIDTH + y - SPAWN_AREA_WIDTH/2;
		}

		allLegions.push(new Legion(playerId, legionX, legionY, LEGION_COUNT, color, false, 0, 0, isAI));
	}
}

function Legion(playerId, x, y, count, color, spawning, spawnX, spawnY, isAI) {
	this.id = uuidv1();
	this.playerId = playerId;
	this.x = x;
	this.y = y;
	this.count = count;
	this.path = [];
	this.selected = false;
	this.move = false;
	this.pixels = createPixels(x, y, legionCountToWidth(count), legionCountToWidth(count), count);
	this.hull = calculateHull(this.pixels, x, y);
	this.nearbyEnemies = [];
	this.borderNormal = COLORS[color].normal;
	this.colorNormal = COLORS[color].normal.replace('1)', '0.5)');
	this.borderSelected = COLORS[color].selected;
	this.colorSelected = COLORS[color].selected.replace('1)', '0.5)');
	this.spawning = spawning;
	this.spawnX = spawnX;
	this.spawnY = spawnY;
	this.isAI = isAI;
}

function King(playerId, x, y, count, color, isAI) {
	this.id = uuidv1();
	this.playerId = playerId;
	this.x = x;
	this.y = y;
	this.count = count;
	this.path = [];
	this.selected = false;
	this.move = false;
	this.color = COLORS[color].normal;
	this.spawnedColor = color;
	this.isAI = isAI;
	this.isUnderAttack = false;
}

function legionCountToWidth(count) {
	return count * LEGION_COUNT_TO_WIDTH + LEGION_MINIMAL_PX;
}

function createPixels(x, y, w, h, count) {

	let pixels = [];
	let num = count + PIXELS_NUM_MIN;

	for (let i = 0; i < num; i++) {
		let pixelX = Math.random() * (w - 2 * HULL_SPACE_PX) + x - w/2 + HULL_SPACE_PX;
		let pixelY = Math.random() * h + y - h/2;
		let pixelMoveDirectionX = Math.floor(Math.random() * 2);
		let pixelMoveDirectionY = Math.floor(Math.random() * 2);
		pixels.push([pixelX, pixelY, pixelMoveDirectionX, pixelMoveDirectionY]);
	}

	return pixels;
}

function calculateHull(points, x, y) {
	let n = points.length;
    // There must be at least 3 points
    if (n < 3) return;
  
    // Initialize Result
    let hull = [];
  
    // Find the leftmost point
    let l = 0;
    let newArray = [];
    for (let i = 0; i < n; i++) {
    	newArray.push([points[i][0], points[i][1]]);
		if (points[i][0] < points[l][0]) {
			l = i;
		}
	}
  
    // Start from leftmost point, keep moving 
    // counterclockwise until reach the start point
    // again. This loop runs O(h) times where h is
    // number of points in result or output.
    let p = l, q;
    do {
    	// Move point outwards
        if (newArray[p][0] > x) {
        	newArray[p][0] += HULL_SPACE_PX;
        } else if (newArray[p][0] < x) {
        	newArray[p][0] -= HULL_SPACE_PX;
        }
        if (newArray[p][1] > y) {
        	newArray[p][1] += HULL_SPACE_PX;
        } else if (newArray[p][1] < y) {
        	newArray[p][1] -= HULL_SPACE_PX;
        }
        // Add current point to result
        hull.push(newArray[p]);
  
        // Search for a point 'q' such that 
        // orientation(p, x, q) is counterclockwise 
        // for all points 'x'. The idea is to keep 
        // track of last visited most counterclock-
        // wise point in q. If any point 'i' is more 
        // counterclock-wise than q, then update q.
        q = (p + 1) % n;
         
        for (let i = 0; i < n; i++) {
			// If i is more counterclockwise than 
			// current q, then update q
			if (orientation(points[p], points[i], points[q]) == 2) {
				q = i;
			}
        }
  
        // Now q is the most counterclockwise with
        // respect to p. Set p as q for next iteration, 
        // so that q is added to result 'hull'
        p = q;
  
    } while (p != l);  // While we don't come to first point
    hull.push(hull[0]);

    return hull;
}

function orientation(p, q, r) {
    let val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  
    if (val == 0) return 0;	// collinear
    return (val > 0) ? 1 : 2;	// clock or counterclock wise
}

function battle() {
	let deadPlayersIds = [];
	for (let i = 0; i < allLegions.length; i++) {
		let legion1 = allLegions[i];
		for (let j = i+1; j < allLegions.length; j++) {
			let legion2 = allLegions[j];
			if (legion1.playerId != legion2.playerId) {

				// distance to legion
				let legionsDistanceX = Math.abs(legion2.x - legion1.x);
				let legionsDistanceY = Math.abs(legion2.y - legion1.y);

				if (legionsDistanceX < BATTLE_DISTANCE && legionsDistanceY < BATTLE_DISTANCE) {
					legion2.count -= BATTLE_COUNT_LOSE;
					legion1.count -= BATTLE_COUNT_LOSE;

					// find nearby enemies position
					let enemyHalfWidth = legionCountToWidth(legion1.count) / 2;
					if (legionsDistanceX > enemyHalfWidth) {
						// is legion on the left or right of enemy
						if ((legion2.x - legion1.x) > 0) {
							pushIfNotIn(legion1.nearbyEnemies, 2);
							pushIfNotIn(legion2.nearbyEnemies, 4);
						} else {
							pushIfNotIn(legion1.nearbyEnemies, 4);
							pushIfNotIn(legion2.nearbyEnemies, 2);
						}
					}

					if (legionsDistanceY > enemyHalfWidth) {
						// is legion on the top or bottom of enemy
						if ((legion2.y - legion1.y) > 0) {
							pushIfNotIn(legion1.nearbyEnemies, 3);
							pushIfNotIn(legion2.nearbyEnemies, 1);
						} else {
							pushIfNotIn(legion1.nearbyEnemies, 1);
							pushIfNotIn(legion2.nearbyEnemies, 3);
						}
					}

					function pushIfNotIn(array, value) {
						if (array.indexOf(value) == -1) {
							array.push(value);
						}
					}

					// check for ambush
					if (legion1.nearbyEnemies.indexOf(2) != -1 && legion1.nearbyEnemies.indexOf(4) != -1) {
						legion1.count -= BATTLE_AMBUSH_COUNT_LOSE;
					}
					if (legion1.nearbyEnemies.indexOf(1) != -1 && legion1.nearbyEnemies.indexOf(3) != -1) {
						legion1.count -= BATTLE_AMBUSH_COUNT_LOSE;
					}

					if (legion2.nearbyEnemies.indexOf(2) != -1 && legion2.nearbyEnemies.indexOf(4) != -1) {
						legion2.count -= BATTLE_AMBUSH_COUNT_LOSE;
					}
					if (legion2.nearbyEnemies.indexOf(1) != -1 && legion2.nearbyEnemies.indexOf(3) != -1) {
						legion2.count -= BATTLE_AMBUSH_COUNT_LOSE;
					}
				}
			}
		}

		// battle with king
		for (let k = allKings.length-1; k >= 0; k--) {
			if (i == 0) {
				allKings[k].isUnderAttack = false;
			}
			if (allKings[k].playerId != legion1.playerId) {
				let kingDistanceX = Math.abs(allKings[k].x - legion1.x);
				let kingDistanceY = Math.abs(allKings[k].y - legion1.y);
	
				if (kingDistanceX < BATTLE_DISTANCE && kingDistanceY < BATTLE_DISTANCE) {
					allKings[k].count -= BATTLE_COUNT_LOSE;
					legion1.count -= BATTLE_COUNT_LOSE;

					if (allKings[k].isAI) {
						// get legions to defend
						AIDefend(allKings[k].playerId, legion1.x, legion1.y);
					}

					allKings[k].isUnderAttack = true;
				}

				if (allKings[k].count <= 0) {
					let deadPlayerId = allKings[k].playerId;
					deadPlayersIds.push(deadPlayerId);
					allKings.splice(k, 1);

					// rank the player
					for (let i = ranking.length-1; i >= 0; i--) {
						if (ranking[i].id == '') {
							ranking[i] = allPlayers.find(p => p.id == deadPlayerId);
							ranking[i].newRating = calculateRating(ranking[i].rating, i+1);

							// check if only one player is still alive
							if (ranking[1].id != '') {
								let winnerKing = allKings.find(k => k.count > 0);
								ranking[0] = allPlayers.find(p => p.id == winnerKing.playerId);
								ranking[0].newRating = calculateRating(ranking[0].rating, 1);
							}
							break;
						}
					}
				}
			}
		}

		// remove locations
		legion1.nearbyEnemies = [];

	}

	// remove dead legions
	for (let i = allLegions.length-1; i >= 0; i--) {
		if ((allLegions[i].count <= 0) || (deadPlayersIds.indexOf(allLegions[i].playerId) > -1)) {
			allLegions.splice(i, 1);
		}
	}
}


/********************************* AI FUNCTIONS **********************************/
/*
function AIDefenceAfterSpawnPath(legion) {

	let dxKings = myKing.x - enemyKing.x;
	let dyKings = myKing.y - enemyKing.y;
	let goToX = 0;
	let goToY = 0;
	if (dyKings > dxKings) {
		let kx = Math.floor(Math.random() * 300 - 150);
		let ky = Math.floor(Math.random() * 40 - 20);
		goToX = enemyKing.x + dxKings*0.2 + kx;
		goToY = enemyKing.y + dyKings*0.2 + ky;
	} else {
		let kx = Math.floor(Math.random() * 40 - 20);
		let ky = Math.floor(Math.random() * 300 - 150);
		goToX = enemyKing.x + dxKings*0.2 + kx;
		goToY = enemyKing.y + dyKings*0.2 + ky;
	}

	let dx = goToX - legion.x;
	let dy = goToY - legion.y;
	let distance = Math.sqrt(dx * dx + dy * dy);
	let repeat = Math.floor(distance / Math.sqrt(10));
	legion.AIPath = [[goToX, goToY]];
	for (let i = 0; i < repeat; i++) {
		let goTo = [legion.AIPath[0][0] - dx/repeat, legion.AIPath[0][1] - dy/repeat];
		legion.AIPath.unshift(goTo);
	}

}
*/

function AIAttackCheck() {
	let checkedPlayers = [];
	for (let i = 0; i < allLegions.length; i++) {
		if (allLegions[i].isAI && (checkedPlayers.indexOf(allLegions[i].playerId) == -1)) {
			checkedPlayers.push(allLegions[i].playerId);
			let playersLegions = [];
			for (let j = 0; j < allLegions.length; j++) {
				if (allLegions[j].playerId == allLegions[i].playerId) {
					playersLegions.push(j);
				}
			}

			if (playersLegions.length > 4) {
				let index1 = Math.floor(Math.random() * playersLegions.length);
				let index2 = Math.floor(Math.random() * playersLegions.length);

				while (index2 == index1) {
					index2 = Math.floor(Math.random() * playersLegions.length);
				}

				let AIlegion1 = allLegions[playersLegions[index1]];
				let AIlegion2 = allLegions[playersLegions[index2]];
				if (!AIlegion1.spawning) {
					AIAttackPath(AIlegion1);
				}
				if (!AIlegion2.spawning) {
					AIAttackPath(AIlegion2);
				}
			}
		}
	}
}

function AIAttackPath(legion) {

	// attack random king
	let kingIndex = Math.floor(Math.random() * allKings.length);
	while (allKings[kingIndex].playerId == legion.playerId) {
		kingIndex = Math.floor(Math.random() * allKings.length);
	}

	let a = Math.random() * BATTLE_DISTANCE;
	let goToX = allKings[kingIndex].x + a - BATTLE_DISTANCE/2;
	let goToY = allKings[kingIndex].y + a - BATTLE_DISTANCE/2;

	let dx = goToX - legion.x;
	let dy = goToY - legion.y;
	let distance = Math.sqrt(dx * dx + dy * dy);
	let repeat = Math.floor(distance / Math.sqrt(10));
	legion.AIPath = [[goToX, goToY]];
	for (let i = 0; i < repeat; i++) {
		let goTo = [legion.AIPath[0][0] - dx/repeat, legion.AIPath[0][1] - dy/repeat];
		legion.AIPath.unshift(goTo);
	}

}

function AIDefend(playerId, x, y) {
	let playersLegions = [];
	for (let i = 0; i < allLegions.length; i++) {
		if (allLegions[i].playerId == playerId) {
			playersLegions.push(allLegions[i]);
		}
	}

	if (playersLegions.length > 0) {
		let defendersIndexes = [];
		let defendingNum = Math.ceil(playersLegions.length/2);

		let defendingLegionsIndexes = [];
		for (let i = 0; i < playersLegions.length; i++) {
			let dx = x - playersLegions[i].x;
			let dy = y - playersLegions[i].y;
			let distance = Math.sqrt(dx*dx + dy*dy);
			if (playersLegions[i].defending || distance < BATTLE_DISTANCE) {
				defendingLegionsIndexes.push(i);
			}
		}

		let reinforcementsNum = defendingNum - defendingLegionsIndexes.length;
		if (reinforcementsNum > 0) {
			let index = 0;
			for (let i = 0; i < defendingNum; i++) {
				while (defendingLegionsIndexes.indexOf(index) != -1 && defendersIndexes.indexOf(index) != -1) {
					index = Math.floor(Math.random() * playersLegions.length);
				}
				defendersIndexes.push(index);
				playersLegions[index].defending = true;

				AIDefendPath(playersLegions[index], x, y);
			}
		}
	}
}

function AIDefendPath(legion, x, y) {

	let ax = Math.random()*BATTLE_DISTANCE - BATTLE_DISTANCE/2;
	let ay = Math.random()*BATTLE_DISTANCE - BATTLE_DISTANCE/2;
	let goToX = x + ax;
	let goToY = y + ay;

	let dx = goToX - legion.x;
	let dy = goToY - legion.y;
	let distance = Math.sqrt(dx * dx + dy * dy);
	let repeat = Math.floor(distance / Math.sqrt(10));
	legion.AIPath = [[goToX, goToY]];
	for (let i = 0; i < repeat; i++) {
		let goTo = [legion.AIPath[0][0] - dx/repeat, legion.AIPath[0][1] - dy/repeat];
		legion.AIPath.unshift(goTo);
	}

}

function AIClearDefending() {
	for (let i = 0; i < allLegions.length; i++) {
		allLegions[i].defending = false;
	}
}

function moveAI() {
	for (let i = 0; i < allLegions.length; i++) {
		// move spawning legions
		let legW = legionCountToWidth(allLegions[i].count);
		let legH = legionCountToWidth(allLegions[i].count);

		if (allLegions[i].isAI && allLegions[i].spawning) {
			let pathPart = 0.06;
			let minD = 0.07;
			let dx = (allLegions[i].spawnX - allLegions[i].x) * pathPart;
			let dy = (allLegions[i].spawnY - allLegions[i].y) * pathPart;

			if (Math.abs(dx) > minD && Math.abs(dy) > minD) {
				let newX = allLegions[i].x + dx;
				let newY = allLegions[i].y + dy;

				// check if it gets over playfield border
				if (newX > (legW*LEGION_OVER_BORDER) && newX < (PLAYFIELD_WIDTH - legW*LEGION_OVER_BORDER)) {
					allLegions[i].x = newX;
				}
				if (newY > (legH*LEGION_OVER_BORDER) && newY < (PLAYFIELD_HEIGHT - legH*LEGION_OVER_BORDER)) {
					allLegions[i].y = newY;
				}
			} else {
				allLegions[i].spawning = false;
			}
		}

		if (allLegions[i].AIPath && allLegions[i].AIPath.length > 0) {
			let pos = allLegions[i].AIPath.shift();

			// check if it gets over playfield border
			if (pos[0] > (legW*LEGION_OVER_BORDER) && pos[0] < (PLAYFIELD_WIDTH - legW*LEGION_OVER_BORDER)) {
				allLegions[i].x = pos[0];
			}
			if (pos[1] > (legH*LEGION_OVER_BORDER) && pos[1] < (PLAYFIELD_HEIGHT - legH*LEGION_OVER_BORDER)) {
				allLegions[i].y = pos[1];
			}
		}
	}
}

// AI loop
setInterval(function() {
	AIClearDefending();
	AIAttackCheck();
}, AI_LOOP_INTERVAL);

function calculateRating(rating, place) {
	let avgPlace = (GAME_PLAYERS_NUM + 1) / 2;
	let totalRating = allPlayers.reduce((total, player) => total + player.rating, 0);
	let avgRating = totalRating / allPlayers.length;
	let expectedPlace = avgPlace + (avgRating - rating) / 100;
	let placeDifference = expectedPlace - place;
	let newRating = Math.floor(rating + placeDifference*RATING_K);

	return newRating;
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log('We are up on 3000');
});