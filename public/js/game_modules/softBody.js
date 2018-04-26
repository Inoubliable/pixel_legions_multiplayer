import * as c from './constants';
import * as helpers from './helpers';

let m = 1;
let k = 15;
let damping = 1;

let timestep = c.UPDATE_TIMESTEP / 100;

class Point {

    constructor(x, y, isAnchor) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isAnchor = isAnchor || false;
    }
    
}

class Spring {

	constructor(point1, point2, restLengthX, restLengthY) {
		this.point1 = point1;
		this.point2 = point2;
		this.restLengthX = restLengthX || (point1.x - point2.x);
		this.restLengthY = restLengthY || (point1.y - point2.y);
	}
	
}

export function createSprings(points) {

	let springs = [];

	let anchorPoint = points[0];

	for (let i = 2; i < points.length; i++) {
		springs.push(new Spring(points[i], points[i-1]));
		springs.push(new Spring(anchorPoint, points[i]));
	}
	springs.push(new Spring(anchorPoint, points[1]));
	springs.push(new Spring(points[points.length-1], points[1]));

	return springs;

}

export function removePointAndSprings(legion) {

	let deadPoint = legion.pixels[legion.pixels.length-1];

	let deadPointX = deadPoint.x;
	let deadPointY = deadPoint.y;

	// remove springs
	for (let i = legion.springs.length-1; i >= 0; i--) {
		if ((legion.springs[i].point1 == deadPoint) || (legion.springs[i].point2 == deadPoint)) {
			legion.springs.splice(i, 1);
		}
	}
	legion.pixels.pop();

	// create imaginary (legion.pixels.length - 1) sided polygon
	let radius = helpers.legionCountToWidth(legion.count)/2;
	let imaginaryPoints = createPolygonPoints(legion.x, legion.y, radius, legion.pixels.length - 1);
	let imaginarySprings = createSprings(imaginaryPoints);

	// adjust springs' rest lengths according to imaginary polygon
	for (let i = 0; i < legion.springs.length; i++) {
		legion.springs[i].restLengthX = imaginarySprings[i].restLengthX;
		legion.springs[i].restLengthY = imaginarySprings[i].restLengthY;
	}

	// add spring between first and last point
	let newSpring = new Spring(legion.pixels[legion.pixels.length-1], legion.pixels[1], imaginarySprings[imaginarySprings.length-1].restLengthX, imaginarySprings[imaginarySprings.length-1].restLengthY);
	legion.springs.push(newSpring);

	return [deadPointX, deadPointY];

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

export function update(springs, points) {

	for (let i = 0; i < springs.length; i++) {
		let spring = springs[i];

		// spring length
		let springLengthX = spring.point1.x - spring.point2.x;
		let springLengthY = spring.point1.y - spring.point2.y;

		// point1 spring force
		let springForceX = -k * (springLengthX - spring.restLengthX);
		let springForceY = -k * (springLengthY - spring.restLengthY);
		let accelerationX = springForceX / m;
		let accelerationY = springForceY / m;

		// point1 damping
		let dampingForceX1 = damping * (spring.point1.velocityX);
		let dampingForceY1 = damping * (spring.point1.velocityY);

		// point2 damping
		let dampingForceX2 = damping * (spring.point2.velocityX);
		let dampingForceY2 = damping * (spring.point2.velocityY);

		// point1 net force
		let forceX1 = springForceX - dampingForceX1;
		let forceY1 = springForceY - dampingForceY1;

		// point2 net force
		let forceX2 = -springForceX - dampingForceX2;
		let forceY2 = -springForceY - dampingForceY2;

		// point1 acceleration
		let accelerationX1 = forceX1 / m;
		let accelerationY1 = forceY1 / m;

		// point2 acceleration
		let accelerationX2 = forceX2 / m;
		let accelerationY2 = forceY2 / m;

		// update points
		if (!spring.point1.isAnchor) {
			spring.point1.velocityX += accelerationX1 * timestep;
			spring.point1.velocityY += accelerationY1 * timestep;
		}

		if (!spring.point2.isAnchor) {
			spring.point2.velocityX += accelerationX2 * timestep;
			spring.point2.velocityY += accelerationY2 * timestep;
		}

	}

	for (let i = 0; i < points.length; i++) {
		let point = points[i];

		// point position
		point.x += point.velocityX * timestep;
		point.y += point.velocityY * timestep;
	}

}