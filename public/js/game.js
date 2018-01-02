$(document).ready(function() {

	if (localStorage.getItem('gameName')) {
		var myName = localStorage.getItem('pixelLegionsName');
		localStorage.removeItem('pixelLegionsName');
	} else {
		$.post('/game', function(data) {});
	}

	var socket = io({ query: "&name=" + myName});

	var myId = 'bla';
	socket.on('myId', function(id){
		myId = id;
	});

	var sentTime = Date.now();
	var lag = 0;
	setInterval(function() {
		sentTime = Date.now();
		socket.emit('myPing', 'Ping');
	}, 1000);
	socket.on('myPong', function(data){
		lag = Date.now() - sentTime;
		// show lag
		$('#lag').text(lag + 'ms');
	});

	var myKing = {
		x: 0,
		y: 0,
		count: 0,
		path: [],
		selected: false,
		move: false
	};
	var myLegions = [];
	var enemyKing = {
		x: 0,
		y: 0,
		count: 0,
		path: [],
		selected: false,
		move: false
	};
	var enemyLegions = [];

	socket.on('game update', function(data){
		var players = data.allPlayers;
		// get my king and legions
		var myPlayer = players.find(function(player) {
			return player.id == myId;
		});
		// don't update my coordinates
		if (myLegions.length == 0) {
			myKing = myPlayer.king;
			myLegions = myPlayer.legions;
		}

		// get enemies (FOR NOW ONLY ONE ENEMY)
		var enemyPlayers = players.filter(function(player) {
			return player.id != myId;
		});
		for (var i = 0; i < enemyPlayers.length; i++) {
			enemyKing = enemyPlayers[i].king;
			enemyLegions = enemyPlayers[i].legions;
		}

		battleBeams = data.battleBeams;
		deadPixelsAnimations = deadPixelsAnimations.concat(data.deadPixelsAnimations);
	});

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

	const ENEMY_KING_BORDER1_COLOR_NORMAL = "#fff";
	const ENEMY_KING_BORDER2_COLOR_NORMAL = "#000";
	const ENEMY_KING_COLOR_STEM = "rgba(248, 6, 42, ";
	const ENEMY_KING_BORDER2_COLOR_SELECTED = "#333";

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

	var battleBeams = [];
	var deadPixelsAnimations = [];

	function win() {
		window.location.href = '/win';
	}

	function lose() {
		window.location.href = '/lose';
	}

	function legionCountToWidth(count) {
		return count * LEGION_COUNT_TO_WIDTH + LEGION_MINIMAL_PX;
	}

	function kingCountToColor(count, colorStem) {
		return colorStem + count / KING_COUNT + ')';
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

	function update() {

		movePixels();

		draw();

		updateDeadPixelsAnimations();

		requestAnimationFrame(update);
	}
	requestAnimationFrame(update);

	// send my move loop
	setInterval(function() {
		emitMove();
	}, 1000/66);

	function emitMove() {
		socket.emit('move', {id: myId, king: myKing, legions: myLegions});
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

	function updateDeadPixelsAnimations() {
		console.log(deadPixelsAnimations);
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
		ctx.fillStyle = kingCountToColor(myKing.count);
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
				ctx.fillStyle = myLegions[i].colorNormal;
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
		ctx.fillStyle = kingCountToColor(enemyKing.count);
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
					//AIDefenceAfterSpawnPath(enemyLegions[i]);
				}
				updatePixelsPosition(enemyLegions[i].pixels, dx, dy);
			}

			var enemyLegionWidth = legionCountToWidth(enemyLegions[i].count);
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
				for (var h = 0; h < enemyLegions[i].hull.length; h++) {
					ctx.lineTo(enemyLegions[i].hull[h][0], enemyLegions[i].hull[h][1]);
				}
			}
			ctx.fill();
			ctx.stroke();

			// draw pixels in legion
			for (var p = 0; p < enemyLegions[i].pixels.length; p++) {
				ctx.fillStyle = enemyLegions[i].borderNormal;
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