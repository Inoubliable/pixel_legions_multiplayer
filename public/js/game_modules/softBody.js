import * as c from './constants';

let m = 1;
let k = 15;
let damping = 1;

let timestep = c.UPDATE_TIMESTEP / 100;

class Spring {

	constructor(point1, point2, restLengthX, restLengthY) {
		this.point1 = point1;
		this.point2 = point2;
		this.restLengthX = restLengthX || (point1.x - point2.x);
		this.restLengthY = restLengthY || (point1.y - point2.y);
	}
	
}

// create springs from center to all points
export function createSprings(points) {

	let springs = [];

	let anchorPoint = points.find(p => p.isAnchor);

	for (let i = 0; i < points.length; i++) {
		if (points[i] !== anchorPoint) {
			springs.push(new Spring(anchorPoint, points[i]));
		}
	}

	return springs;

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