let c = require('./constants');

function legionCountToWidth(count) {
	return count * c.LEGION_COUNT_TO_WIDTH + c.LEGION_MINIMAL_PX;
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
        	newArray[p][0] += c.HULL_SPACE_PX;
        } else if (newArray[p][0] < x) {
        	newArray[p][0] -= c.HULL_SPACE_PX;
        }
        if (newArray[p][1] > y) {
        	newArray[p][1] += c.HULL_SPACE_PX;
        } else if (newArray[p][1] < y) {
        	newArray[p][1] -= c.HULL_SPACE_PX;
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

module.exports = {
    legionCountToWidth: legionCountToWidth,
    calculateHull: calculateHull,
    calculateRating: calculateRating,
    pushIfNotIn: pushIfNotIn,
    isInsidePlayfieldX: isInsidePlayfieldX,
    isInsidePlayfieldY: isInsidePlayfieldY,
    valueWithUpgrade: valueWithUpgrade
}