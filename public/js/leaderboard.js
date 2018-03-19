$(document).ready(function() {

	$.get('getLeaderboard', function(leaderboard) {
		for (let i = 0; i < leaderboard.length; i++) {
			$('.leaderboard').append(
				'<li class="player">' +
					'<span class="place">' + (i+1) + '</span>' +
					'<span class="name">' + leaderboard[i].name + '</span>' +
					'<span class="rating">' + leaderboard[i].rating + '</span>' +
				'</li>'
			);
		}
	});

});