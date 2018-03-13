let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let path = require('path');
let http = require('http').Server(app);
let io = require('socket.io')(http);
let uuidv1 = require('uuid/v1');
var session = require('express-session')({
	secret: 'somerandomstring',
	resave: false,
	saveUninitialized: false
});

let c = require('./modules/constants');
let helpers = require('./modules/helpers');
let AI = require('./modules/AI');
let dbConnection = require('./dbConnection');

let Room = require('./modules/classes/Room');
let Player = require('./modules/classes/Player');
let King = require('./modules/classes/King');
let Legion = require('./modules/classes/Legion');

let public = __dirname + '/public/';

io.use(function(socket, next) {
    session(socket.request, socket.request.res, next);
});
app.use(session);
app.use(express.static(public));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: true
}));
// parse application/json
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.sendFile(path.join(public + 'login.html'));
});
app.get('/login', (req, res) => {
	res.sendFile(path.join(public + 'login.html'));
});

app.post('/login', (req, res) => {
	//dbConnection.removeAllPlayers();
	//dbConnection.getAllPlayers();

	// check if name already exists
	let playerName = req.body.name;
	dbConnection.getPlayerByName(playerName, function(player) {
		if (!player) {
			let newPlayer = {
				name: playerName,
				rating: c.STARTING_RATING
			};
			dbConnection.insertPlayer(newPlayer, function(data) {
				req.session.playerId = data.insertedIds[0];
				res.sendFile(path.join(public + 'waitingRoom.html'));
			});
		} else {
			res.json({error: 'Player with that name already exists.'});
		}
	});
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
app.post('/ranking', (req, res) => {
	// get ranking for room
	let roomId = req.body.roomId;
	dbConnection.getRoom(roomId, function(room) {
		let ranking = null;

		if (room) {
			ranking = room.ranking;
		}

		res.json({ranking: ranking});
	});
});

app.get('/getPlayer', (req, res) => {
	// get ranking for room
	let playerId = req.session.playerId;

	res.json({id: playerId});
});


let allRooms = [];

let waitingRoom = io.of('/waitingRoom');
waitingRoom.on('connection', waitingConnection);

let gameRoom = io.of('/game');
gameRoom.on('connection', gameConnection);

function waitingConnection(socket) {
	// search for free room
	let room = {};
	let freeRoom = allRooms.find(r => r.open);
	if (freeRoom) {
		socket.join(freeRoom.id);
	} else {
		room = new Room();
		allRooms.push(room);
		socket.join(room.id);
	}

	let playerId = socket.request.session.playerId;

	dbConnection.getPlayerById(playerId, function(playerDB) {
		dbConnection.updatePlayer(playerId, {roomId: room.id});
		room.allPlayers.push(new Player(playerDB.name, playerDB.rating, playerId));

		let humanPlayersCount = room.allPlayers.length;
		setTimeout(function() {
			if (humanPlayersCount == room.allPlayers.length) {
				fillWithAI(room, humanPlayersCount);

				if (room.allPlayers.length == c.GAME_PLAYERS_NUM) {
					room.open = false;
					waitingRoom.to(room.id).emit('start countdown', room.allPlayers);
				}
			}
		}, c.WAIT_TIME_BEFORE_AI_FILL);

		waitingRoom.to(room.id).emit('player joined', room.allPlayers);
	});

	socket.on('disconnect', function() {
		removePlayer(room, playerId);
		console.log('User disconnected');
	});
};

function removePlayer(room, playerId) {
	room.allPlayers = room.allPlayers.filter(p => p.id != playerId);
	room.allKings = room.allKings.filter(k => k.playerId != playerId);
	room.allLegions = room.allLegions.filter(l => l.playerId != playerId);
}

function fillWithAI(room, playerCount) {
	// generate AIs to fill the room
	for (let i = playerCount; i < c.GAME_PLAYERS_NUM; i++) {
		let AIIndex = Math.floor((Math.random() * room.availableAIObjects.length));
		let AIid = uuidv1();
		let name = room.availableAIObjects[AIIndex].name;
		let aggressiveness = room.availableAIObjects[AIIndex].aggressiveness;
		let rating = c.STARTING_RATING;

		let newPlayer = new Player(name, rating, AIid);
		room.allPlayers.push(newPlayer);
		room.availableAIObjects.splice(AIIndex, 1);
		newPlayer.initiatePlayer(room, true, aggressiveness);
	}
}

function gameConnection(socket) {
	let playerId = socket.request.session.playerId;
	dbConnection.getPlayerById(playerId, function(player) {
		let room = allRooms.find(r => r.id == player.roomId);
		socket.join(player.roomId);
		
		let newPlayer = new Player(player.name, player.rating, playerId);
		room.allPlayers.push(newPlayer);
		newPlayer.initiatePlayer(room, false, null);

		// create spawn loops for every player
		if (room.allPlayers.length == c.GAME_PLAYERS_NUM) {
			for (let i = 0; i < room.allPlayers.length; i++) {
				(function loop() {
					let playerId = room.allPlayers[i].id;
					let spawnTimeout = c.SPAWN_INTERVAL + Math.round(Math.random() * c.SPAWN_INTERVAL * c.SPAWN_ITERVAL_RANDOM_PART);
					setTimeout(function() {
						let king = room.allKings.find(k => k.playerId == playerId);
		
						if (king) {
							if (!king.isUnderAttack) {
								let counter = 0;
								for (let j = 0; j < room.allLegions.length; j++) {
									if (room.allLegions[j].playerId == playerId) {
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
			let dataKing = data.king;
			let dataLegions = data.legions;

			if (room) {
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
			}
		});

		socket.on('myPing', function() {
			gameRoom.to(socket.id).emit('myPong', 'Pong');
		});

		socket.on('disconnect', function() {
			removePlayer(room, playerId);
			console.log('User disconnected');
		});
	});
};

// game physics loop
setInterval(function() {
	// remove rooms without human players
	allRooms = allRooms.filter(r => !r.isEmpty);

	for (let i = 0; i < allRooms.length; i++) {
		battle(allRooms[i]);
		AI.moveAI(allRooms[i].allLegions);
	}

}, 1000/60);

// send game state loop
setInterval(function() {
	for (let i = 0; i < allRooms.length; i++) {
		let gameUpdate = {allKings: allRooms[i].allKings, allLegions: allRooms[i].allLegions};
		gameRoom.to(allRooms[i].id).emit('game update', gameUpdate);
	}
}, 1000/60);

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
							helpers.pushIfNotIn(legion1.nearbyEnemies, 2);
							helpers.pushIfNotIn(legion2.nearbyEnemies, 4);
						} else {
							helpers.pushIfNotIn(legion1.nearbyEnemies, 4);
							helpers.pushIfNotIn(legion2.nearbyEnemies, 2);
						}
					}

					if (legionsDistanceY > enemyHalfWidth) {
						// is legion on the top or bottom of enemy
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
						let vecX = room.allKings[k].x - legion1.x;
						let vecY = room.allKings[k].y - legion1.y;
						let vecLength = Math.sqrt(vecX**2 + vecY**2);
						// vector length to king's frame speed
						let newX = room.allKings[k].x + (vecX/vecLength) * c.KING_PX_PER_FRAME;
						let newY = room.allKings[k].y + (vecY/vecLength) * c.KING_PX_PER_FRAME;
						let width = c.KING_WIDTH;
						let height = c.KING_WIDTH;
						if (helpers.isInsidePlayfieldX(newX, width)) {
							room.allKings[k].x = newX;
						}
						if (helpers.isInsidePlayfieldY(newY, height)) {
							room.allKings[k].y = newY;
						}

						AI.AIDefend(room.allKings[k].playerId, legion1.x, legion1.y, room.allLegions);
					}

					room.allKings[k].isUnderAttack = true;
				}

				if (room.allKings[k].count <= 0) {
					let deadPlayerId = room.allKings[k].playerId;
					deadPlayersIds.push(deadPlayerId);
					room.allKings.splice(k, 1);

					room.rankPlayer(deadPlayerId);

					// if no human player in room is alive, delete the room
					room.checkIfEmpty();
					if (room.isEmpty) {
						dbConnection.insertRoom(room);
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
	for (let i = 0; i < allRooms.length; i++) {
		AI.AIClearDefending(allRooms[i].allLegions);
		AI.AIAttackCheck(allRooms[i]);
	}
}, c.AI_LOOP_INTERVAL);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log('We are up on 3000');
});