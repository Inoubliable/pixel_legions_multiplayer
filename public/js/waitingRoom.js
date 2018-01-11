$(document).ready(function() {

	var myName = 'Default name';

	if (localStorage.getItem('pixelLegionsName')) {
		myName = localStorage.getItem('pixelLegionsName');
		localStorage.removeItem('pixelLegionsName');
	} else {
		// send user to login
		$.get('/login', function(data) {});
	}

	var socket = io('/waitingRoom', { query: "&name=" + myName});

	socket.on('player joined', function(allPlayers){
		$('#players-list').html('');
		allPlayers.map(player => $('#players-list').append('<li>' + player + '</li>'));
	});

	socket.on('start game', function(players){
		// send player to game
		window.location.href = '/game';
	});

});