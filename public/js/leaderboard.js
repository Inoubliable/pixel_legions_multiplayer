import $ from 'jquery';

import {setPageLinks} from './main';

function leaderboardJS() {

	$.get('leaderboard/', function(data) {
		let leaderboard = data.leaderboard;

		$('.leaderboard').html('');
		for (let i = 0; i < leaderboard.length; i++) {
			let player = leaderboard[i];
			let place = i + 1;
			let placeIcon = '';

			switch (place) {
				case 1:
					placeIcon = `<span class="place"><img src="assets/pl_first_place.svg"></span>`;
					break;
				case 2:
					placeIcon = `<span class="place"><img src="assets/pl_second_place.svg"></span>`;
					break;
				case 3:
					placeIcon = `<span class="place"><img src="assets/pl_third_place.svg"></span>`;
					break;
				default:
					placeIcon = `<span class="place">${place}</span>`;
					break;
			}

			$('.leaderboard').append(
				`<div class="player page-link" data-page="profile" data-name=${player.name}>
					${placeIcon}
					<span class="name">${player.name}</span>
					<span class="country">
						<span class="flag-icon flag-icon-${player.country.code}"></span>
					</span>
					<span class="rating">${player.rating}</span>
				</div>`
			);
		}

		setPageLinks();

	});

}

export default function renderLeaderboard() {
	$('.page').removeClass('visible');
	
	$('#leaderboard-page').addClass('visible');
	
	leaderboardJS();
}