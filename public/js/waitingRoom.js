$(document).ready(function() {

	let myName = 'Default name';

	if (localStorage.getItem('pixelLegionsName')) {
		myName = localStorage.getItem('pixelLegionsName');
	} else {
		// send user to login
		$.get('/login', function(data) {});
	}

	let socket = io('/waitingRoom', { query: "&name=" + myName});

	socket.on('myId', function(id) {
		myId = id;
		localStorage.setItem('pixelLegionsId', myId);
	});

	socket.on('player joined', function(allPlayers){
		$('.players-list').html('');
		allPlayers.forEach(player => $('.players-list').append('<li>' + player.name + '</li>'));
	});

	socket.on('start game', function(players){
		// send player to game
		window.location.href = '/game';
	});

});