let c = require('./constants');
let helpers = require('./helpers');

function AIAttackCheck(room) {
	let checkedPlayers = [];
	for (let i = 0; i < room.allLegions.length; i++) {
		if (room.allLegions[i].isAI && (checkedPlayers.indexOf(room.allLegions[i].playerId) == -1)) {
			let player = room.allPlayers.find(p => p.id == room.allLegions[i].playerId);
			let partsInSpawn = c.SPAWN_INTERVAL / c.AI_LOOP_INTERVAL;
			let playerSpawnPartAggressiveness = 1 - (Math.pow((1 - player.aggressiveness), partsInSpawn));
			let rand = Math.random();

			if (playerSpawnPartAggressiveness > rand) {
				checkedPlayers.push(room.allLegions[i].playerId);
				let playersLegions = [];
				for (let j = 0; j < room.allLegions.length; j++) {
					if (room.allLegions[j].playerId == room.allLegions[i].playerId) {
						playersLegions.push(j);
					}
				}

				if (playersLegions.length > 2) {
					let index1 = Math.floor(Math.random() * playersLegions.length);
					let index2 = Math.floor(Math.random() * playersLegions.length);

					while (index2 == index1) {
						index2 = Math.floor(Math.random() * playersLegions.length);
					}

					let AIlegion1 = room.allLegions[playersLegions[index1]];
					let AIlegion2 = room.allLegions[playersLegions[index2]];
					if (!AIlegion1.spawning) {
						AIAttackPath(AIlegion1, room.allKings, room.allLegions);
					}
					if (!AIlegion2.spawning) {
						AIAttackPath(AIlegion2, room.allKings, room.allLegions);
					}
				}
			}
		}
	}
}

function AIAttackPath(legion, allKings, allLegions) {

	// does it attack king or legion?
	let attackLegion = Math.random() < c.AI_ATTACK_LEGION_CHANCE;
	let enemyLegionsExist = allLegions.find(l => l.playerId != legion.playerId);

	let a = Math.random() * c.BATTLE_DISTANCE;
	let goToX = 0;
	let goToY = 0;

	if (attackLegion && enemyLegionsExist) {
		// attack closest legion
		let closestDistance = null;
		let closestLegionIndex = null;
		for (let i = 0; i < allLegions.length; i++) {
			if (allLegions[i].playerId != legion.playerId) {
				let distance = Math.sqrt((allLegions[i].x - legion.x)**2 + (allLegions[i].y - legion.y)**2);
				if (closestDistance) {
					if (distance < closestDistance) {
						closestDistance = distance;
						closestLegionIndex = i;
					}
				} else {
					closestDistance = distance;
					closestLegionIndex = i;
				}
			}
		}
		goToX = allLegions[closestLegionIndex].x + a - c.BATTLE_DISTANCE/2;
		goToY = allLegions[closestLegionIndex].y + a - c.BATTLE_DISTANCE/2;
	} else {
		// attack random king
		let kingIndex = Math.floor(Math.random() * allKings.length);
		while (allKings[kingIndex].playerId == legion.playerId) {
			kingIndex = Math.floor(Math.random() * allKings.length);
		}
		goToX = allKings[kingIndex].x + a - c.BATTLE_DISTANCE/2;
		goToY = allKings[kingIndex].y + a - c.BATTLE_DISTANCE/2;
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

function AIDefend(playerId, x, y, allLegions) {
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
			if (playersLegions[i].defending || distance < c.BATTLE_DISTANCE) {
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

	let ax = Math.random()*c.BATTLE_DISTANCE - c.BATTLE_DISTANCE/2;
	let ay = Math.random()*c.BATTLE_DISTANCE - c.BATTLE_DISTANCE/2;
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

function AIClearDefending(allLegions) {
	for (let i = 0; i < allLegions.length; i++) {
		allLegions[i].defending = false;
	}
}

function moveAI(allLegions) {
	for (let i = 0; i < allLegions.length; i++) {
		// move spawning legions
		let legW = helpers.legionCountToWidth(allLegions[i].count);
		let legH = helpers.legionCountToWidth(allLegions[i].count);

		if (allLegions[i].isAI && allLegions[i].spawning) {
			let pathPart = 0.06;
			let minD = 0.07;
			let dx = (allLegions[i].spawnX - allLegions[i].x) * pathPart;
			let dy = (allLegions[i].spawnY - allLegions[i].y) * pathPart;

			if (Math.abs(dx) > minD && Math.abs(dy) > minD) {
				let newX = allLegions[i].x + dx;
				let newY = allLegions[i].y + dy;

				// check if it gets over playfield border
				if (newX > (legW*c.LEGION_OVER_BORDER) && newX < (c.PLAYFIELD_WIDTH - legW*c.LEGION_OVER_BORDER)) {
					allLegions[i].x = newX;
				}
				if (newY > (legH*c.LEGION_OVER_BORDER) && newY < (c.PLAYFIELD_HEIGHT - legH*c.LEGION_OVER_BORDER)) {
					allLegions[i].y = newY;
				}
			} else {
				allLegions[i].spawning = false;
			}
		}

		if (allLegions[i].AIPath && allLegions[i].AIPath.length > 0) {
			let pos = allLegions[i].AIPath.shift();

			// check if it gets over playfield border
			if (pos[0] > (legW*c.LEGION_OVER_BORDER) && pos[0] < (c.PLAYFIELD_WIDTH - legW*c.LEGION_OVER_BORDER)) {
				allLegions[i].x = pos[0];
			}
			if (pos[1] > (legH*c.LEGION_OVER_BORDER) && pos[1] < (c.PLAYFIELD_HEIGHT - legH*c.LEGION_OVER_BORDER)) {
				allLegions[i].y = pos[1];
			}
		}
	}
}

module.exports = {
	AIAttackCheck: AIAttackCheck,
	AIAttackPath: AIAttackPath,
	AIDefend: AIDefend,
	AIDefendPath: AIDefendPath,
	AIClearDefending: AIClearDefending,
	moveAI: moveAI
}