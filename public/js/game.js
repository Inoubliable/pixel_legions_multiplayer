$(document).ready(function() {

	if (localStorage.getItem('gameName')) {
		var myName = localStorage.getItem('pixelLegionsName');
		localStorage.removeItem('pixelLegionsName');
	} else {
		$.post('/game', function(data) {});
	}

	var socket = io({ query: "&name=" + myName});

	var canvas = document.getElementById("gameCanvas");
	var ctx = canvas.getContext("2d");

	//make canvas fullscreen
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	canvas.addEventListener("mousemove", onMouseMove, false);
	var mousedown = false;
	canvas.addEventListener("mousedown", onMouseDown, false);
	canvas.addEventListener("mouseup", onMouseUp, false);

	const SHOW_BOUNDING_RECTANGLES = false;

	const KING_COUNT = 50;
	const KING_WIDTH = 30;
	const KING_BORDER1_WIDTH = 4;
	const KING_BORDER2_WIDTH = 8;
	const MY_KING_BORDER1_COLOR_NORMAL = "#fff";
	const MY_KING_BORDER2_COLOR_NORMAL = "#000";
	const MY_KING_COLOR_STEM = "rgba(76, 103, 214, ";
	const MY_KING_BORDER2_COLOR_SELECTED = "#333";

	const LEGION_COUNT = 25;
	const LEGION_COUNT_TO_WIDTH = 1.6;
	const LEGION_MINIMAL_PX = 30;
	const LEGION_BORDER_WIDTH = 3;

	const MY_LEGION_COLOR_NORMAL = "rgba(76, 103, 214, 0.5)";
	const MY_LEGION_BORDER_COLOR_NORMAL = "rgba(76, 103, 214, 1)";
	const MY_LEGION_COLOR_SELECTED = "rgba(122, 143, 214, 0.5)";
	const MY_LEGION_BORDER_COLOR_SELECTED = "rgba(122, 143, 214, 1)";

	const ENEMY_KING_BORDER1_COLOR_NORMAL = "#fff";
	const ENEMY_KING_BORDER2_COLOR_NORMAL = "#000";
	const ENEMY_KING_COLOR_STEM = "rgba(248, 6, 42, ";
	const ENEMY_KING_BORDER2_COLOR_SELECTED = "#333";

	const ENEMY_COLOR_NORMAL = "rgba(248, 6, 42, 0.5)";
	const ENEMY_BORDER_COLOR_NORMAL = "rgba(248, 6, 42, 1)";

	const BATTLE_BEAM_COLOR = "#bbb";
	const BATTLE_BEAM_WIDTH = 1;

	const PATH_COLOR = "#fff";
	const PATH_WIDTH = 2;

	const PIXEL_SIZE_PX = 4;	// preferably even number
	const PIXELS_NUM_MIN = 8;

	const HULL_SPACE_PX = 10;

	const AI_LOOP_INTERVAL = 2 * 1000;
	const SPAWN_INTERVAL_MY = 12 * 1000;
	const SPAWN_INTERVAL_ENEMY = 10 * 1000;
	const SPAWN_AREA_WIDTH = 200;

	const BATTLE_COUNT_LOSE = 0.04;
	const BATTLE_AMBUSH_COUNT_LOSE = 0.03;
	const BATTLE_DISTANCE = 100;

	var myKing = {
		x: 350,
		y: 500,
		count: KING_COUNT,
		path: [],
		selected: false,
		move: false
	};

	var enemyKing = {
		x: 300,
		y: 120,
		count: KING_COUNT
	};

	function MyLegion(x, y, count) {
		this.x = x;
		this.y = y;
		this.count = count;
		this.path = [];
		this.selected = false;
		this.move = false;
		this.pixels = createPixels(x, y, legionCountToWidth(count), legionCountToWidth(count), count);
		this.hull = calculateHull(this.pixels, x, y);
		this.nearbyEnemies = [];
	}

	function EnemyLegion(x, y, count) {
		this.x = x;
		this.y = y;
		this.count = count;
		this.AIPath = [];
		this.pixels = createPixels(x, y, legionCountToWidth(count), legionCountToWidth(count), count);
		this.hull = calculateHull(this.pixels, x, y);
		this.nearbyEnemies = [];
		this.defending = false;
	}

	var myLegions = [
		new MyLegion(400, 400, LEGION_COUNT),
		new MyLegion(200, 500, LEGION_COUNT)
	];

	var enemyLegions = [
		new EnemyLegion(300, 180, LEGION_COUNT),
		new EnemyLegion(460, 180, LEGION_COUNT)
	];

	var battleBeams = [];

	function win() {
		window.location.href = '/win';
	}

	function lose() {
		window.location.href = '/lose';
	}

	function legionCountToWidth(count) {
		return count * LEGION_COUNT_TO_WIDTH + LEGION_MINIMAL_PX;
	}

	function myKingCountToColor(count) {
		return MY_KING_COLOR_STEM + count / KING_COUNT + ')';
	}

	function enemyKingCountToColor(count) {
		return ENEMY_KING_COLOR_STEM + count / KING_COUNT + ')';
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

	function updatePixelsPosition(pixels, dx, dy) {
		for (var i = 0; i < pixels.length; i++) {
			pixels[i][0] += dx;
			pixels[i][1] += dy;
		}
	}

	function orientation(p, q, r) {
        var val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
      
        if (val == 0) return 0;	// collinear
        return (val > 0) ? 1 : 2;	// clock or counterclock wise
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

	function onMouseMove(e) {
		if (mousedown) {
			pushToPath(e);
		}
	}

	var mouseDownKingIndex = -1;
	var mouseDownLegionIndex = -1;
	function onMouseDown(e) {
		mousedown = true;

		// check if mouse is down on my king
		var kingWidthHalf = KING_WIDTH / 2;
		if (e.clientX < myKing.x + kingWidthHalf && e.clientX > myKing.x - kingWidthHalf && e.clientY < myKing.y + kingWidthHalf && e.clientY > myKing.y - kingWidthHalf) {
			mouseDownKingIndex = 1;
			mousedown = false;
		} else {
			// check if mouse is down on my legion
			for (var i = 0; i < myLegions.length; i++) {
				var legionWidthHalf = legionCountToWidth(myLegions[i].count) / 2;
				if (e.clientX < myLegions[i].x + legionWidthHalf && e.clientX > myLegions[i].x - legionWidthHalf && e.clientY < myLegions[i].y + legionWidthHalf && e.clientY > myLegions[i].y - legionWidthHalf) {
					mouseDownLegionIndex = i;
					mousedown = false;
					break;
				}
			}
		}
	}

	function onMouseUp(e) {

		// check if mouse is up on my legion or king
		if (mouseDownLegionIndex != -1) {
			for (var i = 0; i < myLegions.length; i++) {
				var legionWidthHalf = legionCountToWidth(myLegions[i].count) / 2;
				if (e.clientX < myLegions[i].x + legionWidthHalf && e.clientX > myLegions[i].x - legionWidthHalf && e.clientY < myLegions[i].y + legionWidthHalf && e.clientY > myLegions[i].y - legionWidthHalf) {
					if (mouseDownLegionIndex == i) {
						// select my legion
						myLegions[i].selected = true;
						myKing.selected = false;
						mouseDownLegionIndex = -1;
					}
				} else {
					myLegions[i].selected = false;
				}
			}
		} else if (mouseDownKingIndex != -1) {
			var kingWidthHalf = KING_WIDTH / 2;
			if (e.clientX < myKing.x + kingWidthHalf && e.clientX > myKing.x - kingWidthHalf && e.clientY < myKing.y + kingWidthHalf && e.clientY > myKing.y - kingWidthHalf) {
				// select my king
				myKing.selected = true;
				mouseDownKingIndex = -1;
			} else {
				myKing.selected = false;
			}
		} else {
			pushToPath(e);

			if (myKing.path.length > 0) {
				var dx = myKing.path[0][0] - myKing.x;
				var dy = myKing.path[0][1] - myKing.y;
				var distance = Math.sqrt(dx * dx + dy * dy);
				var repeat = Math.floor(distance / Math.sqrt(3));
				for (var j = 0; j < repeat; j++) {
					var goTo = [myKing.path[0][0] - dx/repeat, myKing.path[0][1] - dy/repeat];
					myKing.path.unshift(goTo);
				}

				myKing.move = true;
			}

			for (var i = 0; i < myLegions.length; i++) {
				if (myLegions[i].path.length > 0) {
					var path = myLegions[i].path;
					var dx = path[0][0] - myLegions[i].x;
					var dy = path[0][1] - myLegions[i].y;
					var distance = Math.sqrt(dx * dx + dy * dy);
					var repeat = Math.floor(distance / Math.sqrt(10));
					for (var j = 0; j < repeat; j++) {
						var goTo = [path[0][0] - dx/repeat, path[0][1] - dy/repeat];
						path.unshift(goTo);
					}

					myLegions[i].move = true;
					myLegions[i].hull = calculateHull(myLegions[i].pixels, myLegions[i].x, myLegions[i].y);
				}
			}

		}
		
		mousedown = false;
	}

	function pushToPath(e) {

		if (myKing.selected) {
			var path = myKing.path;
			
			// if legion is selected AND mouse is inside certain distance
			if (path.length > 0) {
				var lastPoint = path[path.length-1];
				var dx = lastPoint[0] - e.clientX;
				var dy = lastPoint[1] - e.clientY;
				var distance = Math.sqrt(dx * dx + dy * dy);
				if (distance > 0.6 && distance < 0.8) {	// stabilizing speed
					path.push([e.clientX, e.clientY]);
				} else if (distance >= 1) {
					var repeat = Math.floor(distance / Math.sqrt(3));
					for (var j = 0; j < repeat; j++) {
						var goTo = [path[path.length-1][0] - dx/repeat, path[path.length-1][1] - dy/repeat];
						path.push(goTo);
					}
					path.push([e.clientX, e.clientY]);
				}
			} else {
				path.push([e.clientX, e.clientY]);
			}
		}

		for (var i = 0; i < myLegions.length; i++) {
			if (myLegions[i].selected) {
				var path = myLegions[i].path;

				// if legion is selected AND mouse is inside certain distance
				if (path.length > 0) {
					var lastPoint = path[path.length-1];
					var dx = lastPoint[0] - e.clientX;
					var dy = lastPoint[1] - e.clientY;
					var distance = Math.sqrt(dx * dx + dy * dy);
					if (distance > 3 && distance < 5) {	// stabilizing speed
						path.push([e.clientX, e.clientY]);
						continue;
					} else if (distance >= 5) {
						var repeat = Math.floor(distance / Math.sqrt(10));
						for (var j = 0; j < repeat; j++) {
							var goTo = [path[path.length-1][0] - dx/repeat, path[path.length-1][1] - dy/repeat];
							path.push(goTo);
						}
						path.push([e.clientX, e.clientY]);
					}
				} else {
					path.push([e.clientX, e.clientY]);
				}
			}
		}
	}

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

	// spawning my new legions
	setInterval(function(){
		var startX = myKing.x;
		var startY = myKing.y;
		var spawnX = Math.random() * SPAWN_AREA_WIDTH + myKing.x - SPAWN_AREA_WIDTH/2;
		var spawnY = Math.random() * SPAWN_AREA_WIDTH + myKing.y - SPAWN_AREA_WIDTH/2;
		var spawnCount = LEGION_COUNT;
		var spawnPath = [];
		var spawnSelected = false;
		var spawnMove = false;
		var spawnPixels = createPixels(startX, startY, legionCountToWidth(spawnCount), legionCountToWidth(spawnCount), spawnCount);
		var spawnHull = calculateHull(spawnPixels, startX, startY);
		var spawnNearbyEnemies = [];
		myLegions.push({
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
	}, SPAWN_INTERVAL_MY);

	// spawning enemy new legions
	setInterval(function(){
		var startX = enemyKing.x;
		var startY = enemyKing.y;
		var spawnX = Math.random() * SPAWN_AREA_WIDTH + enemyKing.x - SPAWN_AREA_WIDTH/2;
		var spawnY = Math.random() * SPAWN_AREA_WIDTH + enemyKing.y - SPAWN_AREA_WIDTH/2;
		var spawnCount = LEGION_COUNT;
		var spawnPixels = createPixels(startX, startY, legionCountToWidth(spawnCount), legionCountToWidth(spawnCount), spawnCount);
		var spawnHull = calculateHull(spawnPixels, startX, startY);
		var spawnNearbyEnemies = [];
		enemyLegions.push({
			x: startX,
			y: startY,
			count: spawnCount,
			nearbyEnemies: spawnNearbyEnemies,
			pixels: spawnPixels,
			hull: spawnHull,
			spawning: true,
			spawnX: spawnX,
			spawnY: spawnY,
			AIPath: [],
			defending: false
		});

		// Check if enemy should attack
		AIAttackCheck();
	}, SPAWN_INTERVAL_ENEMY);

	function update() {

		battle();

		movePixels();

		draw();

		updateDeadPixelsAnimations();

		requestAnimationFrame(update);
	}
	requestAnimationFrame(update);

	function battle() {
		for (var i = 0; i < enemyLegions.length; i++) {
			for (var j = 0; j < myLegions.length; j++) {

				if (i == 0) {
					myLegions[j].nearbyEnemies = [];

					// distance to enemy king
					var kingDistanceX = Math.abs(enemyKing.x - myLegions[j].x);
					var kingDistanceY = Math.abs(enemyKing.y - myLegions[j].y);

					if (kingDistanceX < BATTLE_DISTANCE && kingDistanceY < BATTLE_DISTANCE) {
						AIDefend(myLegions[j].x, myLegions[j].y);

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
						deadPixelAnimation(deadPixel[0], deadPixel[1]);
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
					deadPixelAnimation(deadPixel[0], deadPixel[1]);
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

	function movePixels() {
		// Move my legions' pixels
		for (var i = 0; i < myLegions.length; i++) {
			for (var j = 0; j < myLegions[i].pixels.length; j++) {
				var pixel = myLegions[i].pixels[j];
				var moveFor = 0.2;

				// pixel[x, y, moveDirectionX, moveDirectionY]
				// moveDirectionX: 0 => +, 1 => -
				// moveDirectionY: 0 => +, 1 => -
				if (pixel[2] == 0) {
					pixel[0] += moveFor;
				} else if (pixel[2] == 1) {
					pixel[0] -= moveFor;
				}
				if (pixel[3] == 0) {
					pixel[1] += moveFor;
				} else if (pixel[3] == 1) {
					pixel[1] -= moveFor;
				}

				var x = myLegions[i].x;
				var y = myLegions[i].y;
				var w = legionCountToWidth(myLegions[i].count);
				var h = legionCountToWidth(myLegions[i].count);
				if (pixel[0] >= x + w/2 - HULL_SPACE_PX) {
					pixel[2] = 1;
				} else if (pixel[0] <= x - w/2 + HULL_SPACE_PX) {
					pixel[2] = 0;
				}
				if (pixel[1] >= y + h/2 - HULL_SPACE_PX) {
					pixel[3] = 1;
				} else if (pixel[1] <= y - h/2 + HULL_SPACE_PX) {
					pixel[3] = 0;
				}
			}

			myLegions[i].hull = calculateHull(myLegions[i].pixels, myLegions[i].x, myLegions[i].y);
		}

		// Move enemy's pixels
		for (var i = 0; i < enemyLegions.length; i++) {
			for (var j = 0; j < enemyLegions[i].pixels.length; j++) {
				var pixel = enemyLegions[i].pixels[j];
				var moveFor = 0.2;

				// pixel[x, y, moveDirectionX, moveDirectionY]
				// moveDirectionX: 0 => +, 1 => -
				// moveDirectionY: 0 => +, 1 => -
				if (pixel[2] == 0) {
					pixel[0] += moveFor;
				} else if (pixel[2] == 1) {
					pixel[0] -= moveFor;
				}
				if (pixel[3] == 0) {
					pixel[1] += moveFor;
				} else if (pixel[3] == 1) {
					pixel[1] -= moveFor;
				}

				var x = enemyLegions[i].x;
				var y = enemyLegions[i].y;
				var w = legionCountToWidth(enemyLegions[i].count);
				var h = legionCountToWidth(enemyLegions[i].count);
				if (pixel[0] >= x + w/2 - HULL_SPACE_PX) {
					pixel[2] = 1;
				} else if (pixel[0] <= x - w/2 + HULL_SPACE_PX) {
					pixel[2] = 0;
				}
				if (pixel[1] >= y + h/2 - HULL_SPACE_PX) {
					pixel[3] = 1;
				} else if (pixel[1] <= y - h/2 + HULL_SPACE_PX) {
					pixel[3] = 0;
				}
			}

			enemyLegions[i].hull = calculateHull(enemyLegions[i].pixels, enemyLegions[i].x, enemyLegions[i].y);
		}
	}

	var deadPixelsAnimations = [];
	function deadPixelAnimation(x, y) {
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

	function updateDeadPixelsAnimations() {
		var moveBy = 1;
		for (var i = 0; i < deadPixelsAnimations.length; i++) {
			deadPixelsAnimations[i][0][1] -= moveBy;
			deadPixelsAnimations[i][1][0] += moveBy;
			deadPixelsAnimations[i][2][1] += moveBy;
			deadPixelsAnimations[i][3][0] -= moveBy;

			if ((deadPixelsAnimations[i][1][0] - deadPixelsAnimations[i][3][0]) > (6 * PIXEL_SIZE_PX)) {
				deadPixelsAnimations.splice(i, 1);
			}
		}
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// draw battle beams
		ctx.strokeStyle = BATTLE_BEAM_COLOR;
		ctx.lineWidth = BATTLE_BEAM_WIDTH;
		for (var i = 0; i < battleBeams.length; i++) {
			/*
			var startX = battleBeams[i][0];
			var startY = battleBeams[i][1];
			var endX = battleBeams[i][2];
			var endY = battleBeams[i][3];
			var cp1x = startX;
			var cp1y = startY + 50;
			var cp2x = endX;
			var cp2y = endY - 50;
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
			ctx.stroke();
			*/
			var startX = battleBeams[i][0] + Math.random()*4 - 2;
			var startY = battleBeams[i][1] + Math.random()*4 - 2;
			var endX = battleBeams[i][2] + Math.random()*4 - 2;
			var endY = battleBeams[i][3] + Math.random()*4 - 2;
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
			ctx.stroke();
		}
		battleBeams = [];

		// draw king's path
		ctx.lineWidth = PATH_WIDTH;
		ctx.strokeStyle = PATH_COLOR;
		if (myKing.path.length > 0) {
			ctx.beginPath();
			for (var j = 0; j < myKing.path.length; j++) {
				if (j == 0) {
					ctx.moveTo(myKing.path[j][0], myKing.path[j][1]);
				} else {
					ctx.lineTo(myKing.path[j][0], myKing.path[j][1]);
				}
			}
			ctx.stroke();

			if (myKing.move) {
				var pos = myKing.path.shift();
				myKing.x = pos[0];
				myKing.y = pos[1];
				if (myKing.path.length == 0) {
					myKing.move = false;
				}
			}
		}

		ctx.fillStyle = MY_KING_BORDER1_COLOR_NORMAL;
		ctx.fillRect(myKing.x - KING_WIDTH/2, myKing.y - KING_WIDTH/2, KING_WIDTH, KING_WIDTH);
		if (myKing.selected) {
			ctx.fillStyle = MY_KING_BORDER2_COLOR_SELECTED;
			ctx.fillRect(myKing.x - KING_WIDTH/2 + KING_BORDER1_WIDTH, myKing.y - KING_WIDTH/2 + KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH);
		} else {
			ctx.fillStyle = MY_KING_BORDER2_COLOR_NORMAL;
			ctx.fillRect(myKing.x - KING_WIDTH/2 + KING_BORDER1_WIDTH, myKing.y - KING_WIDTH/2 + KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH);
		}
		ctx.fillStyle = myKingCountToColor(myKing.count);
		ctx.fillRect(myKing.x - KING_WIDTH/2 + KING_BORDER2_WIDTH, myKing.y - KING_WIDTH/2 + KING_BORDER2_WIDTH, KING_WIDTH - 2*KING_BORDER2_WIDTH, KING_WIDTH - 2*KING_BORDER2_WIDTH);

		// draw my legions
		for (var i = 0; i < myLegions.length; i++) {

			// draw path
			var path = myLegions[i].path;
			if (path.length > 0) {
				ctx.lineWidth = PATH_WIDTH;
				ctx.strokeStyle = PATH_COLOR;
				ctx.beginPath();
				for (var j = 0; j < path.length; j++) {
					if (j == 0) {
						ctx.moveTo(path[j][0], path[j][1]);
					} else {
						ctx.lineTo(path[j][0], path[j][1]);
					}
				}
				ctx.stroke();

				if (myLegions[i].move) {
					var pos = path.shift();
					var dx = pos[0] - myLegions[i].x;
					var dy = pos[1] - myLegions[i].y;
					updatePixelsPosition(myLegions[i].pixels, dx, dy);
					myLegions[i].x = pos[0];
					myLegions[i].y = pos[1];
					if (path.length == 0) {
						myLegions[i].move = false;
					}
				}
			}

			// move spawning legions
			if (myLegions[i].spawning) {
				var pathPart = 0.06;
				var minD = 0.05;
				var dx = (myLegions[i].spawnX - myLegions[i].x) * pathPart;
				var dy = (myLegions[i].spawnY - myLegions[i].y) * pathPart;

				if (Math.abs(dx) > minD && Math.abs(dy) > minD) {
					myLegions[i].x += dx;
					myLegions[i].y += dy;
				} else {
					myLegions[i].spawning = false;
				}
				updatePixelsPosition(myLegions[i].pixels, dx, dy);
			}

			// deselect legions if king is selected (do it here because im already looping)
			if (myKing.selected) {
				myLegions[i].selected = false;
			}
			
			var myLegionWidth = legionCountToWidth(myLegions[i].count);
			if (myLegions[i].selected) {
				ctx.strokeStyle = MY_LEGION_BORDER_COLOR_SELECTED;
				ctx.fillStyle = MY_LEGION_COLOR_SELECTED;
			} else {
				ctx.strokeStyle = MY_LEGION_BORDER_COLOR_NORMAL;
				ctx.fillStyle = MY_LEGION_COLOR_NORMAL;
			}
			ctx.lineWidth = LEGION_BORDER_WIDTH;
			ctx.beginPath();

			// for testing
			if (SHOW_BOUNDING_RECTANGLES) {
				// drawing bounding rectangles
				var myLegionWidth = legionCountToWidth(myLegions[i].count);
				ctx.strokeRect(myLegions[i].x - myLegionWidth/2, myLegions[i].y - myLegionWidth/2, myLegionWidth, myLegionWidth);
				ctx.fillRect(myLegions[i].x - myLegionWidth/2, myLegions[i].y - myLegionWidth/2, myLegionWidth, myLegionWidth);
			}
			
			if (myLegions[i].hull) {
				for (var h = 0; h < myLegions[i].hull.length; h++) {
					ctx.lineTo(myLegions[i].hull[h][0], myLegions[i].hull[h][1]);
				}
			}
			ctx.fill();
			ctx.stroke();

			// draw pixels in legion
			for (var p = 0; p < myLegions[i].pixels.length; p++) {
				ctx.fillStyle = MY_LEGION_BORDER_COLOR_NORMAL;
				ctx.fillRect(myLegions[i].pixels[p][0] - PIXEL_SIZE_PX/2, myLegions[i].pixels[p][1] - PIXEL_SIZE_PX/2, PIXEL_SIZE_PX, PIXEL_SIZE_PX);
			}
		}

		// draw enemy king
		ctx.fillStyle = ENEMY_KING_BORDER1_COLOR_NORMAL;
		ctx.fillRect(enemyKing.x - KING_WIDTH/2, enemyKing.y - KING_WIDTH/2, KING_WIDTH, KING_WIDTH);
		if (enemyKing.selected) {
			ctx.fillStyle = ENEMY_KING_BORDER2_COLOR_SELECTED;
			ctx.fillRect(enemyKing.x - KING_WIDTH/2 + KING_BORDER1_WIDTH, enemyKing.y - KING_WIDTH/2 + KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH);
		} else {
			ctx.fillStyle = ENEMY_KING_BORDER2_COLOR_NORMAL;
			ctx.fillRect(enemyKing.x - KING_WIDTH/2 + KING_BORDER1_WIDTH, enemyKing.y - KING_WIDTH/2 + KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH);
		}
		ctx.fillStyle = enemyKingCountToColor(enemyKing.count);
		ctx.fillRect(enemyKing.x - KING_WIDTH/2 + KING_BORDER2_WIDTH, enemyKing.y - KING_WIDTH/2 + KING_BORDER2_WIDTH, KING_WIDTH - 2*KING_BORDER2_WIDTH, KING_WIDTH - 2*KING_BORDER2_WIDTH);


		// draw enemy legions
		for (var i = 0; i < enemyLegions.length; i++) {

			// move spawning legions
			if (enemyLegions[i].spawning) {
				var pathPart = 0.06;
				var minD = 0.005;
				var dx = (enemyLegions[i].spawnX - enemyLegions[i].x) * pathPart;
				var dy = (enemyLegions[i].spawnY - enemyLegions[i].y) * pathPart;

				if (Math.abs(dx) > minD && Math.abs(dy) > minD) {
					enemyLegions[i].x += dx;
					enemyLegions[i].y += dy;
				} else {
					enemyLegions[i].spawning = false;
					AIDefenceAfterSpawnPath(enemyLegions[i]);
				}
				updatePixelsPosition(enemyLegions[i].pixels, dx, dy);
			}
			if (enemyLegions[i].AIPath.length > 0) {
				var newPosition = enemyLegions[i].AIPath.shift();
				var dx = newPosition[0] - enemyLegions[i].x;
				var dy = newPosition[1] - enemyLegions[i].y;
				enemyLegions[i].x = newPosition[0];
				enemyLegions[i].y = newPosition[1];
				updatePixelsPosition(enemyLegions[i].pixels, dx, dy);
			}

			var enemyLegionWidth = legionCountToWidth(enemyLegions[i].count);
			ctx.strokeStyle = ENEMY_BORDER_COLOR_NORMAL;
			ctx.fillStyle = ENEMY_COLOR_NORMAL;
			ctx.lineWidth = LEGION_BORDER_WIDTH;
			ctx.beginPath();

			// for testing
			if (SHOW_BOUNDING_RECTANGLES) {
				// drawing bounding rectangles
				ctx.strokeRect(enemyLegions[i].x - enemyLegionWidth/2, enemyLegions[i].y - enemyLegionWidth/2, enemyLegionWidth, enemyLegionWidth);
				ctx.fillRect(enemyLegions[i].x - enemyLegionWidth/2, enemyLegions[i].y - enemyLegionWidth/2, enemyLegionWidth, enemyLegionWidth);
			}

			if (enemyLegions[i].hull) {
				for (var h = 0; h < enemyLegions[i].hull.length; h++) {
					ctx.lineTo(enemyLegions[i].hull[h][0], enemyLegions[i].hull[h][1]);
				}
			}
			ctx.fill();
			ctx.stroke();

			// draw pixels in legion
			for (var p = 0; p < enemyLegions[i].pixels.length; p++) {
				ctx.fillStyle = ENEMY_BORDER_COLOR_NORMAL;
				ctx.fillRect(enemyLegions[i].pixels[p][0] - PIXEL_SIZE_PX/2, enemyLegions[i].pixels[p][1] - PIXEL_SIZE_PX/2, PIXEL_SIZE_PX, PIXEL_SIZE_PX);
			}

		}

		for (var i = 0; i < deadPixelsAnimations.length; i++) {
			for (var j = 0; j < deadPixelsAnimations[i].length; j++) {
				ctx.fillStyle = "#fff";
				ctx.fillRect(deadPixelsAnimations[i][j][0] - PIXEL_SIZE_PX/2, deadPixelsAnimations[i][j][1] - PIXEL_SIZE_PX/2, PIXEL_SIZE_PX, PIXEL_SIZE_PX);
			}
		}
	}

});