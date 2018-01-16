$(document).ready(function() {

	let myId = 'DefaultId';

	if (localStorage.getItem('pixelLegionsId') && localStorage.getItem('pixelLegionsName')) {
		myId = localStorage.getItem('pixelLegionsId');
	} else {
		// send user to login
		$.get('/login', function(data) {});
	}

	$.get('/ranking', function(data) {
		let ranking = data.ranking;
		let oldRating = data.oldRating;
		let newRating = 1500;

		for (let i = 0; i < ranking.length; i++) {
			if (ranking[i].id == myId) {
				newRating = ranking[i].newRating;
				$('.place').html(i+1);
			}
			$('.ranking').append('<li>' + (i+1) + '. ' + ranking[i].name + '</li>');
		}

		let ratingPlus = (newRating - oldRating) > 0;
		let rating = oldRating;
		let ratingInterval = setInterval(function() {
			ratingChange = rating - oldRating;
			if (ratingPlus) {
				ratingChange = '+' + ratingChange;
			}
			$('.rating-change').html('New rating: ' + rating + ' (' + ratingChange + ')');
			if (rating == newRating) {
				clearInterval(ratingInterval);
			}
			ratingPlus ? rating++ : rating--;
		}, 20);
	});

});