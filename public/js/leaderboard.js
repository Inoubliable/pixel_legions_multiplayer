$(document).ready(function() {

	$.get('getLeaderboard', function(leaderboard) {
		for (let i = 0; i < leaderboard.length; i++) {
			let place = i + 1;
			if (place == 1) {
				place = '<img src="assets/pl_first_place.png">';
			}
			$('.leaderboard').append(
				'<li class="player">' +
					'<span class="place">' + place + '</span>' +
					'<span class="name">' + leaderboard[i].name + '</span>' +
					'<span class="rating">' + leaderboard[i].rating + '</span>' +
				'</li>'
			);
		}
	});

});