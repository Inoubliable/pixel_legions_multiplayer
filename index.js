let express = require('express');
let app = express();
let path = require('path');
let http = require('http').Server(app);
let io = require('socket.io')(http);
let uuidv1 = require('uuid/v1');

let c = require('./modules/constants');
let helpers = require('./modules/helpers');
let AI = require('./modules/AI');

let Room = require('./modules/classes/Room');
let King = require('./modules/classes/King');
let Legion = require('./modules/classes/Legion');

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


let allRooms = [];

let ranking = [];
for (let i = 0; i < c.GAME_PLAYERS_NUM; i++) {
	ranking.push({id: '', name: ''});
}

let waitingRoom = io.of('/waitingRoom');
waitingRoom.on('connection', waitingConnection);

let gameRoom = io.of('/game');
gameRoom.on('connection', gameConnection);

let roomCounter = 0;
function waitingConnection(socket) {
	// search for free room
	let room = {};
	let freeRoom = allRooms.find(r => r.allPlayers.length < c.GAME_PLAYERS_NUM);
	if (freeRoom) {
		socket.join(freeRoom.name);
	} else {
		roomCounter++;
		let roomName = 'room' + roomCounter;
		room = new Room(roomName);
		allRooms.push(room);
		socket.join(roomName);
	}

	let playerName = socket.handshake.query.name;
	let playerId = socket.handshake.query.id || uuidv1();
	let playerRating = +socket.handshake.query.rating || c.STARTING_RATING;
	waitingRoom.to(socket.id).emit('myPlayer', {room: room.name, id: playerId, name: playerName, rating: playerRating});
	room.allPlayers.push({id: playerId, name: playerName, rating: playerRating});

	let humanPlayersCount = room.allPlayers.length;
	setTimeout(function() {
		if (humanPlayersCount == room.allPlayers.length) {
			fillWithAI(room, humanPlayersCount);

			if (room.allPlayers.length == c.GAME_PLAYERS_NUM) {
				waitingRoom.to(room.name).emit('start countdown', room.allPlayers);
			}
		}
	}, c.WAIT_TIME_BEFORE_AI_FILL);

	waitingRoom.to(room.name).emit('player joined', room.allPlayers);

	socket.on('disconnect', function() {
		let index = room.allPlayers.findIndex(function(player) {
			return player.id == playerId;
		});
		room.allPlayers.splice(index, 1);
		console.log('User disconnected');
	});
};

function fillWithAI(room, playerCount) {
	// generate AIs to fill the room
	for (let i = playerCount; i < c.GAME_PLAYERS_NUM; i++) {
		let AIindex = Math.floor((Math.random() * room.availableAINames.length));
		let AIid = uuidv1();
		room.allPlayers.push({id: AIid, name: room.availableAINames[AIindex], rating: c.STARTING_RATING});
		room.availableAINames.splice(AIindex, 1);
		initiatePlayer(room, AIid, true);
	}
}

function gameConnection(socket) {
	let roomName = socket.handshake.query.room;
	console.log(roomName);
	let room = allRooms.find(r => r.name == roomName);
	console.log(room);
	let playerId = socket.handshake.query.id;
	let playerName = socket.handshake.query.name;
	let playerRating = +socket.handshake.query.rating || c.STARTING_RATING;
	socket.join(roomName);
	room.allPlayers.push({id: playerId, name: playerName, rating: playerRating});

	initiatePlayer(room, playerId, false);

	// create spawn loops for every player
	if (room.allPlayers.length == c.GAME_PLAYERS_NUM) {
		for (let i = 0; i < room.allPlayers.length; i++) {
			(function loop() {
				let spawnTimeout = c.SPAWN_INTERVAL + Math.round(Math.random() * c.SPAWN_INTERVAL * c.SPAWN_ITERVAL_RANDOM_PART);
				setTimeout(function() {
					let king = room.allKings.find(k => k.playerId == room.allPlayers[i].id);
	
					if (king) {
						if (!king.isUnderAttack) {
							let counter = 0;
							for (let j = 0; j < room.allLegions.length; j++) {
								if (room.allLegions[j].playerId == room.allPlayers[i].id) {
									counter++;
								}
							}
							if (counter < c.MAX_LEGIONS) {
								// spawn new legion
								let startX = king.x;
								let startY = king.y;
								let color = king.spawnedColor;
								let legW = helpers.legionCountToWidth(c.LEGION_COUNT);
								let spawnX = Math.random() * c.SPAWN_AREA_WIDTH + king.x - c.SPAWN_AREA_WIDTH/2;
								while (!(spawnX > (legW*c.LEGION_OVER_BORDER) && spawnX < (c.PLAYFIELD_WIDTH - legW*c.LEGION_OVER_BORDER))) {
									spawnX = Math.random() * c.SPAWN_AREA_WIDTH + king.x - c.SPAWN_AREA_WIDTH/2;
								}
								let spawnY = Math.random() * c.SPAWN_AREA_WIDTH + king.y - c.SPAWN_AREA_WIDTH/2;
								while (!(spawnY > (legW*c.LEGION_OVER_BORDER) && spawnY < (c.PLAYFIELD_HEIGHT - legW*c.LEGION_OVER_BORDER))) {
									spawnY = Math.random() * c.SPAWN_AREA_WIDTH + king.y - c.SPAWN_AREA_WIDTH/2;
								}
								let isAI = king.isAI;
								room.allLegions.push(new Legion(king.playerId, startX, startY, c.LEGION_COUNT, color, true, spawnX, spawnY, isAI));
							}
						}

						loop();
					}
					
				}, spawnTimeout);
			}());
		}
	}

	socket.on('move', function(data) {
		let roomName = data.room;
		let room = allRooms.find(r => r.name == roomName);
		let playerId = data.playerId;
		let dataKing = data.king;
		let dataLegions = data.legions;

		let foundKing = room.allKings.find(king => king.id == dataKing.id);
		if (foundKing) {
			foundKing.x = dataKing.x;
			foundKing.y = dataKing.y;
			foundKing.path = dataKing.path;
		}

		if (dataLegions.length > 0) {
			for (let i = 0; i < dataLegions.length; i++) {
				let foundLegion = room.allLegions.find(legion => legion.id == dataLegions[i].id);
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
	for (let i = 0; i < allRooms.length; i++) {
		if (allRooms[i].allLegions.length > 0) {
			battle(allRooms[i]);
			AI.moveAI(allRooms[i].allLegions);
		}
	}
}, 1000/60);

// send game state loop
setInterval(function() {
	for (let i = 0; i < allRooms.length; i++) {
		let gameUpdate = {allKings: allRooms[i].allKings, allLegions: allRooms[i].allLegions};
		gameRoom.to(allRooms[i].name).emit('game update', gameUpdate);
	}
}, 1000/60);

function initiatePlayer(room, playerId, isAI) {
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
	room.allKings.push(new King(playerId, x, y, c.KING_COUNT, color, isAI));

	// initiate legions
	for (let i = 0; i < c.INITIAL_LEGIONS_NUM; i++) {
		let legionX = Math.random() * c.SPAWN_AREA_WIDTH + x - c.SPAWN_AREA_WIDTH/2;
		let legionY = Math.random() * c.SPAWN_AREA_WIDTH + y - c.SPAWN_AREA_WIDTH/2;
		let legW = helpers.legionCountToWidth(c.LEGION_COUNT);

		// check if it spawns over playfield border
		while (!(legionX > (legW*c.LEGION_OVER_BORDER) && legionX < (c.PLAYFIELD_WIDTH - legW*c.LEGION_OVER_BORDER))) {
			legionX = Math.random() * c.SPAWN_AREA_WIDTH + x - c.SPAWN_AREA_WIDTH/2;
		}
		while (!(legionY > (legW*c.LEGION_OVER_BORDER) && legionY < (c.PLAYFIELD_HEIGHT - legW*c.LEGION_OVER_BORDER))) {
			legionY = Math.random() * c.SPAWN_AREA_WIDTH + y - c.SPAWN_AREA_WIDTH/2;
		}

		room.allLegions.push(new Legion(playerId, legionX, legionY, c.LEGION_COUNT, color, false, 0, 0, isAI));
	}
}

function battle(room) {
	let deadPlayersIds = [];
	for (let i = 0; i < room.allLegions.length; i++) {
		let legion1 = room.allLegions[i];
		for (let j = i+1; j < room.allLegions.length; j++) {
			let legion2 = room.allLegions[j];
			if (legion1.playerId != legion2.playerId) {

				// distance to legion
				let legionsDistanceX = Math.abs(legion2.x - legion1.x);
				let legionsDistanceY = Math.abs(legion2.y - legion1.y);

				if (legionsDistanceX < c.BATTLE_DISTANCE && legionsDistanceY < c.BATTLE_DISTANCE) {
					legion2.count -= c.BATTLE_COUNT_LOSE;
					legion1.count -= c.BATTLE_COUNT_LOSE;

					// find nearby enemies position
					let enemyHalfWidth = helpers.legionCountToWidth(legion1.count) / 2;
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
		for (let k = room.allKings.length-1; k >= 0; k--) {
			if (i == 0) {
				room.allKings[k].isUnderAttack = false;
			}
			if (room.allKings[k].playerId != legion1.playerId) {
				let kingDistanceX = Math.abs(room.allKings[k].x - legion1.x);
				let kingDistanceY = Math.abs(room.allKings[k].y - legion1.y);
	
				if (kingDistanceX < c.BATTLE_DISTANCE && kingDistanceY < c.BATTLE_DISTANCE) {
					room.allKings[k].count -= c.BATTLE_COUNT_LOSE;
					legion1.count -= c.BATTLE_COUNT_LOSE;

					if (room.allKings[k].isAI) {
						// get legions to defend
						AI.AIDefend(room.allKings[k].playerId, legion1.x, legion1.y, room.allLegions);
					}

					room.allKings[k].isUnderAttack = true;
				}

				if (room.allKings[k].count <= 0) {
					let deadPlayerId = room.allKings[k].playerId;
					deadPlayersIds.push(deadPlayerId);
					room.allKings.splice(k, 1);

					// rank the player
					for (let i = ranking.length-1; i >= 0; i--) {
						if (ranking[i].id == '') {
							ranking[i] = room.allPlayers.find(p => p.id == deadPlayerId);
							ranking[i].newRating = helpers.calculateRating(ranking[i].rating, i+1, room.allPlayers);

							// check if only one player is still alive
							if (ranking[1].id != '') {
								let winnerKing = room.allKings.find(k => k.count > 0);
								ranking[0] = room.allPlayers.find(p => p.id == winnerKing.playerId);
								ranking[0].newRating = helpers.calculateRating(ranking[0].rating, 1, room.allPlayers);
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
	for (let i = room.allLegions.length-1; i >= 0; i--) {
		if ((room.allLegions[i].count <= 0) || (deadPlayersIds.indexOf(room.allLegions[i].playerId) > -1)) {
			room.allLegions.splice(i, 1);
		}
	}
}

// AI loop
setInterval(function() {
	for (var i = 0; i < allRooms.length; i++) {
		AI.AIClearDefending(allRooms[i].allLegions);
		AI.AIAttackCheck(allRooms[i].allKings, allRooms[i].allLegions);
	}
}, c.AI_LOOP_INTERVAL);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log('We are up on 3000');
});