import * as c from 'constants';

export function pushIfNotIn(array, value) {
	if (array.indexOf(value) == -1) {
		array.push(value);
	}
}

export function drawArrow(context, fromX, fromY, toX, toY) {
	let headlen = 10;   // length of head in pixels
	let angle = Math.atan2(toY-fromY, toX-fromX);
	context.lineWidth = 5;
	context.strokeStyle = "#fff";
	context.beginPath();
	context.moveTo(fromX, fromY);
	context.lineTo(toX, toY);
	context.lineTo(toX-headlen*Math.cos(angle-Math.PI/6), toY-headlen*Math.sin(angle-Math.PI/6));
	context.moveTo(toX, toY);
	context.lineTo(toX-headlen*Math.cos(angle+Math.PI/6), toY-headlen*Math.sin(angle+Math.PI/6));
	context.stroke();
}
	
export function showMe(kingX, kingY, showMeAnimation) {

	// get arrow visible, depending on king's position
	if (kingY < 50) {
		let x = kingX;
		let y = kingY + c.KING_WIDTH/2;
		for (let j = 1; j <= 5; j++) {
			for (let i = 0; i <= 20; i++) {
				showMeAnimation.push([x, y + i]);
			}
			for (let i = 20; i >= 0; i--) {
				showMeAnimation.push([x, y + i]);
			}
		}
	} else {
		let x = kingX;
		let y = kingY - c.KING_WIDTH/2;
		for (let j = 1; j <= 5; j++) {
			for (let i = 0; i <= 20; i++) {
				showMeAnimation.push([x, y - i]);
			}
			for (let i = 20; i >= 0; i--) {
				showMeAnimation.push([x, y - i]);
			}
		}
	}
}

export function legionCountToWidth(count) {
	return count * c.LEGION_COUNT_TO_WIDTH + c.LEGION_MINIMAL_PX;
}

export function kingCountToColor(count, color) {
	return color.replace(/\d+\.?\d*\)/, (count / c.KING_COUNT) + ')');
}

export function calculateHull(points, x, y) {
	let n = points.length;
    // There must be at least 3 points
    if (n < 3) return;
  
    // Initialize Result
    let hull = [];
  
    // Find the leftmost point
    let l = 0;
    let newArray = [];
    for (let i = 0; i < n; i++) {
    	newArray.push([points[i].x, points[i].y]);
		if (points[i].x < points[l].x) {
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
    let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  
    if (val == 0) return 0;	// collinear
    return (val > 0) ? 1 : 2;	// clock or counterclock wise
}