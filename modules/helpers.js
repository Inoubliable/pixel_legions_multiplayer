let c = require('./constants');

function legionCountToWidth(count) {
	return count * c.LEGION_COUNT_TO_WIDTH + c.LEGION_MINIMAL_PX;
}

function calculateHull(xCenter, yCenter, r, vertices) {
    let hull = [];

    r *= 1.2;

    for (let i = 0; i < vertices; i++) {
        let newX = r * Math.cos(2*Math.PI*i/vertices) + xCenter;
        let newY = r * Math.sin(2*Math.PI*i/vertices) + yCenter;

        hull.push([newX, newY]);
    }

    return hull;
}

function calculateRating(rating, place, allPlayers) {
	let avgPlace = (c.GAME_PLAYERS_NUM + 1) / 2;
	let totalRating = allPlayers.reduce((total, player) => total + player.rating, 0);
	let avgRating = totalRating / allPlayers.length;
	let expectedPlace = avgPlace + (avgRating - rating) / 100;
	let placeDifference = expectedPlace - place;
	let newRating = Math.floor(rating + placeDifference*c.RATING_K);

	return newRating;
}

function pushIfNotIn(array, value) {
    if (array.indexOf(value) == -1) {
        array.push(value);
    }
}

function isInsidePlayfieldX(x, width) {
    if (x > (width*c.LEGION_OVER_BORDER) && x < (c.PLAYFIELD_WIDTH - width*c.LEGION_OVER_BORDER)) {
        return true;
    }

    return false;
}

function isInsidePlayfieldY(y, height) {
    if (y > (height*c.LEGION_OVER_BORDER) && y < (c.PLAYFIELD_HEIGHT - height*c.LEGION_OVER_BORDER)) {
        return true;
    }

    return false;
}

function valueWithUpgrade(upgrades, upgradeId, baseValue) {
    if (upgrades) {
        let upgradePerLevel = c.UPGRADES_ARRAY.find(u => u.id == upgradeId).upgradePerLevel;
        value = (1 + upgrades[upgradeId]*upgradePerLevel) * baseValue;

        return value;
    }

    return baseValue;
}

class Point {

    constructor(x, y, isAnchor) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isAnchor = isAnchor || false;
    }
    
}

function createPolygonPoints(xCenter, yCenter, r, vertices) {

    let points = [];
    
    // anchor point in center
    points.push(new Point(xCenter, yCenter, true));

    for (let i = 0; i < vertices; i++) {
        let newX = r * Math.cos(2*Math.PI*i/vertices) + xCenter;
        let newY = r * Math.sin(2*Math.PI*i/vertices) + yCenter;

        points.push(new Point(newX, newY));
    }

    return points;
}

module.exports = {
    legionCountToWidth,
    calculateHull,
    calculateRating,
    pushIfNotIn,
    isInsidePlayfieldX,
    isInsidePlayfieldY,
    valueWithUpgrade,
    createPolygonPoints
}