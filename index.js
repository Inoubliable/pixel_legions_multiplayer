var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuidv1 = require('uuid/v1');

var public = __dirname + '/public/';

app.use(express.static(public));

app.get('/', (req, res) => {
	//res.sendFile(path.join(public + 'login.html'));
	res.sendFile(path.join(public + 'game.html'));
});
app.post('/', (req, res) => {
	res.sendFile(path.join(public + 'game.html'));
});
app.get('/login', (req, res) => {
	res.sendFile(path.join(public + 'login.html'));
});
app.get('/win', (req, res) => {
	res.sendFile(path.join(public + 'win.html'));
});
app.get('/lose', (req, res) => {
	res.sendFile(path.join(public + 'lose.html'));
});

const KING_COUNT = 50;

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
	}
};

var allKings = [];
var allLegions = [];

var battleBeams = [];
var deadPixelsAnimations = [];

io.on('connection', onConnection);

function onConnection(socket) {

	if (allLegions.length == 0) {
		io.to(socket.id).emit('myId', 'me');

		allKings.push(new King('me', 350, 500, KING_COUNT, 'blue'));
		allLegions.push(new Legion('me', 400, 400, LEGION_COUNT, 'blue', false, 0, 0));
		allLegions.push(new Legion('me', 200, 500, LEGION_COUNT, 'blue', false, 0, 0));
		allKings.push(new King('enemy', 300, 120, KING_COUNT, 'red'));
		allLegions.push(new Legion('enemy', 300, 180, LEGION_COUNT, 'red', false, 0, 0));
		allLegions.push(new Legion('enemy', 460, 180, LEGION_COUNT, 'red', false, 0, 0));
	} else {
		io.to(socket.id).emit('myId', 'enemy');
	}

	socket.on('move', function(data){
		var playerId = data.playerId;
		var king = data.king;
		var legions = data.legions;

		if (legions.length > 0) {
			for (var i = 0; i < legions.length; i++){
				var foundLegion = allLegions.find(legion => legion.id == legions[i].id);
				if (foundLegion) {
					foundLegion.x = legions[i].x;
					foundLegion.y = legions[i].y;
					foundLegion.path = legions[i].path;
					foundLegion.pixels = legions[i].pixels.slice(0, foundLegion.pixels.length);
					foundLegion.spawning = legions[i].spawning;
				}
			}
		}
	});

	socket.on('myPing', function(){
		io.to(socket.id).emit('myPong', 'Pong');
	});

  	socket.on('disconnect', function(){
  		console.log('User disconnected');
		allKings = [];
		allLegions = [];
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
	io.emit('game update', {allKings: allKings, allLegions: allLegions, battleBeams: battleBeams, deadPixelsAnimations: deadPixelsAnimations});
	battleBeams = [];
	deadPixelsAnimations = [];
}, 1000/60);

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

	var pixels = [];
	var num = count + PIXELS_NUM_MIN;

	for (var i = 0; i < num; i++) {
		var pixelX = Math.random() * (w - 2 * HULL_SPACE_PX) + x - w/2 + HULL_SPACE_PX;
		var pixelY = Math.random() * h + y - h/2;
		var pixelMoveDirectionX = Math.floor(Math.random() * 2);
		var pixelMoveDirectionY = Math.floor(Math.random() * 2);
		pixels.push([pixelX, pixelY, pixelMoveDirectionX, pixelMoveDirectionY]);
	}

	return pixels;
}

function calculateHull(points, x, y) {
	var n = points.length;
    // There must be at least 3 points
    if (n < 3) return;
  
    // Initialize Result
    var hull = [];
  
    // Find the leftmost point
    var l = 0;
    var newArray = [];
    for (var i = 0; i < n; i++){
    	newArray.push([points[i][0], points[i][1]]);
		if (points[i][0] < points[l][0]) {
			l = i;
		}
	}
  
    // Start from leftmost point, keep moving 
    // counterclockwise until reach the start point
    // again. This loop runs O(h) times where h is
    // number of points in result or output.
    var p = l, q;
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
         
        for (var i = 0; i < n; i++) {
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
    var val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  
    if (val == 0) return 0;	// collinear
    return (val > 0) ? 1 : 2;	// clock or counterclock wise
}

function addDeadPixelAnimation(x, y) {
	var x1 = x;
	var y1 = y - PIXEL_SIZE_PX;
	var x2 = x + PIXEL_SIZE_PX;
	var y2 = y;
	var x3 = x;
	var y3 = y + PIXEL_SIZE_PX;
	var x4 = x - PIXEL_SIZE_PX;
	var y4 = y;
	deadPixelsAnimations.push([[x1, y1], [x2, y2], [x3, y3], [x4, y4]]);
}

// spawning my new legions
setInterval(function(){
	for (var i = 0; i < allKings.length; i++) {
		var king = allKings[i];

		var playerId = king.playerId;
		var startX = king.x;
		var startY = king.y;
		var color = king.spawnedColor;
		var spawnX = Math.random() * SPAWN_AREA_WIDTH + king.x - SPAWN_AREA_WIDTH/2;
		var spawnY = Math.random() * SPAWN_AREA_WIDTH + king.y - SPAWN_AREA_WIDTH/2;
		allLegions.push(new Legion(playerId, startX, startY, LEGION_COUNT, color, true, spawnX, spawnY));
	}
}, SPAWN_INTERVAL);

function battle() {
	for (var i = 0; i < allLegions.length; i++) {
		var legion1 = allLegions[i];
		for (var j = i+1; j < allLegions.length; j++) {
			var legion2 = allLegions[j];
			if (legion1.playerId != legion2.playerId) {

				// distance to legion
				var legionsDistanceX = Math.abs(legion2.x - legion1.x);
				var legionsDistanceY = Math.abs(legion2.y - legion1.y);

				if (legionsDistanceX < BATTLE_DISTANCE && legionsDistanceY < BATTLE_DISTANCE) {
					battleBeams.push([legion2.x, legion2.y, legion1.x, legion1.y]);
					legion2.count -= BATTLE_COUNT_LOSE;
					legion1.count -= BATTLE_COUNT_LOSE;

					// find nearby enemies position
					var enemyHalfWidth = legionCountToWidth(legion1.count) / 2;
					if (legionsDistanceX > enemyHalfWidth) {
						// is myLegion on the left or right of enemy
						if ((legion2.x - legion1.x) > 0) {
							pushIfNotIn(legion1.nearbyEnemies, 2);
							pushIfNotIn(legion2.nearbyEnemies, 4);
						} else {
							pushIfNotIn(legion1.nearbyEnemies, 4);
							pushIfNotIn(legion2.nearbyEnemies, 2);
						}
					}

					if (legionsDistanceY > enemyHalfWidth) {
						// is myLegion on the top or bottom of enemy
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
		for (var k = 0; k < allKings.length; k++) {
			if (allKings[k].playerId != legion1.playerId) {
				var kingDistanceX = Math.abs(allKings[k].x - legion1.x);
				var kingDistanceY = Math.abs(allKings[k].y - legion1.y);
	
				if (kingDistanceX < BATTLE_DISTANCE && kingDistanceY < BATTLE_DISTANCE) {				
					allKings[k].count -= BATTLE_COUNT_LOSE;
					legion1.count -= BATTLE_COUNT_LOSE;
				}
			}
		}

		// remove locations
		legion1.nearbyEnemies = [];

		// remove my dead pixels
		var deadPixelsCount = Math.floor(legion1.pixels.length - PIXELS_NUM_MIN - legion1.count);
		if (deadPixelsCount > 0) {
			for (var d = 0; d < deadPixelsCount; d++) {
				var deadPixel = legion1.pixels.pop();
				addDeadPixelAnimation(deadPixel[0], deadPixel[1]);
			}
			legion1.hull = calculateHull(legion1.pixels, legion1.x, legion1.y);
		}

	}

	// remove my dead legions
	for (var i = 0; i < allLegions.length; i++) {
		if (allLegions[i].count <= 0) {
			allLegions.splice(i, 1);
		}
	}
}

/********************************* AI FUNCTIONS **********************************/
/*
function AIDefenceAfterSpawnPath(legion) {

	var dxKings = myKing.x - enemyKing.x;
	var dyKings = myKing.y - enemyKing.y;
	var goToX = 0;
	var goToY = 0;
	if (dyKings > dxKings) {
		var kx = Math.floor(Math.random() * 300 - 150);
		var ky = Math.floor(Math.random() * 40 - 20);
		goToX = enemyKing.x + dxKings*0.2 + kx;
		goToY = enemyKing.y + dyKings*0.2 + ky;
	} else {
		var kx = Math.floor(Math.random() * 40 - 20);
		var ky = Math.floor(Math.random() * 300 - 150);
		goToX = enemyKing.x + dxKings*0.2 + kx;
		goToY = enemyKing.y + dyKings*0.2 + ky;
	}

	var dx = goToX - legion.x;
	var dy = goToY - legion.y;
	var distance = Math.sqrt(dx * dx + dy * dy);
	var repeat = Math.floor(distance / Math.sqrt(10));
	legion.AIPath = [[goToX, goToY]];
	for (var i = 0; i < repeat; i++) {
		var goTo = [legion.AIPath[0][0] - dx/repeat, legion.AIPath[0][1] - dy/repeat];
		legion.AIPath.unshift(goTo);
	}

}

function AIDefend(x, y) {
	if (enemyLegions.length > 0) {
		var defendersIndexes = [];
		var defendingNum = Math.ceil(enemyLegions.length/2);

		var defendingLegionsIndexes = [];
		for (var i = 0; i < enemyLegions.length; i++) {
			var dx = x - enemyLegions[i].x;
			var dy = y - enemyLegions[i].y;
			var distance = Math.sqrt(dx*dx + dy*dy);
			if (enemyLegions[i].defending || distance < BATTLE_DISTANCE) {
				defendingLegionsIndexes.push(i);
			}
		}

		var reinforcementsNum = defendingNum - defendingLegionsIndexes.length;
		if (reinforcementsNum > 0) {
			var index = 0;
			for (var i = 0; i < defendingNum; i++) {
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

	var ax = Math.random()*BATTLE_DISTANCE - BATTLE_DISTANCE/2;
	var ay = Math.random()*BATTLE_DISTANCE - BATTLE_DISTANCE/2;
	var goToX = x + ax;
	var goToY = y + ay;

	var dx = goToX - legion.x;
	var dy = goToY - legion.y;
	var distance = Math.sqrt(dx * dx + dy * dy);
	var repeat = Math.floor(distance / Math.sqrt(10));
	legion.AIPath = [[goToX, goToY]];
	for (var i = 0; i < repeat; i++) {
		var goTo = [legion.AIPath[0][0] - dx/repeat, legion.AIPath[0][1] - dy/repeat];
		legion.AIPath.unshift(goTo);
	}

}

function AIAttackCheck() {
	if (enemyLegions.length > 1 && enemyLegions.length > myLegions.length) {
		var index1 = Math.floor(Math.random() * enemyLegions.length);
		var index2 = Math.floor(Math.random() * enemyLegions.length);

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

	var a = Math.random()*BATTLE_DISTANCE;
	var goToX = myKing.x + a - BATTLE_DISTANCE/2;
	var goToY = myKing.y + a - BATTLE_DISTANCE/2;

	var dx = goToX - legion.x;
	var dy = goToY - legion.y;
	var distance = Math.sqrt(dx * dx + dy * dy);
	var repeat = Math.floor(distance / Math.sqrt(10));
	legion.AIPath = [[goToX, goToY]];
	for (var i = 0; i < repeat; i++) {
		var goTo = [legion.AIPath[0][0] - dx/repeat, legion.AIPath[0][1] - dy/repeat];
		legion.AIPath.unshift(goTo);
	}

}

function AIClearDefending() {
	for (var i = 0; i < enemyLegions.length; i++) {
		enemyLegions[i].defending = false;
	}
}

// AI loop
setInterval(function(){
	AIAttackCheck();
	AIClearDefending();
}, AI_LOOP_INTERVAL);
*/

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log('We are up on 3000');
});