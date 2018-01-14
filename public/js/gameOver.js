$(document).ready(function() {

	let myId = 'bla';

	if (localStorage.getItem('pixelLegionsId') && localStorage.getItem('pixelLegionsName')) {
		myId = localStorage.getItem('pixelLegionsId');
	} else {
		// send user to login
		$.get('/login', function(data) {});
	}

	$.get('/ranking', function(data) {
		let ranking = data.ranking;
		let oldRating = data.oldRating;
		let newRating = data.newRating;

		for (let i = 0; i < ranking.length; i++) {
			if (ranking[i].id == myId) {
				$('.place').html(i+1);
			}
			$('.ranking').append('<li>' + (i+1) + '. ' + ranking[i].name + '</li>')
		}

		let ratingChange = '0';
		let rating = oldRating;
		let ratingInterval = setInterval(function() {
			ratingChange = rating - oldRating;
			if (ratingChange > 0) {
				ratingChange = '+' + ratingChange;
			}
			$('.rating-change').html('New rating: ' + rating + ' (' + ratingChange + ')');
			if (rating == newRating) {
				clearInterval(ratingInterval);
			}
			rating++;
		}, 20);
	});

});