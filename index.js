var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

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
const SPAWN_INTERVAL = 100 * 1000;

const SPAWN_AREA_WIDTH = 200;

const BATTLE_COUNT_LOSE = 0.04;
const BATTLE_AMBUSH_COUNT_LOSE = 0.03;
const BATTLE_DISTANCE = 100;

var allPlayers = [];

var battleBeams = [];
var deadPixelsAnimations = [];

io.on('connection', onConnection);

function onConnection(socket) {

	if (allPlayers.length == 0) {
		io.to(socket.id).emit('myId', 'me');
	} else {
		io.to(socket.id).emit('myId', 'enemy');
	}

	allPlayers.push({
		id: 'me',
		king: new King(350, 500, KING_COUNT),
		legions: [
			new Legion(400, 400, LEGION_COUNT, 'rgba(76, 103, 214, 1)', 'rgba(122, 143, 214, 1)'),
			new Legion(200, 500, LEGION_COUNT, 'rgba(76, 103, 214, 1)', 'rgba(122, 143, 214, 1)')
		]
	});
	allPlayers.push({
		id: 'enemy',
		king: new King(300, 120, KING_COUNT),
		legions: [
			new Legion(300, 180, LEGION_COUNT, 'rgba(248, 6, 42, 1)', 'rgba(254, 46, 82, 1)'),
			new Legion(460, 180, LEGION_COUNT, 'rgba(248, 6, 42, 1)', 'rgba(254, 46, 82, 1)')
		]
	});

	socket.on('move', function(data){
		var id = data.id;
		var king = data.king;
		var legions = data.legions;

		if (legions.length > 0) {
			for (var i = 0; i < allPlayers.length; i++){
				if (allPlayers[i].id == data.id) {
					allPlayers[i] = {
						id: id,
						king: king,
						legions: legions
					};
				}
			}
		}
	});

	socket.on('myPing', function(){
		io.to(socket.id).emit('myPong', 'Pong');
	});

  	socket.on('disconnect', function(){
  		console.log('User disconnected');
		allPlayers = [];
  	});
};

// game physics loop
setInterval(function() {
	if (allPlayers.length > 0) {
		battle();
	}
}, 1000/60);

// send game state loop
setInterval(function() {
	io.emit('game update', {allPlayers: allPlayers, battleBeams: battleBeams, deadPixelsAnimations: deadPixelsAnimations});
	battleBeams = [];
	deadPixelsAnimations = [];
}, 1000/60);

function Legion(x, y, count, colorNormal, colorSelected) {
	this.x = x;
	this.y = y;
	this.count = count;
	this.path = [];
	this.selected = false;
	this.move = false;
	this.pixels = createPixels(x, y, legionCountToWidth(count), legionCountToWidth(count), count);
	this.hull = calculateHull(this.pixels, x, y);
	this.nearbyEnemies = [];
	this.borderNormal = colorNormal;
	this.colorNormal = colorNormal.replace('1)', '0.5)');
	this.borderSelected = colorSelected;
	this.colorSelected = colorSelected.replace('1)', '0.5)');
}

function King(x, y, count) {
	this.x = x;
	this.y = y;
	this.count = count;
	this.path = [];
	this.selected = false;
	this.move = false;
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
	for (var i = 0; i < allPlayers.length; i++) {
		var king = allPlayers[i].king;
		var startX = king.x;
		var startY = king.y;
		var spawnX = Math.random() * SPAWN_AREA_WIDTH + king.x - SPAWN_AREA_WIDTH/2;
		var spawnY = Math.random() * SPAWN_AREA_WIDTH + king.y - SPAWN_AREA_WIDTH/2;
		var spawnCount = LEGION_COUNT;
		var spawnPath = [];
		var spawnSelected = false;
		var spawnMove = false;
		var spawnPixels = createPixels(startX, startY, legionCountToWidth(spawnCount), legionCountToWidth(spawnCount), spawnCount);
		var spawnHull = calculateHull(spawnPixels, startX, startY);
		var spawnNearbyEnemies = [];
		allPlayers[i].legions.push({
			x: startX,
			y: startY,
			count: spawnCount,
			path: spawnPath,
			selected: spawnSelected,
			move: spawnMove,
			pixels: spawnPixels,
			hull: spawnHull,
			nearbyEnemies: spawnNearbyEnemies,
			spawning: true,
			spawnX: spawnX,
			spawnY: spawnY
		});
	}
}, SPAWN_INTERVAL);

function battle() {
	var myKing = allPlayers[0].king;
	var enemyKing = allPlayers[1].king;
	var myLegions = allPlayers[0].legions;
	var enemyLegions = allPlayers[1].legions;
	for (var i = 0; i < enemyLegions.length; i++) {
		for (var j = 0; j < myLegions.length; j++) {

			if (i == 0) {
				myLegions[j].nearbyEnemies = [];

				// distance to enemy king
				var kingDistanceX = Math.abs(enemyKing.x - myLegions[j].x);
				var kingDistanceY = Math.abs(enemyKing.y - myLegions[j].y);

				if (kingDistanceX < BATTLE_DISTANCE && kingDistanceY < BATTLE_DISTANCE) {
					//AIDefend(myLegions[j].x, myLegions[j].y);

					enemyKing.count -= BATTLE_COUNT_LOSE;
					myLegions[j].count -= BATTLE_COUNT_LOSE;
					if (enemyKing.count <= 0) {
						win();
					}
				}
			}

			// distance to legion
			var legionsDistanceX = Math.abs(myLegions[j].x - enemyLegions[i].x);
			var legionsDistanceY = Math.abs(myLegions[j].y - enemyLegions[i].y);

			if (legionsDistanceX < BATTLE_DISTANCE && legionsDistanceY < BATTLE_DISTANCE) {
				battleBeams.push([myLegions[j].x, myLegions[j].y, enemyLegions[i].x, enemyLegions[i].y]);
				myLegions[j].count -= BATTLE_COUNT_LOSE;
				enemyLegions[i].count -= BATTLE_COUNT_LOSE;

				// find nearby enemies position
				var enemyHalfWidth = legionCountToWidth(enemyLegions[i].count) / 2;
				if (legionsDistanceX > enemyHalfWidth) {
					// is myLegion on the left or right of enemy
					if ((myLegions[j].x - enemyLegions[i].x) > 0) {
						pushIfNotIn(enemyLegions[i].nearbyEnemies, 2);
						pushIfNotIn(myLegions[j].nearbyEnemies, 4);
					} else {
						pushIfNotIn(enemyLegions[i].nearbyEnemies, 4);
						pushIfNotIn(myLegions[j].nearbyEnemies, 2);
					}
				}

				if (legionsDistanceY > enemyHalfWidth) {
					// is myLegion on the top or bottom of enemy
					if ((myLegions[j].y - enemyLegions[i].y) > 0) {
						pushIfNotIn(enemyLegions[i].nearbyEnemies, 3);
						pushIfNotIn(myLegions[j].nearbyEnemies, 1);
					} else {
						pushIfNotIn(enemyLegions[i].nearbyEnemies, 1);
						pushIfNotIn(myLegions[j].nearbyEnemies, 3);
					}
				}

				function pushIfNotIn(array, value) {
					if (array.indexOf(value) == -1) {
						array.push(value);
					}
				}

				// check for ambush
				if (enemyLegions[i].nearbyEnemies.indexOf(2) != -1 && enemyLegions[i].nearbyEnemies.indexOf(4) != -1) {
					enemyLegions[i].count -= BATTLE_AMBUSH_COUNT_LOSE;
				}
				if (enemyLegions[i].nearbyEnemies.indexOf(1) != -1 && enemyLegions[i].nearbyEnemies.indexOf(3) != -1) {
					enemyLegions[i].count -= BATTLE_AMBUSH_COUNT_LOSE;
				}

				if (myLegions[j].nearbyEnemies.indexOf(2) != -1 && myLegions[j].nearbyEnemies.indexOf(4) != -1) {
					myLegions[j].count -= BATTLE_AMBUSH_COUNT_LOSE;
				}
				if (myLegions[j].nearbyEnemies.indexOf(1) != -1 && myLegions[j].nearbyEnemies.indexOf(3) != -1) {
					myLegions[j].count -= BATTLE_AMBUSH_COUNT_LOSE;
				}
			}

			// remove my dead pixels
			var deadPixelsCount = Math.floor(myLegions[j].pixels.length - PIXELS_NUM_MIN - myLegions[j].count);
			if (deadPixelsCount > 0) {
				for (var d = 0; d < deadPixelsCount; d++) {
					var deadPixel = myLegions[j].pixels.pop();
					addDeadPixelAnimation(deadPixel[0], deadPixel[1]);
				}
				myLegions[j].hull = calculateHull(myLegions[j].pixels, myLegions[j].x, myLegions[j].y);
			}
		}

		// distance to my king
		var kingDistanceX = Math.abs(myKing.x - enemyLegions[i].x);
		var kingDistanceY = Math.abs(myKing.y - enemyLegions[i].y);

		if (kingDistanceX < BATTLE_DISTANCE && kingDistanceY < BATTLE_DISTANCE) {				
			myKing.count -= BATTLE_COUNT_LOSE;
			enemyLegions[i].count -= BATTLE_COUNT_LOSE;
			if (myKing.count <= 0) {
				lose();
			}
		}

		// remove locations
		enemyLegions[i].nearbyEnemies = [];

		// remove my dead pixels
		var deadPixelsCount = Math.floor(enemyLegions[i].pixels.length - PIXELS_NUM_MIN - enemyLegions[i].count);
		if (deadPixelsCount > 0) {
			for (var d = 0; d < deadPixelsCount; d++) {
				var deadPixel = enemyLegions[i].pixels.pop();
				addDeadPixelAnimation(deadPixel[0], deadPixel[1]);
			}
			enemyLegions[i].hull = calculateHull(enemyLegions[i].pixels, enemyLegions[i].x, enemyLegions[i].y);
		}

		// remove enemy's dead legions
		if (enemyLegions[i].count <= 0) {
			enemyLegions.splice(i, 1);
		}

	}

	// remove my dead legions
	for (var j = 0; j < myLegions.length; j++) {
		if (myLegions[j].count <= 0) {
			myLegions.splice(j, 1);
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