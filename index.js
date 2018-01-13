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
app.get('/win', (req, res) => {
	res.sendFile(path.join(public + 'win.html'));
});
app.get('/lose', (req, res) => {
	res.sendFile(path.join(public + 'lose.html'));
});


const PLAYFIELD_WIDTH = 600;
const PLAYFIELD_HEIGHT = 500;

const KING_COUNT = 40;

const LEGION_COUNT = 25;
const LEGION_COUNT_TO_WIDTH = 1.6;
const LEGION_MINIMAL_PX = 30;

const PIXEL_SIZE_PX = 4;	// preferably even number
const PIXELS_NUM_MIN = 8;

const HULL_SPACE_PX = 10;

const AI_LOOP_INTERVAL = 2 * 1000;
const SPAWN_INTERVAL = 10 * 1000;

const SPAWN_AREA_WIDTH = 200;

const BATTLE_COUNT_LOSE = 0.04;
const BATTLE_AMBUSH_COUNT_LOSE = 0.03;
const BATTLE_DISTANCE = 100;

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
	}
};
let colors = [];
for (let color in COLORS) {
	colors.push(color);
}

let allKings = [];
let allLegions = [];

let allPlayers = [];

let waitingRoom = io.of('/waitingRoom');
waitingRoom.on('connection', waitingConnection);

let gameRoom = io.of('/game');
gameRoom.on('connection', gameConnection);

function waitingConnection(socket) {
	let name = socket.handshake.query.name;
	allPlayers.push(name);
	waitingRoom.emit('player joined', allPlayers);

	if (allPlayers.length > 2) {
		setTimeout(function() {
			waitingRoom.emit('start game', allPlayers);
		}, 2000);
	}

  	socket.on('disconnect', function() {
  		let index = allPlayers.indexOf(name);
  		allPlayers.splice(index, 1);
  		console.log('User disconnected');
  	});
};

function gameConnection(socket) {
	let playerId = uuidv1();
	gameRoom.to(socket.id).emit('myId', playerId);

	let colorIndex = Math.floor(Math.random() * colors.length);
	let color = colors[colorIndex];
	colors.splice(colorIndex, 1);

	let initialX, initialY, initialDx, initialDy, initialDistance;
	let isTooClose = true;
	while (isTooClose) {
		initialX = Math.floor(Math.random() * PLAYFIELD_WIDTH) + 60;
		initialY = Math.floor(Math.random() * PLAYFIELD_HEIGHT) + 60;
		isTooClose = false;
		for (let i = 0; i < allKings.length; i++) {
			initialDx = allKings[i].x - initialX;
			initialDy = allKings[i].y - initialY;
			initialDistance = Math.sqrt(initialDx * initialDx + initialDy * initialDy);
			if (initialDistance < (BATTLE_DISTANCE + 70)) {
				isTooClose = true;
				break;
			}
		}
	}

	initiatePlayer(playerId, initialX, initialY, color, 2);

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
  		colors.push(color);
  	});
};

// game physics loop
setInterval(function() {
	if (allLegions.length > 0) {
		battle();
	}
}, 1000/60);

// send game state loop
setInterval(function() {
	let gameUpdate = {allKings: allKings, allLegions: allLegions};
	gameRoom.emit('game update', gameUpdate);
}, 1000/60);

function initiatePlayer(name, x, y, color, numOfLegions) {
	// TODO: is it AI or human?
	// initiate king
	allKings.push(new King(name, x, y, KING_COUNT, color));

	// initiate legions
	for (let i = 0; i < numOfLegions; i++) {
		let legionX = Math.random() * SPAWN_AREA_WIDTH + x - SPAWN_AREA_WIDTH/2;
		let legionY = Math.random() * SPAWN_AREA_WIDTH + y - SPAWN_AREA_WIDTH/2;
		allLegions.push(new Legion(name, legionX, legionY, LEGION_COUNT, color, false, 0, 0));
	}
}

function Legion(playerId, x, y, count, color, spawning, spawnX, spawnY) {
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
}

function King(playerId, x, y, count, color) {
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

// spawning new legions
setInterval(function() {
	for (let i = 0; i < allKings.length; i++) {
		let king = allKings[i];

		let playerId = king.playerId;
		let startX = king.x;
		let startY = king.y;
		let color = king.spawnedColor;
		let spawnX = Math.random() * SPAWN_AREA_WIDTH + king.x - SPAWN_AREA_WIDTH/2;
		let spawnY = Math.random() * SPAWN_AREA_WIDTH + king.y - SPAWN_AREA_WIDTH/2;
		allLegions.push(new Legion(playerId, startX, startY, LEGION_COUNT, color, true, spawnX, spawnY));
	}
}, SPAWN_INTERVAL);

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
			if (allKings[k].playerId != legion1.playerId) {
				let kingDistanceX = Math.abs(allKings[k].x - legion1.x);
				let kingDistanceY = Math.abs(allKings[k].y - legion1.y);
	
				if (kingDistanceX < BATTLE_DISTANCE && kingDistanceY < BATTLE_DISTANCE) {				
					allKings[k].count -= BATTLE_COUNT_LOSE;
					legion1.count -= BATTLE_COUNT_LOSE;
				}

				if (allKings[k].count <= 0) {
					deadPlayersIds.push(allKings[k].playerId);
					allKings.splice(k, 1);
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

function AIDefend(x, y) {
	if (enemyLegions.length > 0) {
		let defendersIndexes = [];
		let defendingNum = Math.ceil(enemyLegions.length/2);

		let defendingLegionsIndexes = [];
		for (let i = 0; i < enemyLegions.length; i++) {
			let dx = x - enemyLegions[i].x;
			let dy = y - enemyLegions[i].y;
			let distance = Math.sqrt(dx*dx + dy*dy);
			if (enemyLegions[i].defending || distance < BATTLE_DISTANCE) {
				defendingLegionsIndexes.push(i);
			}
		}

		let reinforcementsNum = defendingNum - defendingLegionsIndexes.length;
		if (reinforcementsNum > 0) {
			let index = 0;
			for (let i = 0; i < defendingNum; i++) {
				while (defendingLegionsIndexes.indexOf(index) != -1 && defendersIndexes.indexOf(index) != -1) {
					index = Math.floor(Math.random() * enemyLegions.length);
				}
				defendersIndexes.push(index);
				enemyLegions[index].defending = true;

				AIDefendPath(enemyLegions[index], x, y);
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

function AIAttackCheck() {
	if (enemyLegions.length > 1 && enemyLegions.length > myLegions.length) {
		let index1 = Math.floor(Math.random() * enemyLegions.length);
		let index2 = Math.floor(Math.random() * enemyLegions.length);

		do {
			index2 = Math.floor(Math.random() * enemyLegions.length);
		} while (index2 == index1)

		if (!enemyLegions[index1].spawning) {
			AIAttackPath(enemyLegions[index1]);
		}
		if (!enemyLegions[index2].spawning) {
			AIAttackPath(enemyLegions[index2]);
		}
	}
}

function AIAttackPath(legion) {

	let a = Math.random()*BATTLE_DISTANCE;
	let goToX = myKing.x + a - BATTLE_DISTANCE/2;
	let goToY = myKing.y + a - BATTLE_DISTANCE/2;

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
	for (let i = 0; i < enemyLegions.length; i++) {
		enemyLegions[i].defending = false;
	}
}

// AI loop
setInterval(function() {
	AIAttackCheck();
	AIClearDefending();
}, AI_LOOP_INTERVAL);
*/

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log('We are up on 3000');
});