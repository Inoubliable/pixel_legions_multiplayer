$(document).ready(function() {

	let myName = 'Default name';
	let myPlayer, myId, myRating;

	let query = '';
	if (localStorage.getItem('pixelLegionsPlayer')) {
		myPlayer = JSON.parse(localStorage.getItem('pixelLegionsPlayer'));
		myName = myPlayer.name;
		query += '&name=' + myName;
		if (myPlayer.id) {
			myId = myPlayer.id;
			query += '&id=' + myId;
		}
		if (myPlayer.rating) {
			myRating = myPlayer.rating;
			query += '&rating=' + myRating;
		}
	} else {
		// send user to login
		$.get('/login', function(data) {});
	}

	let socket = io('/waitingRoom', {query: query});

	socket.on('myPlayer', function(player) {
		localStorage.setItem('pixelLegionsPlayer', JSON.stringify(player));
	});

	socket.on('player joined', function(allPlayers){
		$('.players-list').html('');
		allPlayers.forEach(player => $('.players-list').append('<li>' + player.name + ' <span class="player-rating">' + player.rating + '</span></li>'));
	});

	socket.on('start game', function(players){
		// send player to game
		window.location.href = '/game';
	});

});