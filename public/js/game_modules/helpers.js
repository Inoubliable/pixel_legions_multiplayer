import * as c from './constants';

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
	
export function showMe(kingX, kingY) {

	let showMeAnimation = [];

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

	return showMeAnimation;
}

export function legionCountToWidth(count) {
	return count * c.LEGION_COUNT_TO_WIDTH + c.LEGION_MINIMAL_PX;
}

export function kingCountToColor(count, color) {
	return color.replace(/\d+\.?\d*\)/, (count / c.KING_COUNT) + ')');
}

export function calculateHull(xCenter, yCenter, r, vertices) {
    let hull = [];

    r *= 1.2;

    for (let i = 0; i < vertices; i++) {
        let newX = r * Math.cos(2*Math.PI*i/vertices) + xCenter;
        let newY = r * Math.sin(2*Math.PI*i/vertices) + yCenter;

        hull.push([newX, newY]);
    }

    return hull;
}

export function createDeadPixelAnimation(x, y) {

	let x1 = x;
	let y1 = y - c.PIXEL_SIZE_PX;
	let x2 = x + c.PIXEL_SIZE_PX;
	let y2 = y;
	let x3 = x;
	let y3 = y + c.PIXEL_SIZE_PX;
	let x4 = x - c.PIXEL_SIZE_PX;
	let y4 = y;

	return [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
}