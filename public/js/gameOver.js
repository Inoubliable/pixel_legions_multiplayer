$(document).ready(function() {

	$.post('/ranking', {roomId: roomId}, function(data) {
		let ranking = data.ranking;
		let oldRating = 1500;
		let newRating = 1500;

		for (let i = 0; i < ranking.length; i++) {
			if (ranking[i].id == myId) {
				oldRating = ranking[i].rating;
				newRating = ranking[i].newRating;
				$('.place').html(i+1);

				// save users new rating
				myPlayer.rating = newRating;
				localStorage.setItem('pixelLegionsPlayer', JSON.stringify(myPlayer));
			}
			$('.ranking').append('<li>' + (i+1) + '. ' + ranking[i].name + '</li>');
		}

		let ratingPlus = (newRating - oldRating) > 0;
		let rating = oldRating;
		let intervalTime = 2000 / Math.abs(newRating - oldRating);
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
		}, intervalTime);
	});

	$('.play-again-btn').click(function(event) {
		window.location.href = '/waitingRoom';
	});

});