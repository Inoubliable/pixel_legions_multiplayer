$(document).ready(function() {

	let myId = 'DefaultId';
	let myName = 'Default name';

	if (localStorage.getItem('pixelLegionsId') && localStorage.getItem('pixelLegionsName')) {
		myId = localStorage.getItem('pixelLegionsId');
		myName = localStorage.getItem('pixelLegionsName');
	} else {
		// send user to login
		$.get('/login', function(data) {});
	}

	let socket = io('/game', { query: "&id=" + myId + "&name=" + myName});

	let sentTime = Date.now();
	let lag = 0;
	setInterval(function() {
		sentTime = Date.now();
		socket.emit('myPing', 'Ping');
	}, 1000);
	socket.on('myPong', function(data) {
		lag = Date.now() - sentTime;
		// show lag
		$('#lag').text(lag + 'ms');
	});

	let myKing = {
		x: 0,
		y: 0,
		count: 0,
		path: [],
		selected: false,
		move: false,
		color: "#000"
	};
	let myLegions = [];
	let enemyKings = [];
	let enemyLegions = [];

	let allKings = [];
	let allLegions = [];

	let timeElapsed = 0;
	let timeGameStart = Date.now();

	socket.on('game update', function(data) {
		let timeGameUpdate = Date.now();
		timeElapsed = timeGameUpdate - timeGameStart;
		allKings = data.allKings;
		allLegions = data.allLegions;
		// get my and enemy's king and legions
		let myKingFound = allKings.find(king => king.playerId == myId);
		if (myKingFound) {
			if (myKing.x > 0) {
				// don't update my coordinates
				myKing.count = myKingFound.count;
			} else {
				// at the start, when myKing is not yet set
				myKing = myKingFound;
			}
		} else if (timeElapsed > 2000) {
			lose();
		}

		for (let i = 0; i < allKings.length; i++) {
			if (allKings[i].playerId != myId) {
				let enemyKingFound = enemyKings.find(king => king.id == allKings[i].id);
				if (enemyKingFound) {
					enemyKingFound.x = allKings[i].x;
					enemyKingFound.y = allKings[i].y;
					enemyKingFound.count = allKings[i].count;
					allKings[i] = enemyKingFound;
				} else {
					enemyKings.push(allKings[i]);
				}
			}
		}
		for (let i = enemyKings.length-1; i >= 0; i--) {
			let kin = allKings.find(king => king.id == enemyKings[i].id);
			if (!kin) {
				enemyKings.splice(i, 1);
				if (enemyKings.length == 0) {
					win();
				}
			}
		}

		for (let i = 0; i < allLegions.length; i++) {
			if (allLegions[i].playerId == myId) {
				let foundLegion = myLegions.find(myLegion => myLegion.id == allLegions[i].id);
				if (foundLegion) {
					// don't update my coordinates
					foundLegion.count = allLegions[i].count;
					allLegions[i] = foundLegion;
				} else {
					myLegions.push(allLegions[i]);
				}
			} else {
				let foundLegion = enemyLegions.find(enemyLegion => enemyLegion.id == allLegions[i].id);
				if (foundLegion) {
					let dx = allLegions[i].x - foundLegion.x;
					let dy = allLegions[i].y - foundLegion.y;
					foundLegion.x = allLegions[i].x;
					foundLegion.y = allLegions[i].y;
					foundLegion.count = allLegions[i].count;
					updatePixelsPosition(foundLegion.pixels, dx, dy);
					allLegions[i] = foundLegion;
				} else {
					enemyLegions.push(allLegions[i]);
				}
			}
		}
		// remove legions that are not in allLegions --> are dead
		for (let i = myLegions.length-1; i >= 0; i--) {
			let leg = allLegions.find(legion => legion.id == myLegions[i].id);
			if (!leg) {
				myLegions.splice(i, 1);
			}
		}
		for (let i = enemyLegions.length-1; i >= 0; i--) {
			let leg = allLegions.find(legion => legion.id == enemyLegions[i].id);
			if (!leg) {
				enemyLegions.splice(i, 1);
			}
		}
	});

	let canvas = document.getElementById("gameCanvas");
	let ctx = canvas.getContext("2d");

	//make canvas fullscreen
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	canvas.addEventListener("mousemove", onMouseMove, false);
	let mousedown = false;
	canvas.addEventListener("mousedown", onMouseDown, false);
	canvas.addEventListener("mouseup", onMouseUp, false);

	const SHOW_BOUNDING_RECTANGLES = true;

	const PLAYFIELD_WIDTH = 1000;
	const PLAYFIELD_HEIGHT = 700;

	const LEGION_OVER_BORDER = 0.2;

	const KING_COUNT = 50;
	const KING_WIDTH = 30;
	const KING_BORDER1_WIDTH = 4;
	const KING_BORDER2_WIDTH = 8;
	const KING_BORDER1_COLOR_NORMAL = "#fff";
	const KING_BORDER1_COLOR_SELECTED = "#aaa";
	const KING_BORDER2_COLOR_NORMAL = "#000";
	const KING_BORDER2_COLOR_SELECTED = "#333";

	const KING_PX_PER_FRAME = 0.7;
	const LEGION_PX_PER_FRAME = 3;

	const LEGION_COUNT = 25;
	const LEGION_COUNT_TO_WIDTH = 1.6;
	const LEGION_MINIMAL_PX = 30;
	const LEGION_BORDER_WIDTH = 3;

	const BATTLE_BEAM_COLOR = "#bbb";
	const BATTLE_BEAM_WIDTH = 1;

	const PATH_COLOR = "#fff";
	const PATH_WIDTH = 2;

	const PIXEL_SIZE_PX = 4;	// preferably even number
	const PIXELS_NUM_MIN = 8;

	const HULL_SPACE_PX = 10;

	const BATTLE_COUNT_LOSE = 0.04;
	const BATTLE_AMBUSH_COUNT_LOSE = 0.03;
	const BATTLE_DISTANCE = 100;

	let battleBeams = [];
	let deadPixelsAnimations = [];

	function win() {
		window.location.href = '/gameOver';
	}

	function lose() {
		window.location.href = '/gameOver';
	}

	function legionCountToWidth(count) {
		return count * LEGION_COUNT_TO_WIDTH + LEGION_MINIMAL_PX;
	}

	function kingCountToColor(count, color) {
		return color.replace(/\d+\.?\d*\)/, (count / KING_COUNT) + ')');
	}

	function updatePixelsPosition(pixels, dx, dy) {
		for (let i = 0; i < pixels.length; i++) {
			pixels[i][0] += dx;
			pixels[i][1] += dy;
		}
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

	function addDeadPixelAnimation(x, y) {
		let x1 = x;
		let y1 = y - PIXEL_SIZE_PX;
		let x2 = x + PIXEL_SIZE_PX;
		let y2 = y;
		let x3 = x;
		let y3 = y + PIXEL_SIZE_PX;
		let x4 = x - PIXEL_SIZE_PX;
		let y4 = y;
		deadPixelsAnimations.push([[x1, y1], [x2, y2], [x3, y3], [x4, y4]]);
	}

	function onMouseMove(e) {
		if (mousedown) {
			pushToPath(e);
		}
	}

	let mouseDownKingIndex = -1;
	let mouseDownLegionIndex = -1;
	function onMouseDown(e) {
		mousedown = true;

		// check if mouse is down on my king
		let kingWidthHalf = KING_WIDTH / 2;
		if (e.clientX < myKing.x + kingWidthHalf && e.clientX > myKing.x - kingWidthHalf && e.clientY < myKing.y + kingWidthHalf && e.clientY > myKing.y - kingWidthHalf) {
			mouseDownKingIndex = 1;
			mousedown = false;
		} else {
			// check if mouse is down on my legion
			for (let i = 0; i < myLegions.length; i++) {
				let legionWidthHalf = legionCountToWidth(myLegions[i].count) / 2;
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
			for (let i = 0; i < myLegions.length; i++) {
				let legionWidthHalf = legionCountToWidth(myLegions[i].count) / 2;
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
			let kingWidthHalf = KING_WIDTH / 2;
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
				let dx = myKing.path[0][0] - myKing.x;
				let dy = myKing.path[0][1] - myKing.y;
				let distance = Math.sqrt(dx * dx + dy * dy);
				let repeat = Math.floor(distance / KING_PX_PER_FRAME);
				for (let j = 0; j < repeat; j++) {
					let goTo = [myKing.path[0][0] - dx/repeat, myKing.path[0][1] - dy/repeat];
					myKing.path.unshift(goTo);
				}

				myKing.move = true;
			}

			for (let i = 0; i < myLegions.length; i++) {
				if (myLegions[i].path.length > 0) {
					let path = myLegions[i].path;
					let dx = path[0][0] - myLegions[i].x;
					let dy = path[0][1] - myLegions[i].y;
					let distance = Math.sqrt(dx * dx + dy * dy);
					let repeat = Math.floor(distance / LEGION_PX_PER_FRAME);
					for (let j = 0; j < repeat; j++) {
						let goTo = [path[0][0] - dx/repeat, path[0][1] - dy/repeat];
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
			let path = myKing.path;
			
			// if king is selected AND mouse is inside certain distance
			if (path.length > 0) {
				// stabilize speed
				let lastPoint = path[path.length-1];
				let dx = lastPoint[0] - e.clientX;
				let dy = lastPoint[1] - e.clientY;
				let distance = Math.sqrt(dx * dx + dy * dy);
				if (distance >= KING_PX_PER_FRAME) {
					let repeat = Math.floor(distance / KING_PX_PER_FRAME);
					for (let j = 0; j < repeat; j++) {
						let goTo = [path[path.length-1][0] - dx/repeat, path[path.length-1][1] - dy/repeat];
						path.push(goTo);
					}
					path.push([e.clientX, e.clientY]);
				}
			} else {
				path.push([e.clientX, e.clientY]);
			}
		}

		for (let i = 0; i < myLegions.length; i++) {
			if (myLegions[i].selected) {
				let path = myLegions[i].path;

				// if legion is selected AND mouse is inside certain distance
				if (path.length > 0) {
					// stabilize speed
					let lastPoint = path[path.length-1];
					let dx = lastPoint[0] - e.clientX;
					let dy = lastPoint[1] - e.clientY;
					let distance = Math.sqrt(dx * dx + dy * dy);
					if (distance >= LEGION_PX_PER_FRAME) {
						let repeat = Math.floor(distance / LEGION_PX_PER_FRAME);
						for (let j = 0; j < repeat; j++) {
							let goTo = [path[path.length-1][0] - dx/repeat, path[path.length-1][1] - dy/repeat];
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

	function update() {

		movePixels();

		battle();

		draw();

		updateDeadPixelsAnimations();

		requestAnimationFrame(update);
	}
	requestAnimationFrame(update);

	// send my move loop
	setInterval(function() {
		emitMove();
	}, 1000/60);

	function emitMove() {
		socket.emit('move', {id: myId, king: myKing, legions: myLegions});
	}

	function movePixels() {
		// Move my legions' pixels
		for (let i = 0; i < myLegions.length; i++) {
			for (let j = 0; j < myLegions[i].pixels.length; j++) {
				let pixel = myLegions[i].pixels[j];
				let moveFor = 0.2;

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

				let x = myLegions[i].x;
				let y = myLegions[i].y;
				let w = legionCountToWidth(myLegions[i].count);
				let h = legionCountToWidth(myLegions[i].count);
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
		for (let i = 0; i < enemyLegions.length; i++) {
			for (let j = 0; j < enemyLegions[i].pixels.length; j++) {
				let pixel = enemyLegions[i].pixels[j];
				let moveFor = 0.2;

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

				let x = enemyLegions[i].x;
				let y = enemyLegions[i].y;
				let w = legionCountToWidth(enemyLegions[i].count);
				let h = legionCountToWidth(enemyLegions[i].count);
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

	function updateDeadPixelsAnimations() {
		let moveBy = 1;
		for (let i = deadPixelsAnimations.length-1; i >= 0; i--) {
			
			deadPixelsAnimations[i][0][1] -= moveBy;
			deadPixelsAnimations[i][1][0] += moveBy;
			deadPixelsAnimations[i][2][1] += moveBy;
			deadPixelsAnimations[i][3][0] -= moveBy;

			if ((deadPixelsAnimations[i][1][0] - deadPixelsAnimations[i][3][0]) > (6 * PIXEL_SIZE_PX)) {
				deadPixelsAnimations.splice(i, 1);
			}
		}
	}

	function battle() {
		for (let i = 0; i < allLegions.length; i++) {
			let legion1 = allLegions[i];
			for (let j = i+1; j < allLegions.length; j++) {
				let legion2 = allLegions[j];
				if (legion1.playerId != legion2.playerId) {

					// distance to legion
					let legionsDistanceX = Math.abs(legion2.x - legion1.x);
					let legionsDistanceY = Math.abs(legion2.y - legion1.y);

					if (legionsDistanceX < BATTLE_DISTANCE && legionsDistanceY < BATTLE_DISTANCE) {
						battleBeams.push([legion2.x, legion2.y, legion1.x, legion1.y]);
						legion2.count -= BATTLE_COUNT_LOSE;
						legion1.count -= BATTLE_COUNT_LOSE;

						// find nearby enemies position
						let enemyHalfWidth = legionCountToWidth(legion1.count) / 2;
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
			for (let k = 0; k < allKings.length; k++) {
				let king = allKings[k];
				if (king.playerId != legion1.playerId) {
					let kingDistanceX = Math.abs(king.x - legion1.x);
					let kingDistanceY = Math.abs(king.y - legion1.y);
		
					if (kingDistanceX < BATTLE_DISTANCE && kingDistanceY < BATTLE_DISTANCE) {
						battleBeams.push([king.x, king.y, legion1.x, legion1.y]);				
						king.count -= BATTLE_COUNT_LOSE;
						legion1.count -= BATTLE_COUNT_LOSE;
					}
				}
			}

			// remove locations
			legion1.nearbyEnemies = [];

		}

		// remove dead legions and pixels
		for (let i = allLegions.length-1; i >= 0; i--) {
			let deadPixelsCount = Math.floor(allLegions[i].pixels.length - PIXELS_NUM_MIN - allLegions[i].count);

			if (allLegions[i].count <= 0) {
				allLegions.splice(i, 1);
			} else if (deadPixelsCount > 0) {
				for (let d = 0; d < deadPixelsCount; d++) {
					let deadPixel = allLegions[i].pixels.pop();
					addDeadPixelAnimation(deadPixel[0], deadPixel[1]);
				}
				allLegions[i].hull = calculateHull(allLegions[i].pixels, allLegions[i].x, allLegions[i].y);
			}
		}
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// draw battle beams
		ctx.strokeStyle = BATTLE_BEAM_COLOR;
		ctx.lineWidth = BATTLE_BEAM_WIDTH;
		for (let i = 0; i < battleBeams.length; i++) {
			let startX = battleBeams[i][0] + Math.random()*4 - 2;
			let startY = battleBeams[i][1] + Math.random()*4 - 2;
			let endX = battleBeams[i][2] + Math.random()*4 - 2;
			let endY = battleBeams[i][3] + Math.random()*4 - 2;
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
			for (let j = 0; j < myKing.path.length; j++) {
				if (j == 0) {
					ctx.moveTo(myKing.path[j][0], myKing.path[j][1]);
				} else {
					ctx.lineTo(myKing.path[j][0], myKing.path[j][1]);
				}
			}
			ctx.stroke();

			if (myKing.move) {
				let pos = myKing.path.shift();
				myKing.x = pos[0];
				myKing.y = pos[1];
				if (myKing.path.length == 0) {
					myKing.move = false;
				}
			}
		}

		if (myKing.selected) {
			ctx.fillStyle = KING_BORDER1_COLOR_SELECTED;
			ctx.fillRect(myKing.x - KING_WIDTH/2, myKing.y - KING_WIDTH/2, KING_WIDTH, KING_WIDTH);
			ctx.fillStyle = KING_BORDER2_COLOR_SELECTED;
			ctx.fillRect(myKing.x - KING_WIDTH/2 + KING_BORDER1_WIDTH, myKing.y - KING_WIDTH/2 + KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH);
		} else {
			ctx.fillStyle = KING_BORDER1_COLOR_NORMAL;
			ctx.fillRect(myKing.x - KING_WIDTH/2, myKing.y - KING_WIDTH/2, KING_WIDTH, KING_WIDTH);
			ctx.fillStyle = KING_BORDER2_COLOR_NORMAL;
			ctx.fillRect(myKing.x - KING_WIDTH/2 + KING_BORDER1_WIDTH, myKing.y - KING_WIDTH/2 + KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH);
		}
		ctx.fillStyle = kingCountToColor(myKing.count, myKing.color);
		ctx.fillRect(myKing.x - KING_WIDTH/2 + KING_BORDER2_WIDTH, myKing.y - KING_WIDTH/2 + KING_BORDER2_WIDTH, KING_WIDTH - 2*KING_BORDER2_WIDTH, KING_WIDTH - 2*KING_BORDER2_WIDTH);

		// draw my legions
		for (let i = 0; i < myLegions.length; i++) {
			let legW = legionCountToWidth(myLegions[i].count);
			let legH = legionCountToWidth(myLegions[i].count);

			// draw path
			let path = myLegions[i].path;
			if (path.length > 0) {
				ctx.lineWidth = PATH_WIDTH;
				ctx.strokeStyle = PATH_COLOR;
				ctx.beginPath();
				for (let j = 0; j < path.length; j++) {
					if (j == 0) {
						ctx.moveTo(path[j][0], path[j][1]);
					} else {
						ctx.lineTo(path[j][0], path[j][1]);
					}
				}
				ctx.stroke();

				if (myLegions[i].move) {
					let pos = path.shift();
					let dx = 0;
					let dy = 0;

					// check if it gets over playfield border
					if (pos[0] > (legW*LEGION_OVER_BORDER) && pos[0] < (PLAYFIELD_WIDTH - legW*LEGION_OVER_BORDER)) {
						dx = pos[0] - myLegions[i].x;
						myLegions[i].x = pos[0];
					}
					if (pos[1] > (legH*LEGION_OVER_BORDER) && pos[1] < (PLAYFIELD_HEIGHT - legH*LEGION_OVER_BORDER)) {
						dy = pos[1] - myLegions[i].y;
						myLegions[i].y = pos[1];
					}
					updatePixelsPosition(myLegions[i].pixels, dx, dy);
					if (path.length == 0) {
						myLegions[i].move = false;
					}
				}
			}

			// move spawning legions
			if (myLegions[i].spawning) {
				let pathPart = 0.06;
				let minD = 0.07;
				let dx = (myLegions[i].spawnX - myLegions[i].x) * pathPart;
				let dy = (myLegions[i].spawnY - myLegions[i].y) * pathPart;

				if (Math.abs(dx) > minD && Math.abs(dy) > minD) {
					let newX = myLegions[i].x + dx;
					let newY = myLegions[i].y + dy;
					
					// check if it gets over playfield border
					if (newX > (legW*LEGION_OVER_BORDER) && newX < (PLAYFIELD_WIDTH - legW*LEGION_OVER_BORDER)) {
						myLegions[i].x = newX;
						updatePixelsPosition(myLegions[i].pixels, dx, 0);
					}
					if (newY > (legH*LEGION_OVER_BORDER) && newY < (PLAYFIELD_HEIGHT - legH*LEGION_OVER_BORDER)) {
						myLegions[i].y = newY;
						updatePixelsPosition(myLegions[i].pixels, 0, dy);
					}
				} else {
					myLegions[i].spawning = false;
				}
			}

			// deselect legions if king is selected (do it here because im already looping)
			if (myKing.selected) {
				myLegions[i].selected = false;
			}
			
			if (myLegions[i].selected) {
				ctx.strokeStyle = myLegions[i].borderSelected;
				ctx.fillStyle = myLegions[i].colorSelected;
			} else {
				ctx.strokeStyle = myLegions[i].borderNormal;
				ctx.fillStyle = myLegions[i].colorNormal;
			}
			ctx.lineWidth = LEGION_BORDER_WIDTH;
			ctx.beginPath();

			// for testing
			if (SHOW_BOUNDING_RECTANGLES) {
				// drawing bounding rectangles
				ctx.strokeRect(myLegions[i].x - legW/2, myLegions[i].y - legW/2, legW, legW);
				ctx.fillRect(myLegions[i].x - legW/2, myLegions[i].y - legW/2, legW, legW);
			}
			
			if (myLegions[i].hull) {
				for (let h = 0; h < myLegions[i].hull.length; h++) {
					ctx.lineTo(myLegions[i].hull[h][0], myLegions[i].hull[h][1]);
				}
			}
			ctx.fill();
			ctx.stroke();

			// draw pixels in legion
			for (let p = 0; p < myLegions[i].pixels.length; p++) {
				ctx.fillStyle = myLegions[i].colorNormal;
				ctx.fillRect(myLegions[i].pixels[p][0] - PIXEL_SIZE_PX/2, myLegions[i].pixels[p][1] - PIXEL_SIZE_PX/2, PIXEL_SIZE_PX, PIXEL_SIZE_PX);
			}
		}

		// draw enemy kings
		for (let i = 0; i < enemyKings.length; i++) {
			let enemyKing = enemyKings[i];
			if (enemyKing.selected) {
				ctx.fillStyle = KING_BORDER1_COLOR_SELECTED;
				ctx.fillRect(enemyKing.x - KING_WIDTH/2, enemyKing.y - KING_WIDTH/2, KING_WIDTH, KING_WIDTH);
				ctx.fillStyle = KING_BORDER2_COLOR_SELECTED;
				ctx.fillRect(enemyKing.x - KING_WIDTH/2 + KING_BORDER1_WIDTH, enemyKing.y - KING_WIDTH/2 + KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH);
			} else {
				ctx.fillStyle = KING_BORDER1_COLOR_NORMAL;
				ctx.fillRect(enemyKing.x - KING_WIDTH/2, enemyKing.y - KING_WIDTH/2, KING_WIDTH, KING_WIDTH);
				ctx.fillStyle = KING_BORDER2_COLOR_NORMAL;
				ctx.fillRect(enemyKing.x - KING_WIDTH/2 + KING_BORDER1_WIDTH, enemyKing.y - KING_WIDTH/2 + KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH, KING_WIDTH - 2*KING_BORDER1_WIDTH);
			}
			ctx.fillStyle = kingCountToColor(enemyKing.count, enemyKing.color);
			ctx.fillRect(enemyKing.x - KING_WIDTH/2 + KING_BORDER2_WIDTH, enemyKing.y - KING_WIDTH/2 + KING_BORDER2_WIDTH, KING_WIDTH - 2*KING_BORDER2_WIDTH, KING_WIDTH - 2*KING_BORDER2_WIDTH);
		}

		// draw enemy legions
		for (let i = 0; i < enemyLegions.length; i++) {

			let enemyLegionWidth = legionCountToWidth(enemyLegions[i].count);
			ctx.strokeStyle = enemyLegions[i].borderNormal;
			ctx.fillStyle = enemyLegions[i].colorNormal;
			ctx.lineWidth = LEGION_BORDER_WIDTH;
			ctx.beginPath();

			// for testing
			if (SHOW_BOUNDING_RECTANGLES) {
				// drawing bounding rectangles
				ctx.strokeRect(enemyLegions[i].x - enemyLegionWidth/2, enemyLegions[i].y - enemyLegionWidth/2, enemyLegionWidth, enemyLegionWidth);
				ctx.fillRect(enemyLegions[i].x - enemyLegionWidth/2, enemyLegions[i].y - enemyLegionWidth/2, enemyLegionWidth, enemyLegionWidth);
			}

			if (enemyLegions[i].hull) {
				for (let h = 0; h < enemyLegions[i].hull.length; h++) {
					ctx.lineTo(enemyLegions[i].hull[h][0], enemyLegions[i].hull[h][1]);
				}
			}
			ctx.fill();
			ctx.stroke();

			// draw pixels in legion
			for (let p = 0; p < enemyLegions[i].pixels.length; p++) {
				ctx.fillStyle = enemyLegions[i].borderNormal;
				ctx.fillRect(enemyLegions[i].pixels[p][0] - PIXEL_SIZE_PX/2, enemyLegions[i].pixels[p][1] - PIXEL_SIZE_PX/2, PIXEL_SIZE_PX, PIXEL_SIZE_PX);
			}

		}

		for (let i = 0; i < deadPixelsAnimations.length; i++) {
			for (let j = 0; j < deadPixelsAnimations[i].length; j++) {
				ctx.fillStyle = "#fff";
				ctx.fillRect(deadPixelsAnimations[i][j][0] - PIXEL_SIZE_PX/2, deadPixelsAnimations[i][j][1] - PIXEL_SIZE_PX/2, PIXEL_SIZE_PX, PIXEL_SIZE_PX);
			}
		}

		// drawing playfield border
		if (SHOW_BOUNDING_RECTANGLES) {
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 3;
			ctx.strokeRect(0, 0, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);
		}
	}

});