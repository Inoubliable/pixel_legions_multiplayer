import $ from 'jquery';

import * as c from './game_modules/constants';
import * as helpers from './game_modules/helpers';
import * as softBody from './game_modules/softBody';

$(document).ready(function() {

	let myId = null;

	$.get('getPlayer', function(data) {
		myId = data._id;
	});

	let socket = io('/game');

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
		color: "#000"
	};
	let myLegions = [];
	let enemyKings = [];
	let enemyLegions = [];

	let allKings = [];
	let allLegions = [];

	let timeElapsed = 0;
	let timeGameStart = Date.now();

	let showMeAnimation = [];

	socket.on('game update', function(data) {
		let timeGameUpdate = Date.now();
		timeElapsed = timeGameUpdate - timeGameStart;
		allKings = data.allKings;
		allLegions = data.allLegions;
		// get my and enemy's king and legions
		let myKingFoundIndex = allKings.findIndex(king => king.playerId == myId);
		if (myKingFoundIndex != -1) {
			if (myKing.x > 0) {
				// don't update my coordinates
				myKing.count = allKings[myKingFoundIndex].count;
				allKings[myKingFoundIndex] = myKing;
			} else {
				// at the start, when myKing is not yet set
				myKing = allKings[myKingFoundIndex];
				showMeAnimation = helpers.showMe(myKing.x, myKing.y);
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
					allLegions[i].springs = softBody.createSprings(allLegions[i].pixels);
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
					updatePixelsPosition(foundLegion);
					allLegions[i] = foundLegion;
				} else {
					allLegions[i].springs = softBody.createSprings(allLegions[i].pixels);
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


	let battleBeams = [];
	let deadPixelsAnimations = [];

	let canvasContainer = document.getElementById("game-canvas-container");
	let canvas = document.getElementById("game-canvas");
	let ctx = canvas.getContext("2d");

	//make canvas fullscreen
	canvas.width = c.PLAYFIELD_WIDTH;
	canvas.height = c.PLAYFIELD_HEIGHT;

	document.body.addEventListener("mousemove", onMouseMove, false);
	let mousedown = false;
	document.body.addEventListener("mousedown", onMouseDown, false);
	document.body.addEventListener("mouseup", onMouseUp, false);

	function win() {
		showGameOverModal();
	}

	function lose() {
		showGameOverModal();
	}

	function showGameOverModal() {

		$.get('gameOver', function(data) {

			let myPlace = data.place;
			$('.place-sentence .place').html(myPlace);

			let ranking = data.ranking;
			let prizes = data.prizes;

			for (let i = 0; i < ranking.length; i++) {
				let place = i + 1;
				let name = ranking[i].name;
				let prize = prizes[i];
				$('.ranking').append('<li>' + place + '. ' + name + ' <span class="prize">' + prize + '<span class="coin"></span></span></li>');
			}

			let oldRating = data.oldRating;
			let newRating = data.newRating;
			let rating = oldRating;
			let ratingChange = 0;
			let isRatingPlus = (newRating - oldRating) > 0;

			let ratingInterval = setInterval(function() {
				ratingChange = rating - oldRating;
				if (ratingChange > 0) {
					ratingChange = '+' + ratingChange;
				}
				$('.rating-change').html('New rating: ' + rating + ' (' + ratingChange + ')');

				if (rating == newRating) {
					clearInterval(ratingInterval);
				}

				isRatingPlus ? rating++ : rating--;
			}, 30);
		});

		$('.overlay').fadeIn(300);
		$('#game-over-modal').fadeIn(500);

	}

	function onMouseMove(e) {
		if (mousedown) {
			pushToPath(e);
		}

		let mouseX = e.clientX - canvasContainer.offsetLeft;
		let mouseY = e.clientY - canvasContainer.offsetTop;

		for (let i = 0; i < myLegions.length; i++) {
			let legionWidthHalf = helpers.legionCountToWidth(myLegions[i].count) / 2;
			if (mouseX < myLegions[i].x + legionWidthHalf && mouseX > myLegions[i].x - legionWidthHalf && mouseY < myLegions[i].y + legionWidthHalf && mouseY > myLegions[i].y - legionWidthHalf) {
				myLegions[i].hovered = true;
			} else {
				myLegions[i].hovered = false;
			}
		}
	}

	let mouseDownKingIndex = -1;
	let mouseDownLegionIndex = -1;
	function onMouseDown(e) {
		mousedown = true;
		let mouseX = e.clientX - canvasContainer.offsetLeft;
		let mouseY = e.clientY - canvasContainer.offsetTop;

		// check if mouse is down on my king
		let kingWidthHalf = c.KING_WIDTH / 2;
		if (mouseX < myKing.x + kingWidthHalf && mouseX > myKing.x - kingWidthHalf && mouseY < myKing.y + kingWidthHalf && mouseY > myKing.y - kingWidthHalf) {
			mouseDownKingIndex = 1;
			mousedown = false;
		} else {					
			// check if mouse is down on my legion
			for (let i = 0; i < myLegions.length; i++) {
				let legionWidthHalf = helpers.legionCountToWidth(myLegions[i].count) / 2;
				if (mouseX < myLegions[i].x + legionWidthHalf && mouseX > myLegions[i].x - legionWidthHalf && mouseY < myLegions[i].y + legionWidthHalf && mouseY > myLegions[i].y - legionWidthHalf) {
					mouseDownLegionIndex = i;
					mousedown = false;
					break;
				}
			}

			// if nothing new was selected, override path with new one
			if (mousedown) {
				if (myKing.selected) {
					myKing.path = [];
					myKing.isPathVisible = true;
				} else {
					for (let i = 0; i < myLegions.length; i++) {
						if (myLegions[i].selected) {
							myLegions[i].path = [];
							myLegions[i].isPathVisible = true;
						}
					}
				}
			}
		}

		if (mousedown) {
			pushToPath(e);
		}
		
	}

	function onMouseUp(e) {
		let mouseX = e.clientX - canvasContainer.offsetLeft;
		let mouseY = e.clientY - canvasContainer.offsetTop;

		// check if mouse is up on my king or legion
		if (mouseDownKingIndex != -1) {
			let kingWidthHalf = c.KING_WIDTH / 2;
			if (mouseX < myKing.x + kingWidthHalf && mouseX > myKing.x - kingWidthHalf && mouseY < myKing.y + kingWidthHalf && mouseY > myKing.y - kingWidthHalf) {
				// select my king
				myKing.selected = true;
				mouseDownKingIndex = -1;
			} else {
				myKing.selected = false;
			}
		} else if (mouseDownLegionIndex != -1) {
			for (let i = 0; i < myLegions.length; i++) {
				let legionWidthHalf = helpers.legionCountToWidth(myLegions[i].count) / 2;
				if (mouseX < myLegions[i].x + legionWidthHalf && mouseX > myLegions[i].x - legionWidthHalf && mouseY < myLegions[i].y + legionWidthHalf && mouseY > myLegions[i].y - legionWidthHalf) {
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
		} else {
			myKing.isPathVisible = false;

			for (let i = 0; i < myLegions.length; i++) {
				myLegions[i].isPathVisible = false;
			}
		}
		
		mousedown = false;
	}

	function pushToPath(e) {
		let mouseX = e.clientX - canvasContainer.offsetLeft;
		let mouseY = e.clientY - canvasContainer.offsetTop;

		if (myKing.selected) {
			let path = myKing.path;
			
			// if king is selected AND mouse is inside certain distance
			if (path.length > 0) {
				// stabilize speed
				let lastPoint = path[path.length-1];
				let dx = lastPoint[0] - mouseX;
				let dy = lastPoint[1] - mouseY;
				let distance = Math.sqrt(dx * dx + dy * dy);
				if (distance >= c.KING_PX_PER_FRAME) {
					let repeat = Math.floor(distance / c.KING_PX_PER_FRAME);
					for (let j = 0; j < repeat; j++) {
						let goTo = [path[path.length-1][0] - dx/repeat, path[path.length-1][1] - dy/repeat];
						path.push(goTo);
					}
					path.push([mouseX, mouseY]);
				}
			} else {
				path.push([mouseX, mouseY]);
				pathToFirstPoint(myKing, c.KING_PX_PER_FRAME);
			}
		}

		for (let i = 0; i < myLegions.length; i++) {
			if (myLegions[i].selected) {
				let path = myLegions[i].path;

				// if legion is selected AND mouse is inside certain distance
				if (path.length > 0) {
					// stabilize speed
					let lastPoint = path[path.length-1];
					let dx = lastPoint[0] - mouseX;
					let dy = lastPoint[1] - mouseY;
					let distance = Math.sqrt(dx * dx + dy * dy);
					if (distance >= c.LEGION_PX_PER_FRAME) {
						let repeat = Math.floor(distance / c.LEGION_PX_PER_FRAME);
						for (let j = 0; j < repeat; j++) {
							let goTo = [path[path.length-1][0] - dx/repeat, path[path.length-1][1] - dy/repeat];
							path.push(goTo);
						}
						path.push([mouseX, mouseY]);
					}
				} else {
					path.push([mouseX, mouseY]);
					pathToFirstPoint(myLegions[i], c.LEGION_PX_PER_FRAME);
				}
			}
		}
	}

	function pathToFirstPoint(object, pixels) {
		let path = object.path;
		let dx = path[0][0] - object.x;
		let dy = path[0][1] - object.y;
		let distance = Math.sqrt(dx * dx + dy * dy);
		let repeat = Math.floor(distance / pixels);
		for (let j = 0; j < repeat; j++) {
			let goTo = [path[0][0] - dx/repeat, path[0][1] - dy/repeat];
			path.unshift(goTo);
		}
	}

	function update() {

		battle();

		draw();

		updateDeadPixelsAnimations();

		requestAnimationFrame(update);
	}
	requestAnimationFrame(update);

	// send my move loop
	setInterval(function() {
		emitMove();
	}, c.UPDATE_TIMESTEP);

	function emitMove() {
		socket.emit('move', {king: myKing, legions: myLegions});
	}

	function updatePixelsPosition(legion) {

		let anchor = legion.pixels.find(p => p.isAnchor);
		anchor.x = legion.x;
		anchor.y = legion.y;

		softBody.update(legion.springs, legion.pixels);

	}

	function updateDeadPixelsAnimations() {
		let moveBy = 1;
		for (let i = deadPixelsAnimations.length-1; i >= 0; i--) {
			
			deadPixelsAnimations[i][0][1] -= moveBy;
			deadPixelsAnimations[i][1][0] += moveBy;
			deadPixelsAnimations[i][2][1] += moveBy;
			deadPixelsAnimations[i][3][0] -= moveBy;

			if ((deadPixelsAnimations[i][1][0] - deadPixelsAnimations[i][3][0]) > (6 * c.PIXEL_SIZE_PX)) {
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

					if (legionsDistanceX < c.BATTLE_DISTANCE && legionsDistanceY < c.BATTLE_DISTANCE) {
						battleBeams.push([legion2.x, legion2.y, legion1.x, legion1.y]);
						legion2.count -= legion1.attack;
						legion1.count -= legion2.attack;

						// find nearby enemies position
						let enemyHalfWidth = helpers.legionCountToWidth(legion1.count) / 2;
						if (legionsDistanceX > enemyHalfWidth) {
							// is myLegion on the left or right of enemy
							if ((legion2.x - legion1.x) > 0) {
								helpers.pushIfNotIn(legion1.nearbyEnemies, 2);
								helpers.pushIfNotIn(legion2.nearbyEnemies, 4);
							} else {
								helpers.pushIfNotIn(legion1.nearbyEnemies, 4);
								helpers.pushIfNotIn(legion2.nearbyEnemies, 2);
							}
						}

						if (legionsDistanceY > enemyHalfWidth) {
							// is myLegion on the top or bottom of enemy
							if ((legion2.y - legion1.y) > 0) {
								helpers.pushIfNotIn(legion1.nearbyEnemies, 3);
								helpers.pushIfNotIn(legion2.nearbyEnemies, 1);
							} else {
								helpers.pushIfNotIn(legion1.nearbyEnemies, 1);
								helpers.pushIfNotIn(legion2.nearbyEnemies, 3);
							}
						}

						// check for ambush
						if (legion1.nearbyEnemies.indexOf(2) != -1 && legion1.nearbyEnemies.indexOf(4) != -1) {
							legion1.count -= c.BATTLE_AMBUSH_COUNT_LOSE;
						}
						if (legion1.nearbyEnemies.indexOf(1) != -1 && legion1.nearbyEnemies.indexOf(3) != -1) {
							legion1.count -= c.BATTLE_AMBUSH_COUNT_LOSE;
						}

						if (legion2.nearbyEnemies.indexOf(2) != -1 && legion2.nearbyEnemies.indexOf(4) != -1) {
							legion2.count -= c.BATTLE_AMBUSH_COUNT_LOSE;
						}
						if (legion2.nearbyEnemies.indexOf(1) != -1 && legion2.nearbyEnemies.indexOf(3) != -1) {
							legion2.count -= c.BATTLE_AMBUSH_COUNT_LOSE;
						}
					}
				}
			}

			// battle with king
			for (let k = 0; k < allKings.length; k++) {
				let king = allKings[k];
				if (i == 0) {
					king.isUnderAttack = false;
				}
				if (king.playerId != legion1.playerId) {
					let kingDistanceX = Math.abs(king.x - legion1.x);
					let kingDistanceY = Math.abs(king.y - legion1.y);
		
					if (kingDistanceX < c.BATTLE_DISTANCE && kingDistanceY < c.BATTLE_DISTANCE) {
						battleBeams.push([king.x, king.y, legion1.x, legion1.y]);				
						king.count -= legion1.attack;
						legion1.count -= king.attack;

						king.isUnderAttack = true;
					}
				}
			}

			// remove locations
			legion1.nearbyEnemies = [];

		}

		// remove dead legions and pixels
		for (let i = allLegions.length-1; i >= 0; i--) {
			let deadPixelsCount = Math.floor(allLegions[i].pixels.length - c.PIXELS_NUM_MIN - allLegions[i].count);

			if (allLegions[i].count <= 0) {
				allLegions.splice(i, 1);
				continue;
			} else if (deadPixelsCount > 0) {
				for (let d = 0; d < deadPixelsCount; d++) {
					let deadPixel = softBody.removePointAndSprings(allLegions[i]);
					deadPixelsAnimations.push(helpers.createDeadPixelAnimation(deadPixel[0], deadPixel[1]));
				}
				allLegions[i].hull = helpers.calculateHull(allLegions[i].x, allLegions[i].y, helpers.legionCountToWidth(allLegions[i].count)/2, allLegions[i].pixels.length-1);
			}

			updatePixelsPosition(allLegions[i]);
		}
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// draw battle beams
		ctx.strokeStyle = c.BATTLE_BEAM_COLOR;
		ctx.lineWidth = c.BATTLE_BEAM_WIDTH;
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

		if (myKing.path.length > 0) {

			if (myKing.isPathVisible) {
				// draw king's path
				ctx.lineWidth = c.PATH_WIDTH;
				ctx.lineJoin = 'round';
				ctx.lineCap = 'round';
				ctx.strokeStyle = c.PATH_COLOR;
				ctx.beginPath();
				for (let j = 0; j < myKing.path.length; j++) {
					if (j == 0) {
						ctx.moveTo(myKing.path[j][0], myKing.path[j][1]);
					} else {
						ctx.lineTo(myKing.path[j][0], myKing.path[j][1]);
					}
				}
				ctx.stroke();
			}

			let pos = myKing.path.shift();

			// check if it gets over playfield border
			if (pos[0] > (c.KING_WIDTH*c.LEGION_OVER_BORDER) && pos[0] < (c.PLAYFIELD_WIDTH - c.KING_WIDTH*c.LEGION_OVER_BORDER)) {
				myKing.x = pos[0];
			}
			if (pos[1] > (c.KING_WIDTH*c.LEGION_OVER_BORDER) && pos[1] < (c.PLAYFIELD_HEIGHT - c.KING_WIDTH*c.LEGION_OVER_BORDER)) {
				myKing.y = pos[1];
			}
		}

		if (myKing.selected) {
			ctx.fillStyle = c.KING_BORDER1_COLOR_SELECTED;
			ctx.fillRect(myKing.x - c.KING_WIDTH/2, myKing.y - c.KING_WIDTH/2, c.KING_WIDTH, c.KING_WIDTH);
			ctx.fillStyle = c.KING_BORDER2_COLOR_SELECTED;
			ctx.fillRect(myKing.x - c.KING_WIDTH/2 + c.KING_BORDER1_WIDTH, myKing.y - c.KING_WIDTH/2 + c.KING_BORDER1_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER1_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER1_WIDTH);
		} else {
			ctx.fillStyle = c.KING_BORDER1_COLOR_NORMAL;
			ctx.fillRect(myKing.x - c.KING_WIDTH/2, myKing.y - c.KING_WIDTH/2, c.KING_WIDTH, c.KING_WIDTH);
			ctx.fillStyle = c.KING_BORDER2_COLOR_NORMAL;
			ctx.fillRect(myKing.x - c.KING_WIDTH/2 + c.KING_BORDER1_WIDTH, myKing.y - c.KING_WIDTH/2 + c.KING_BORDER1_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER1_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER1_WIDTH);
		}
		ctx.fillStyle = helpers.kingCountToColor(myKing.count, myKing.color);
		ctx.fillRect(myKing.x - c.KING_WIDTH/2 + c.KING_BORDER2_WIDTH, myKing.y - c.KING_WIDTH/2 + c.KING_BORDER2_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER2_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER2_WIDTH);
		
		// draw "under attack sign"
		if (myKing.isUnderAttack) {
			// first rotate sign a bit clockwise
			if (myKing.underAttackAngle) {
				myKing.underAttackAngle += 0.5;
			} else {
				myKing.underAttackAngle = 1;
			}
			let r = 35;
			let angleRadian1 = myKing.underAttackAngle * Math.PI/180;
			let angleRadian2 = (myKing.underAttackAngle + 90) * Math.PI/180;
			let angleRadian3 = (myKing.underAttackAngle + 180) * Math.PI/180;
			let angleRadian4 = (myKing.underAttackAngle + 270) * Math.PI/180;
			// x = r * sin(angle)
			// y = r * cos(angle)
			let signX1 = myKing.x + r * Math.sin(angleRadian1);
			let signY1 = myKing.y - r * Math.cos(angleRadian1);
			let signX2 = myKing.x + r * Math.sin(angleRadian2);
			let signY2 = myKing.y - r * Math.cos(angleRadian2);
			let signX3 = myKing.x + r * Math.sin(angleRadian3);
			let signY3 = myKing.y - r * Math.cos(angleRadian3);
			let signX4 = myKing.x + r * Math.sin(angleRadian4);
			let signY4 = myKing.y - r * Math.cos(angleRadian4);
			ctx.save();
			ctx.fillStyle = c.KING_UNDER_ATTACK_COLOR;
			ctx.lineWidth = 1;
			ctx.strokeStyle = c.KING_UNDER_ATTACK_COLOR;
			ctx.beginPath();
			ctx.lineTo(signX1, signY1);
			ctx.lineTo(signX2, signY2);
			ctx.lineTo(signX3, signY3);
			ctx.lineTo(signX4, signY4);
			ctx.lineTo(signX1, signY1);
			ctx.stroke();
			ctx.fill();
			ctx.restore();
		}

		// draw my legions
		for (let i = 0; i < myLegions.length; i++) {
			let legW = helpers.legionCountToWidth(myLegions[i].count);
			let legH = helpers.legionCountToWidth(myLegions[i].count);

			// draw path
			let path = myLegions[i].path;
			if (path.length > 0) {

				if (myLegions[i].isPathVisible) {
					ctx.lineWidth = c.PATH_WIDTH;
					ctx.lineJoin = 'round';
					ctx.lineCap = 'round';
					ctx.strokeStyle = c.PATH_COLOR;
					ctx.beginPath();
					for (let j = 0; j < path.length; j++) {
						if (j == 0) {
							ctx.moveTo(path[j][0], path[j][1]);
						} else {
							ctx.lineTo(path[j][0], path[j][1]);
						}
					}
					ctx.stroke();
				}

				let pos = path.shift();
				let dx = 0;
				let dy = 0;

				// check if it gets over playfield border
				if (pos[0] > (legW*c.LEGION_OVER_BORDER) && pos[0] < (c.PLAYFIELD_WIDTH - legW*c.LEGION_OVER_BORDER)) {
					dx = pos[0] - myLegions[i].x;
					myLegions[i].x = pos[0];
				}
				if (pos[1] > (legH*c.LEGION_OVER_BORDER) && pos[1] < (c.PLAYFIELD_HEIGHT - legH*c.LEGION_OVER_BORDER)) {
					dy = pos[1] - myLegions[i].y;
					myLegions[i].y = pos[1];
				}
				updatePixelsPosition(myLegions[i]);
				myLegions[i].hull = helpers.calculateHull(myLegions[i].x, myLegions[i].y, helpers.legionCountToWidth(myLegions[i].count)/2, myLegions[i].pixels.length-1);
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
					if (newX > (legW*c.LEGION_OVER_BORDER) && newX < (c.PLAYFIELD_WIDTH - legW*c.LEGION_OVER_BORDER)) {
						myLegions[i].x = newX;
					}
					if (newY > (legH*c.LEGION_OVER_BORDER) && newY < (c.PLAYFIELD_HEIGHT - legH*c.LEGION_OVER_BORDER)) {
						myLegions[i].y = newY;
					}

					updatePixelsPosition(myLegions[i]);
					myLegions[i].hull = helpers.calculateHull(myLegions[i].x, myLegions[i].y, helpers.legionCountToWidth(myLegions[i].count)/2, myLegions[i].pixels.length-1);
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
				ctx.lineWidth = c.LEGION_BORDER_WIDTH;

				ctx.beginPath();
				if (myLegions[i].hull) {
					for (let h = 0; h < myLegions[i].hull.length; h++) {
						ctx.lineTo(myLegions[i].hull[h][0], myLegions[i].hull[h][1]);
					}
				}
				ctx.lineTo(myLegions[i].hull[0][0], myLegions[i].hull[0][1]);
				ctx.fill();
				ctx.stroke();
			} else if (myLegions[i].hovered) {
				ctx.fillStyle = myLegions[i].colorHovered;

				ctx.beginPath();
				if (myLegions[i].hull) {
					for (let h = 0; h < myLegions[i].hull.length; h++) {
						ctx.lineTo(myLegions[i].hull[h][0], myLegions[i].hull[h][1]);
					}
				}
				ctx.lineTo(myLegions[i].hull[0][0], myLegions[i].hull[0][1]);
				ctx.fill();
			}

			// for testing
			if (c.SHOW_BOUNDING_RECTANGLES) {
				// drawing bounding rectangles
				ctx.strokeRect(myLegions[i].x - legW/2, myLegions[i].y - legW/2, legW, legW);
				ctx.fillRect(myLegions[i].x - legW/2, myLegions[i].y - legW/2, legW, legW);
			}

			if (c.SHOW_SPRINGS) {
				// drawing springs
				ctx.strokeStyle = c.SPRING_COLOR;
				ctx.lineWidth = c.SPRING_WIDTH;

				for (let j = 0; j < myLegions[i].springs.length; j++) {
					let spring = myLegions[i].springs[j];

					ctx.moveTo(spring.point1.x, spring.point1.y);
					ctx.lineTo(spring.point2.x, spring.point2.y);
					
					ctx.stroke();
				}
			}

			// draw pixels in legion
			for (let p = 0; p < myLegions[i].pixels.length; p++) {
				ctx.fillStyle = myLegions[i].borderSelected;
				ctx.fillRect(myLegions[i].pixels[p].x - c.PIXEL_SIZE_PX/2, myLegions[i].pixels[p].y - c.PIXEL_SIZE_PX/2, c.PIXEL_SIZE_PX, c.PIXEL_SIZE_PX);
			}
		}

		// draw enemy kings
		for (let i = 0; i < enemyKings.length; i++) {
			let enemyKing = enemyKings[i];
			if (enemyKing.selected) {
				ctx.fillStyle = c.KING_BORDER1_COLOR_SELECTED;
				ctx.fillRect(enemyKing.x - c.KING_WIDTH/2, enemyKing.y - c.KING_WIDTH/2, c.KING_WIDTH, c.KING_WIDTH);
				ctx.fillStyle = c.KING_BORDER2_COLOR_SELECTED;
				ctx.fillRect(enemyKing.x - c.KING_WIDTH/2 + c.KING_BORDER1_WIDTH, enemyKing.y - c.KING_WIDTH/2 + c.KING_BORDER1_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER1_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER1_WIDTH);
			} else {
				ctx.fillStyle = c.KING_BORDER1_COLOR_NORMAL;
				ctx.fillRect(enemyKing.x - c.KING_WIDTH/2, enemyKing.y - c.KING_WIDTH/2, c.KING_WIDTH, c.KING_WIDTH);
				ctx.fillStyle = c.KING_BORDER2_COLOR_NORMAL;
				ctx.fillRect(enemyKing.x - c.KING_WIDTH/2 + c.KING_BORDER1_WIDTH, enemyKing.y - c.KING_WIDTH/2 + c.KING_BORDER1_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER1_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER1_WIDTH);
			}
			ctx.fillStyle = helpers.kingCountToColor(enemyKing.count, enemyKing.color);
			ctx.fillRect(enemyKing.x - c.KING_WIDTH/2 + c.KING_BORDER2_WIDTH, enemyKing.y - c.KING_WIDTH/2 + c.KING_BORDER2_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER2_WIDTH, c.KING_WIDTH - 2*c.KING_BORDER2_WIDTH);
			
			// draw "under attack sign"
			if (enemyKing.isUnderAttack) {
				// first rotate sign a bit clockwise
				if (enemyKing.underAttackAngle) {
					enemyKing.underAttackAngle += 0.5;
				} else {
					enemyKing.underAttackAngle = 1;
				}
				let r = 35;
				let angleRadian1 = enemyKing.underAttackAngle * Math.PI/180;
				let angleRadian2 = (enemyKing.underAttackAngle + 90) * Math.PI/180;
				let angleRadian3 = (enemyKing.underAttackAngle + 180) * Math.PI/180;
				let angleRadian4 = (enemyKing.underAttackAngle + 270) * Math.PI/180;
				// x = r * sin(angle)
				// y = r * cos(angle)
				let signX1 = enemyKing.x + r * Math.sin(angleRadian1);
				let signY1 = enemyKing.y - r * Math.cos(angleRadian1);
				let signX2 = enemyKing.x + r * Math.sin(angleRadian2);
				let signY2 = enemyKing.y - r * Math.cos(angleRadian2);
				let signX3 = enemyKing.x + r * Math.sin(angleRadian3);
				let signY3 = enemyKing.y - r * Math.cos(angleRadian3);
				let signX4 = enemyKing.x + r * Math.sin(angleRadian4);
				let signY4 = enemyKing.y - r * Math.cos(angleRadian4);
				ctx.save();
				ctx.fillStyle = c.KING_UNDER_ATTACK_COLOR;
				ctx.lineWidth = 1;
				ctx.strokeStyle = c.KING_UNDER_ATTACK_COLOR;
				ctx.beginPath();
				ctx.lineTo(signX1, signY1);
				ctx.lineTo(signX2, signY2);
				ctx.lineTo(signX3, signY3);
				ctx.lineTo(signX4, signY4);
				ctx.lineTo(signX1, signY1);
				ctx.stroke();
				ctx.fill();
				ctx.restore();
			}
		}

		// draw enemy legions
		for (let i = 0; i < enemyLegions.length; i++) {

			let enemyLegionWidth = helpers.legionCountToWidth(enemyLegions[i].count);
			ctx.lineWidth = c.LEGION_BORDER_WIDTH;
			ctx.beginPath();

			// for testing
			if (c.SHOW_BOUNDING_RECTANGLES) {
				// drawing bounding rectangles
				ctx.strokeRect(enemyLegions[i].x - enemyLegionWidth/2, enemyLegions[i].y - enemyLegionWidth/2, enemyLegionWidth, enemyLegionWidth);
				ctx.fillRect(enemyLegions[i].x - enemyLegionWidth/2, enemyLegions[i].y - enemyLegionWidth/2, enemyLegionWidth, enemyLegionWidth);
			}

			ctx.stroke();

			// draw pixels in legion
			for (let p = 0; p < enemyLegions[i].pixels.length; p++) {
				ctx.lineWidth = 1;
				ctx.fillStyle = enemyLegions[i].borderSelected;
				ctx.fillRect(enemyLegions[i].pixels[p].x - c.PIXEL_SIZE_PX/2, enemyLegions[i].pixels[p].y - c.PIXEL_SIZE_PX/2, c.PIXEL_SIZE_PX, c.PIXEL_SIZE_PX);
			}

		}

		for (let i = 0; i < deadPixelsAnimations.length; i++) {
			for (let j = 0; j < deadPixelsAnimations[i].length; j++) {
				ctx.fillStyle = "#fff";
				ctx.fillRect(deadPixelsAnimations[i][j][0] - c.PIXEL_SIZE_PX/2, deadPixelsAnimations[i][j][1] - c.PIXEL_SIZE_PX/2, c.PIXEL_SIZE_PX, c.PIXEL_SIZE_PX);
			}
		}
		
		if (showMeAnimation.length > 0) {
			let arrowPosition = showMeAnimation.shift();
			let toX = arrowPosition[0];
			let toY = arrowPosition[1];
			if (myKing.y < 50) {
				let fromX = toX;
				let fromY = toY + 30;
				helpers.drawArrow(ctx, fromX, fromY, toX, toY);
			} else {
				let fromX = toX;
				let fromY = toY - 30;
				helpers.drawArrow(ctx, fromX, fromY, toX, toY);
			}
		}
	}

});